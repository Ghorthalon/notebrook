//! Channel messaging bindings for Rust
//! Provides functions to list channels, read messages, and send messages by channel name

use reqwest::blocking::Client;
use reqwest::header::{HeaderMap, HeaderName, HeaderValue, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ChannelError {
    #[error("HTTP request failed: {0}")]
    RequestError(#[from] reqwest::Error),
    #[error("Channel not found: {0}")]
    ChannelNotFound(String),
    #[error("Invalid header value")]
    InvalidHeader,
    #[error("Payload too large")]
    PayloadTooLarge,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Channel {
    pub id: i64,
    pub name: String,
    #[serde(flatten)]
    pub extra: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct ChannelsResponse {
    channels: Vec<Channel>,
}

fn deserialize_string_or_i64<'de, D>(deserializer: D) -> Result<i64, D::Error>
where
    D: serde::Deserializer<'de>,
{
    use serde::de::{self, Visitor};
    use std::fmt;

    struct StringOrI64Visitor;

    impl<'de> Visitor<'de> for StringOrI64Visitor {
        type Value = i64;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a string or i64")
        }

        fn visit_i64<E>(self, v: i64) -> Result<i64, E> {
            Ok(v)
        }

        fn visit_u64<E>(self, v: u64) -> Result<i64, E> {
            Ok(v as i64)
        }

        fn visit_str<E>(self, v: &str) -> Result<i64, E>
        where
            E: de::Error,
        {
            v.parse().map_err(de::Error::custom)
        }
    }

    deserializer.deserialize_any(StringOrI64Visitor)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    #[serde(deserialize_with = "deserialize_string_or_i64")]
    pub id: i64,
    pub content: String,
    #[serde(alias = "channelId", alias = "channel_id", deserialize_with = "deserialize_string_or_i64")]
    pub channel_id: i64,
    #[serde(flatten)]
    pub extra: serde_json::Value,
}

#[derive(Debug, Serialize)]
struct SendMessagePayload {
    content: String,
}

#[derive(Debug, Serialize)]
struct CreateChannelPayload {
    name: String,
}

pub struct ChannelClient {
    url: String,
    client: Client,
}

impl ChannelClient {
    pub fn new(url: &str, token: &str) -> Result<Self, ChannelError> {
        let mut headers = HeaderMap::new();
        headers.insert(
            HeaderName::from_static("authorization"),
            HeaderValue::from_str(token).map_err(|_| ChannelError::InvalidHeader)?,
        );
        headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

        let client = Client::builder().default_headers(headers).build()?;

        Ok(Self {
            url: url.trim_end_matches('/').to_string(),
            client,
        })
    }

    /// List all available channels
    pub fn list_channels(&self) -> Result<Vec<Channel>, ChannelError> {
        let response = self
            .client
            .get(format!("{}/channels", self.url))
            .send()?
            .error_for_status()?;

        let wrapper: ChannelsResponse = response.json()?;
        Ok(wrapper.channels)
    }

    /// Find a channel ID by its name
    pub fn find_channel_id_by_name(&self, name: &str) -> Result<Option<i64>, ChannelError> {
        let channels = self.list_channels()?;
        Ok(channels.into_iter().find(|c| c.name == name).map(|c| c.id))
    }

    /// Read channel details by name
    pub fn read_channel(&self, name: &str) -> Result<Option<Channel>, ChannelError> {
        let channels = self.list_channels()?;
        Ok(channels.into_iter().find(|c| c.name == name))
    }

    /// Create a new channel
    pub fn create_channel(&self, name: &str) -> Result<Channel, ChannelError> {
        let payload = CreateChannelPayload {
            name: name.to_string(),
        };

        let response = self
            .client
            .post(format!("{}/channels/", self.url))
            .json(&payload)
            .send()?
            .error_for_status()?;

        Ok(response.json()?)
    }

    /// Read messages from a channel by name
    pub fn read_messages(
        &self,
        channel_name: &str,
        limit: Option<u32>,
    ) -> Result<Vec<Message>, ChannelError> {
        let channel_id = self
            .find_channel_id_by_name(channel_name)?
            .ok_or_else(|| ChannelError::ChannelNotFound(channel_name.to_string()))?;

        let mut url = format!("{}/channels/{}/messages", self.url, channel_id);
        if let Some(limit) = limit {
            url.push_str(&format!("?limit={}", limit));
        }

        let response = self.client.get(&url).send()?.error_for_status()?;

        Ok(response.json()?)
    }

    /// Send a message to a channel by name, creating the channel if it doesn't exist
    pub fn send_message(&self, channel_name: &str, content: &str) -> Result<Message, ChannelError> {
        let channel_id = match self.find_channel_id_by_name(channel_name)? {
            Some(id) => id,
            None => {
                // Channel doesn't exist, create it
                let channel = self.create_channel(channel_name)?;
                channel.id
            }
        };

        let payload = SendMessagePayload {
            content: content.to_string(),
        };

        let response = self
            .client
            .post(format!("{}/channels/{}/messages", self.url, channel_id))
            .json(&payload)
            .send()?;

        // Check for 413 Payload Too Large specifically
        if response.status() == reqwest::StatusCode::PAYLOAD_TOO_LARGE {
            return Err(ChannelError::PayloadTooLarge);
        }

        let response = response.error_for_status()?;
        Ok(response.json()?)
    }
}

/// Create a new channel client
pub fn create_client(url: &str, token: &str) -> Result<ChannelClient, ChannelError> {
    ChannelClient::new(url, token)
}

/// List all available channels
pub fn list_channels(url: &str, token: &str) -> Result<Vec<Channel>, ChannelError> {
    create_client(url, token)?.list_channels()
}

/// Read channel details by name
pub fn read_channel(url: &str, token: &str, name: &str) -> Result<Option<Channel>, ChannelError> {
    create_client(url, token)?.read_channel(name)
}

/// Create a new channel
pub fn create_channel(url: &str, token: &str, name: &str) -> Result<Channel, ChannelError> {
    create_client(url, token)?.create_channel(name)
}

/// Read messages from a channel by name
pub fn read_messages(
    url: &str,
    token: &str,
    channel_name: &str,
    limit: Option<u32>,
) -> Result<Vec<Message>, ChannelError> {
    create_client(url, token)?.read_messages(channel_name, limit)
}

/// Send a message to a channel by name
pub fn send_message(
    url: &str,
    token: &str,
    channel_name: &str,
    content: &str,
) -> Result<Message, ChannelError> {
    create_client(url, token)?.send_message(channel_name, content)
}
