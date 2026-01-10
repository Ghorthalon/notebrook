"""
Channel messaging bindings for Python
Provides functions to list channels, read messages, and send messages by channel name
"""

import requests
from typing import Optional
from dataclasses import dataclass


@dataclass
class Channel:
    id: str
    name: str
    data: dict = None

    @classmethod
    def from_dict(cls, d: dict) -> "Channel":
        return cls(id=d["id"], name=d["name"], data=d)


@dataclass
class Message:
    id: str
    content: str
    channel_id: str
    timestamp: Optional[str] = None
    author: Optional[str] = None
    data: dict = None

    @classmethod
    def from_dict(cls, d: dict) -> "Message":
        return cls(
            id=d["id"],
            content=d["content"],
            channel_id=d.get("channelId", d.get("channel_id", "")),
            timestamp=d.get("timestamp"),
            author=d.get("author"),
            data=d,
        )


class ChannelClient:
    def __init__(self, url: str, token: str):
        self.url = url.rstrip("/")
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> dict:
        response = self.session.request(method, f"{self.url}{endpoint}", **kwargs)
        response.raise_for_status()
        return response.json()

    def list_channels(self) -> list[Channel]:
        """List all available channels"""
        data = self._request("GET", "/channels")
        return [Channel.from_dict(c) for c in data]

    def find_channel_id_by_name(self, name: str) -> Optional[str]:
        """Find a channel ID by its name"""
        channels = self.list_channels()
        for channel in channels:
            if channel.name == name:
                return channel.id
        return None

    def read_channel(self, name: str) -> Optional[Channel]:
        """Read channel details by name"""
        channels = self.list_channels()
        for channel in channels:
            if channel.name == name:
                return channel
        return None

    def read_messages(self, channel_name: str, limit: Optional[int] = None) -> list[Message]:
        """Read messages from a channel by name"""
        channel_id = self.find_channel_id_by_name(channel_name)
        if not channel_id:
            raise ValueError(f"Channel not found: {channel_name}")

        params = {}
        if limit:
            params["limit"] = limit

        data = self._request("GET", f"/channels/{channel_id}/messages", params=params)
        return [Message.from_dict(m) for m in data]

    def send_message(self, channel_name: str, content: str) -> Message:
        """Send a message to a channel by name"""
        channel_id = self.find_channel_id_by_name(channel_name)
        if not channel_id:
            raise ValueError(f"Channel not found: {channel_name}")

        data = self._request("POST", f"/channels/{channel_id}/messages", json={"content": content})
        return Message.from_dict(data)


def create_client(url: str, token: str) -> ChannelClient:
    """Create a new channel client"""
    return ChannelClient(url, token)


def list_channels(url: str, token: str) -> list[Channel]:
    """List all available channels"""
    return create_client(url, token).list_channels()


def read_channel(url: str, token: str, name: str) -> Optional[Channel]:
    """Read channel details by name"""
    return create_client(url, token).read_channel(name)


def read_messages(url: str, token: str, channel_name: str, limit: Optional[int] = None) -> list[Message]:
    """Read messages from a channel by name"""
    return create_client(url, token).read_messages(channel_name, limit)


def send_message(url: str, token: str, channel_name: str, content: str) -> Message:
    """Send a message to a channel by name"""
    return create_client(url, token).send_message(channel_name, content)
