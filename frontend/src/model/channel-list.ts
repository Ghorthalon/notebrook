import { Channel, IChannel } from "./channel";

export interface IChannelList {
    channels: IChannel[]
}

export class ChannelList implements IChannelList {
    channels: Channel[] = [];

    constructor(channels?: IChannelList) {
        this.channels = channels?.channels?.map((chan) => new Channel(chan)) || [];
    }

    public addChannel(channel: Channel): void {
        this.channels.push(channel);
    }

    public removeChannel(channelId: number): void {
        this.channels = this.channels.filter(channel => channel.id !== channelId);
    }

    public getChannel(channelId: number): Channel|undefined {
        return this.channels.find(channel => channel.id === channelId);
    }

    public getChannelByName(channelName: string): IChannel|undefined {
        return this.channels.find(channel => channel.name === channelName);
    }

    public getChannels(): Channel[] {
        return this.channels;
    }

    public getChannelIds(): number[] {
        return this.channels.map(channel => channel.id);
    }

    public getChannelNames(): string[] {
        return this.channels.map(channel => channel.name);
    }

    public getChannelId(channelName: string): number|undefined {
        const channel = this.getChannelByName(channelName);
        return channel ? channel.id : undefined;
    }
}