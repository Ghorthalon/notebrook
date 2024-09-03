import { MessagingSystem } from "./events/messaging-system";
import { IChannel, Channel } from "./model/channel";
import { IChannelList, ChannelList } from "./model/channel-list";
import { IState } from "./model/state";
import { IUnsentMessage, UnsentMessage } from "./model/unsent-message";
import { get, set, clear } from "idb-keyval";


export class State implements IState {
    token!: string;
    apiUrl!: string;
    channelList!: ChannelList;
    unsentMessages!: IUnsentMessage[];
    currentChannel!: Channel | null;
    defaultChannelId!: number;
    public events: MessagingSystem;

    constructor() {
        this.token = "";
        this.channelList = new ChannelList();
        this.unsentMessages = [];
        this.events = new MessagingSystem();
    }

    public getToken(): string {
        return this.token;
    }

    public setToken(token: string): void {
        this.token = token;
    }

    public getChannelList(): IChannelList {
        return this.channelList;
    }

    public setChannelList(channelList: ChannelList): void {
        this.channelList = channelList;
    }

    public getUnsentMessages(): IUnsentMessage[] {
        return this.unsentMessages;
    }

    public setUnsentMessages(unsentMessages: IUnsentMessage[]): void {
        this.unsentMessages = unsentMessages;
    }

    public async save(): Promise<void> {
        // stringify everything here except the currentChannel object.
        const { currentChannel, events, ...state } = this;
        await set("notebrook", state);
    }

    public async load(): Promise<void> {
        const saved = await get("notebrook");
        if (saved) {
            this.token = saved.token;
            this.apiUrl = saved.apiUrl;
            this.channelList = new ChannelList( saved.channelList);
            this.unsentMessages = saved.unsentMessages.map((message: IUnsentMessage) => new UnsentMessage(message));
            this.defaultChannelId = saved.defaultChannelId;
        }
    }

    public async clear(): Promise<void> {
        this.token = "";
        this.channelList = new ChannelList();
        this.unsentMessages = [];
        this.currentChannel = null;
        this.defaultChannelId = -1;

        await clear();
    }

    public getChannelById(id: number) {
        return this.channelList.getChannel(id);
    }

    public getChannelByName(name: string) {
        return this.channelList.getChannelByName(name);
    }

    public findChannelByQuery(query: string) {      
        return this.channelList.channels.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
    }

    public addChannel(channel: Channel) {
        if (!this.channelList.channels.find((c) => c.id === channel.id)) this.channelList.channels.push(channel);
    }

    public removeChannel(channel: IChannel) {
        this.channelList.channels = this.channelList.channels.filter((c) => c.id !== channel.id);
    }

    public addUnsentMessage(message: UnsentMessage) {
        this.unsentMessages.push(message);
    }

    public removeUnsentMessage(message: IUnsentMessage) {
        this.unsentMessages = this.unsentMessages.filter((m) => m !== message);
    }

    public getChannels() {
        return this.channelList.channels;
    }

    public getCurrentChannel() {
        return this.currentChannel;
    }

    public setCurrentChannel(channel: Channel) {
        this.currentChannel = channel;
    }

    public getDefaultChannelId() {
        return this.defaultChannelId;
    }

    public setDefaultChannelId(id: number) {
        this.defaultChannelId = id;
    }

    public getApiUrl() {
        return this.apiUrl;
    }

    public setApiUrl(url: string) {
        this.apiUrl = url;
    }

    public getMessageById(id: number) {
        return this.currentChannel!.getMessage(id);
    }
}

export const state = new State();