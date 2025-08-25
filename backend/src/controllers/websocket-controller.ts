import { events } from "../globals";
import { WebSocket } from "ws";

export const attachEvents = (ws: WebSocket) => {
    events.on('file-uploaded', (id, channelId, messageId, filePath, fileType, fileSize, originalName) => {
        ws.send(JSON.stringify({ type: 'file-uploaded', data: {id, channelId, messageId, filePath, fileType, fileSize, originalName    }}));
    });
    events.on('message-created', (id, channelId, content) => {
        ws.send(JSON.stringify({ type: 'message-created', data: {id, channelId, content }}));
    }); 
    events.on('message-updated', (id, content) => {
        ws.send(JSON.stringify({ type: 'message-updated', data: {id, content }}));
    });
    events.on('message-deleted', (id) => {
        ws.send(JSON.stringify({ type: 'message-deleted', data: {id }}));
    });
    events.on('message-moved', (messageId, sourceChannelId, targetChannelId) => {
        ws.send(JSON.stringify({ type: 'message-moved', data: {messageId, sourceChannelId, targetChannelId }}));
    });
    events.on('channel-created', (channel) => {
        ws.send(JSON.stringify({ type: 'channel-created', data: {channel }}));
    });
    events.on('channel-deleted', (id) => {
        ws.send(JSON.stringify({ type: 'channel-deleted', data: {id} }));
    });
    events.on('channel-merged', (channelId, targetChannelId) => {
        ws.send(JSON.stringify({ type: 'channel-merged', data: {channelId, targetChannelId }}));
    });
    events.on('channel-updated', (id, name) => {
        ws.send(JSON.stringify({ type: 'channel-updated', data: {id, name }}));
    });
}