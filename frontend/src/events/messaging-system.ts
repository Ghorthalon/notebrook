export type Message<T> = {
    type: string,
    data?: T,
};

export type MessageHandler<T> = (message: Message<T>) => void;

export class MessagingSystem {
    private handlers: Record<string, MessageHandler<any>[]> = {};

    public registerHandler<T>(type: string, handler: MessageHandler<T>): void {
        if (!this.handlers[type]) {
            this.handlers[type] = [];
        }
        if (!this.handlers[type].includes(handler)) {
            this.handlers[type].push(handler);
        }
    }

    public unregisterHandler<T>(type: string, handler: MessageHandler<T>): void {
        if (this.handlers[type]) {
            this.handlers[type] = this.handlers[type].filter(h => h !== handler);
        }
    }

    public registerHandlerOnce<T>(type: string, handler: MessageHandler<T>): void {
        const wrappedHandler = (message: Message<T>) => {
            handler(message);
            this.unregisterHandler(type, wrappedHandler);
        };
        this.registerHandler(type, wrappedHandler);
    }

    public waitForMessage<T>(type: string, timeout?: number): Promise<T> {
        return new Promise((resolve, reject) => {
            const handler = (message: Message<T>) => {
                if (timer) clearTimeout(timer);
                resolve(message.data!);
                this.unregisterHandler(type, handler);
            };

            this.registerHandler(type, handler);

            let timer: ReturnType<typeof setTimeout> | undefined;
            if (timeout) {
                timer = setTimeout(() => {
                    this.unregisterHandler(type, handler);
                    reject(new Error(`Timeout waiting for message of type '${type}'`));
                }, timeout);
            }
        });
    }

    public sendMessage<T>(message: Message<T>): void {
        const handlers = this.handlers[message.type];
        if (handlers) {
            handlers.forEach(handler => handler(message));
        }
    }
}
