/**
 * Channel messaging bindings for TypeScript
 * Provides functions to list channels, read messages, and send messages by channel name
 */

export interface Channel {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Message {
  id: string;
  content: string;
  channelId: string;
  timestamp?: string;
  author?: string;
  [key: string]: unknown;
}

export interface ChannelClientConfig {
  url: string;
  token: string;
}

export class ChannelClient {
  private url: string;
  private token: string;

  constructor(config: ChannelClientConfig) {
    this.url = config.url.replace(/\/$/, '');
    this.token = config.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.url}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List all available channels
   */
  async listChannels(): Promise<Channel[]> {
    return this.request<Channel[]>('/channels');
  }

  /**
   * Find a channel ID by its name
   */
  async findChannelIdByName(name: string): Promise<string | null> {
    const channels = await this.listChannels();
    const channel = channels.find(c => c.name === name);
    return channel?.id ?? null;
  }

  /**
   * Read channel details by name
   */
  async readChannel(name: string): Promise<Channel | null> {
    const channels = await this.listChannels();
    return channels.find(c => c.name === name) ?? null;
  }

  /**
   * Read messages from a channel by name
   */
  async readMessages(channelName: string, limit?: number): Promise<Message[]> {
    const channelId = await this.findChannelIdByName(channelName);
    if (!channelId) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    const query = limit ? `?limit=${limit}` : '';
    return this.request<Message[]>(`/channels/${channelId}/messages${query}`);
  }

  /**
   * Send a message to a channel by name
   */
  async sendMessage(channelName: string, content: string): Promise<Message> {
    const channelId = await this.findChannelIdByName(channelName);
    if (!channelId) {
      throw new Error(`Channel not found: ${channelName}`);
    }

    return this.request<Message>(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

// Convenience functions for standalone usage
export function createClient(url: string, token: string): ChannelClient {
  return new ChannelClient({ url, token });
}

export async function listChannels(url: string, token: string): Promise<Channel[]> {
  return createClient(url, token).listChannels();
}

export async function readChannel(url: string, token: string, name: string): Promise<Channel | null> {
  return createClient(url, token).readChannel(name);
}

export async function readMessages(url: string, token: string, channelName: string, limit?: number): Promise<Message[]> {
  return createClient(url, token).readMessages(channelName, limit);
}

export async function sendMessage(url: string, token: string, channelName: string, content: string): Promise<Message> {
  return createClient(url, token).sendMessage(channelName, content);
}
