import { IChannelList } from "./channel-list";
import { IUnsentMessage } from "./unsent-message";

export interface IState {
    token: string;
    apiUrl: string;
    defaultChannelId: number;
    channelList: IChannelList;
    unsentMessages: IUnsentMessage[];
}