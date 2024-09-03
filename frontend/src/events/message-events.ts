export type MessageCreated = {
    channelId: string,
    id: string,
    content: string,
};

export type MessageDeleted = {
    channelId: string,
    messageId: string,
};

export type MessageUpdated = {
    id: string,
    content: string,
};

export type ChannelCreated = {
    name: string,
};

export type ChannelDeleted = {
    channelId: string,
};

export type ChannelUpdated = {
    channelId: string,
    name: string,
};