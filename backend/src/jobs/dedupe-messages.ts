import { db, FTS5Enabled } from "../db";
import { logger } from "../globals";

// Workaround for an iOS app bug that occasionally posts the same message
// content twice in a single channel. Runs once on startup; keeps the
// earliest row (lowest id) per (channelId, content, fileId) group.
export const dedupeMessages = () => {
  const findDupes = db.prepare(`
    SELECT m1.id AS id FROM messages m1
    WHERE EXISTS (
      SELECT 1 FROM messages m2
      WHERE m2.channelId IS m1.channelId
      AND m2.content IS m1.content
      AND m2.fileId IS m1.fileId
      AND m2.id < m1.id
    )
  `);
  const dupeIds = (findDupes.all() as { id: number }[]).map((r) => r.id);

  if (dupeIds.length === 0) {
    logger.info("Dedupe: no duplicate messages found.");
    return;
  }

  logger.info(`Dedupe: removing ${dupeIds.length} duplicate message(s).`);

  const deleteMsg = db.prepare(`DELETE FROM messages WHERE id = ?`);
  const deleteFts = FTS5Enabled
    ? db.prepare(`DELETE FROM messages_fts WHERE rowid = ?`)
    : null;

  const tx = db.transaction((ids: number[]) => {
    for (const id of ids) {
      deleteMsg.run(id);
      if (deleteFts) deleteFts.run(id);
    }
  });

  tx(dupeIds);
  logger.info(`Dedupe: removed ${dupeIds.length} duplicate message(s).`);
};
