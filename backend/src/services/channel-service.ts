import { db } from "../db";
import { events } from "../globals";

export const createChannel = async (name: string) => {
    const query = db.prepare(`INSERT INTO channels (name) VALUES ($name)`);
    const result = query.run({ name: name });
    events.emit('channel-created', { id: result.lastInsertRowid, name });
    return { id: result.lastInsertRowid, name };
}

export const deleteChannel = async (id: string) => {
    const query = db.prepare(`DELETE FROM channels WHERE id = ($channelId)`);
    const result = query.run({channelId: id});
    // No need to manually delete messages and files as they are set to cascade on delete in the schema
    events  .emit('channel-deleted', id);
    return result;
}

export const getChannels = async () => {
    const query = db.prepare(`SELECT * FROM channels`);
    const rows = query.all();
    return rows;
}

export const mergeChannel = async (channelId: string, targetChannelId: string) => {
    const query = db.prepare(`UPDATE messages SET channelId = $targetChannelId WHERE channelId = $channelId`);
    const result = query.run({ channelId: channelId, targetChannelId: targetChannelId });
    events.emit('channel-merged', channelId, targetChannelId);
    return result;
}

export const updateChannel = async (id: string, name: string) => {
    const query = db.prepare(`UPDATE channels SET name = $name WHERE id = $id`);
    const result = query.run({ id: id, name: name });
    events.emit('channel-updated', id, name);
    return result;
}