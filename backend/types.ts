export interface Channel {
    id: number;
    name: string;
    created_at: string;
}

export interface Message {
    id: number;
    channel_id: number;
    content: string;
    created_at: string;
}

export interface File {
    id: number;
    channel_id: number;
    message_id: number;
    file_path: string;
    file_type: string;
    created_at: string;
}