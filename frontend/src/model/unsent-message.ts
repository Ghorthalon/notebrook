export interface IUnsentMessage {
    id: number;
    content: string;
    blob?: Blob;
    createdAt: string;
    channelId: number;
}

export class UnsentMessage implements IUnsentMessage {
    id: number;
    content: string;
    blob?: Blob;
    createdAt: string;
    channelId: number;

    constructor(message: IUnsentMessage) {
        this.id = message.id;
        this.content = message.content;
        this.blob = message.blob;
        this.createdAt = message.createdAt;
        this.channelId = message.channelId;
    }
}