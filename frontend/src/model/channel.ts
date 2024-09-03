import { IMessage, Message } from "./message";

export interface IChannel {
    id: number;
    name: string;
    messages: IMessage[];
    createdAt: number;
}

export class Channel implements IChannel {
    id: number;
    name: string;
    messages: Message[];
    createdAt: number;
    private messageToIdMap: Map<number, Message>;

    constructor(channel: IChannel) {
        this.id = channel.id;
        this.name = channel.name;
        this.messages = [];
        this.messageToIdMap = new Map();
        channel.messages?.forEach((msg) => this.addMessage(new Message(msg)));
        this.createdAt = channel.createdAt;
    }

    public addMessage(message: Message): void {
        this.messages.push(message);
        this.messageToIdMap.set(message.id, message);
    }

    public removeMessage(messageId: number): void {
        this.messages = this.messages.filter(message => message.id !== messageId);
        this.messageToIdMap.delete(messageId);
    }

    public getMessage(messageId: number): Message|undefined {
        return this.messageToIdMap.get(messageId);
    }

    public getMessageByContent(content: string): Message|undefined {
        return this.messages.find(message => message.content === content);
    }

    public getMessages(): Message[] {
        return this.messages;
    }

    public getMessageIds(): number[] {
        return this.messages.map(message => message.id);
    }

    public getMessageContents(): string[] {
        return this.messages.map(message => message.content);
    }

    public getMessageId(content: string): number|undefined {
        const message = this.getMessageByContent(content);
        return message ? message.id : undefined;
    }
}