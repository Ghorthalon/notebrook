#!/bin/bash
# Channel messaging bindings for Shell
# Provides functions to list channels, read messages, and send messages by channel name
#
# Usage: source this file to use functions, or run directly with commands
#   source channels.sh
#   list_channels "https://api.example.com" "your-token"
#   read_channel "https://api.example.com" "your-token" "channel-name"
#   read_messages "https://api.example.com" "your-token" "channel-name" [limit]
#   send_message "https://api.example.com" "your-token" "channel-name" "message content"

set -e

# List all available channels
# Args: $1 = url, $2 = token
list_channels() {
    local url="${1%/}"
    local token="$2"

    curl -s -X GET "${url}/channels" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json"
}

# Find channel ID by name
# Args: $1 = url, $2 = token, $3 = channel_name
# Returns: channel ID or empty string
find_channel_id_by_name() {
    local url="$1"
    local token="$2"
    local channel_name="$3"

    list_channels "$url" "$token" | jq -r --arg name "$channel_name" '.[] | select(.name == $name) | .id'
}

# Read channel details by name
# Args: $1 = url, $2 = token, $3 = channel_name
read_channel() {
    local url="$1"
    local token="$2"
    local channel_name="$3"

    list_channels "$url" "$token" | jq --arg name "$channel_name" '.[] | select(.name == $name)'
}

# Read messages from a channel by name
# Args: $1 = url, $2 = token, $3 = channel_name, $4 = limit (optional)
read_messages() {
    local url="${1%/}"
    local token="$2"
    local channel_name="$3"
    local limit="$4"

    local channel_id
    channel_id=$(find_channel_id_by_name "$url" "$token" "$channel_name")

    if [ -z "$channel_id" ]; then
        echo "Error: Channel not found: $channel_name" >&2
        return 1
    fi

    local endpoint="${url}/channels/${channel_id}/messages"
    if [ -n "$limit" ]; then
        endpoint="${endpoint}?limit=${limit}"
    fi

    curl -s -X GET "$endpoint" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json"
}

# Send a message to a channel by name
# Args: $1 = url, $2 = token, $3 = channel_name, $4 = content
send_message() {
    local url="${1%/}"
    local token="$2"
    local channel_name="$3"
    local content="$4"

    local channel_id
    channel_id=$(find_channel_id_by_name "$url" "$token" "$channel_name")

    if [ -z "$channel_id" ]; then
        echo "Error: Channel not found: $channel_name" >&2
        return 1
    fi

    curl -s -X POST "${url}/channels/${channel_id}/messages" \
        -H "Authorization: Bearer ${token}" \
        -H "Content-Type: application/json" \
        -d "$(jq -n --arg content "$content" '{content: $content}')"
}

# CLI mode - if script is run directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "$1" in
        list_channels)
            shift
            list_channels "$@"
            ;;
        read_channel)
            shift
            read_channel "$@"
            ;;
        read_messages)
            shift
            read_messages "$@"
            ;;
        send_message)
            shift
            send_message "$@"
            ;;
        *)
            echo "Usage: $0 {list_channels|read_channel|read_messages|send_message} <url> <token> [args...]"
            echo ""
            echo "Commands:"
            echo "  list_channels <url> <token>"
            echo "  read_channel <url> <token> <channel_name>"
            echo "  read_messages <url> <token> <channel_name> [limit]"
            echo "  send_message <url> <token> <channel_name> <content>"
            exit 1
            ;;
    esac
fi
