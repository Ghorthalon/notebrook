import { db } from "../db";
import { events } from "../globals";

export const uploadFile = async (channelId: string, messageId: string, filePath: string, fileType: string, fileSize: number, originalName: string) => {
    const query = db.prepare(`INSERT INTO files (channelId, filePath, fileType, fileSize, originalName) VALUES ($channelId, $filePath, $fileType, $fileSize, $originalName)`);
    const result = query.run({ channelId: channelId, filePath: filePath, fileType: fileType, fileSize: fileSize, originalName: originalName });

    const fileId = result.lastInsertRowid;

    const updateQuery = db.prepare(`UPDATE messages SET fileId = $fileId WHERE id = $messageId`);
    const result2 = updateQuery.run({ fileId: fileId, messageId: messageId });

    events.emit('file-uploaded', result.lastInsertRowid, channelId, messageId, filePath, fileType, fileSize, originalName);
    return result2; ''
}

export const getFiles = async (messageId: string) => {
    const query = db.prepare(`SELECT * FROM files WHERE messageId = $messageId`);
    const rows = query.all({ messageId: messageId });
    return rows;
}