export interface IMessage {
    id: number;
    channelId?: number;
    content: string;
    fileId?: number;
    fileType?: string;
    filePath?: string;
    fileSize?: number;
    originalName?: string;
    createdAt: string;
}

export class Message implements IMessage {
    id: number;
    content: string;
    fileId?: number;
    fileType?: string;
    filePath?: string;
    fileSize?: number;
    originalName?: string;
    createdAt: string;

    constructor(message: IMessage) {
        this.id = message.id;
        this.content = message.content;
        this.fileId = message.fileId;
        this.fileType = message.fileType;
        this.filePath = message.filePath;
        this.fileSize = message.fileSize;
        this.originalName = message.originalName;
        this.createdAt = message.createdAt;
    }
}