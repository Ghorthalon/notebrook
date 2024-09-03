import { IChannel } from "./model/channel";
import { IChannelList } from "./model/channel-list";
import { IMessage } from "./model/message";
import { IUnsentMessage } from "./model/unsent-message";
import { state } from "./state";


export const API = {
    token: "",
    path: "http://localhost:3000",

    async request(method: string, path: string, body?: any) {
        if (!API.token) {
            throw new Error("API token was not set.");
        }
        return fetch(`${API.path}/${path}`, {
            method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": API.token
            },
            body: JSON.stringify(body),
        });
    },

    async checkToken() {
        const response = await API.request("GET", "check-token");
        if (response.status !== 200) {
            throw new Error("Invalid token in request");
        }
    },

    async getChannels() {
        const response = await API.request("GET", "channels");
        const json = await response.json();
        return json.channels as IChannel[];
    },

    async getChannel(id: string) {
        const response = await API.request("GET", `channels/${id}`);
        const json = await response.json();
        return json.channel as IChannel;
    },

    async createChannel(name: string) {
        const response = await API.request("POST", "channels", { name });
        const json = await response.json();
        return json as IChannel;
    },

    async deleteChannel(id: string) {
        await API.request("DELETE", `channels/${id}`);
    },

    async getMessages(channelId: string) {
        const response = await API.request("GET", `channels/${channelId}/messages`);
        console.log(response)
        const json = await response.json();
        return json.messages as IMessage[];
    },

    async createMessage(channelId: string, content: string) {
        const response = await API.request("POST", `channels/${channelId}/messages`, { content });
        const json = await response.json();
        return json as IMessage;
    },

    async deleteMessage(channelId: string, messageId: string) {
        await API.request("DELETE", `channels/${channelId}/messages/${messageId}`);
    },

    async uploadFile(channelId: string, messageId: string, file: File | Blob) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API.path}/channels/${channelId}/messages/${messageId}/files`, {
            method: "POST",
            headers: {
                "Authorization": API.token
            },
            body: formData,
        });

        const json = await response.json();
        return json;
    },

    async mergeChannels(channelId: string, targetChannelId: string) {
        await API.request("PUT", `channels/${channelId}/merge`, { targetChannelId });
    },

    async search(query: string, channelId?: string) {
        const queryPath = channelId ? `search?query=${encodeURIComponent(query)}&channelId=${channelId}` : `search?query=${encodeURIComponent(query)}`;
        const response = await API.request("GET", queryPath);
        const json = await response.json();
        return json.results as IMessage[];
    },

    async getFiles(channelId: string, messageId: string) {
        const response = await API.request("GET", `channels/${channelId}/messages/${messageId}/files`);
        const json = await response.json();
        return json.files as string[];
    }
}