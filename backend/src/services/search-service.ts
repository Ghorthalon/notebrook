import { db, FTS5Enabled } from "../db";

export const search = async (query: string, channelId?: string) => {
    let sql: string;
    let params: any;

    if (FTS5Enabled) {
        if (channelId) {
            sql = `
          SELECT messages.id, messages.channelId, messages.content, messages.createdAt
          FROM messages_fts
          JOIN messages ON messages_fts.rowid = messages.id
          WHERE messages_fts MATCH lower($query) AND messages.channelId = $channelId
        `;
            params = { channelId: channelId, query: (query || '').toString().toLowerCase() };
        } else {
            sql = `
          SELECT messages.id, messages.channelId, messages.content, messages.createdAt
          FROM messages_fts
          JOIN messages ON messages_fts.rowid = messages.id
          WHERE messages_fts MATCH lower($query)
        `;
            params = { query: (query || '').toString().toLowerCase() };
        }
    } else {
        console.log("Performing search without FTS5. This might be very slow.");
        if (channelId) {
            sql = `
            SELECT * FROM messages WHERE LOWER(content) LIKE '%' || LOWER($query) || '%' AND channelId = $channelId
          `;
            params = { channelId: channelId, query: query };
        } else {
            sql = `
            SELECT * FROM messages WHERE LOWER(content) LIKE '%' || LOWER($query) || '%'
          `;
            params = { query: query };
        }
    }

    const sqlquery = db.prepare(sql);
    const rows = sqlquery.all(params);

    return rows;
}