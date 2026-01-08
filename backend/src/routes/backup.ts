import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth';
import { db, FTS5Enabled } from '../db';
import { DB_PATH } from '../config';
import { logger } from '../globals';
import Database from 'better-sqlite3';
import multer from 'multer';
import { unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export const router = Router();

const upload = multer({ dest: tmpdir() });

// GET /backup - Download the entire database as a .db file
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    logger.info('Creating database backup...');

    // Use better-sqlite3's backup API to create a safe copy
    const backupPath = join(tmpdir(), `notebrook-backup-${Date.now()}.db`);
    await db.backup(backupPath);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `notebrook-backup-${timestamp}.db`;

    res.download(backupPath, filename, async (err) => {
      // Clean up temp file after download
      try {
        await unlink(backupPath);
      } catch (e) {
        logger.warn(`Failed to clean up backup temp file: ${e}`);
      }

      if (err) {
        logger.critical(`Backup download error: ${err}`);
      } else {
        logger.info('Backup download completed');
      }
    });
  } catch (error) {
    logger.critical(`Backup failed: ${error}`);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// POST /restore - Upload a .db file and restore the database
router.post('/', authenticate, upload.single('database'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No database file provided' });
  }

  const uploadedPath = req.file.path;

  try {
    logger.info(`Restoring database from uploaded file: ${uploadedPath}`);

    // Open the uploaded database to validate and read data
    const uploadedDb = new Database(uploadedPath, { readonly: true });

    // Validate that it has the expected tables
    const tables = uploadedDb.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all() as { name: string }[];
    const tableNames = tables.map(t => t.name);

    if (!tableNames.includes('channels') || !tableNames.includes('messages')) {
      uploadedDb.close();
      await unlink(uploadedPath);
      return res.status(400).json({ error: 'Invalid backup file: missing required tables' });
    }

    // Read all data from uploaded database
    const channels = uploadedDb.prepare('SELECT * FROM channels').all();
    const messages = uploadedDb.prepare('SELECT * FROM messages').all();
    const files = tableNames.includes('files')
      ? uploadedDb.prepare('SELECT * FROM files').all()
      : [];
    const meta = tableNames.includes('meta')
      ? uploadedDb.prepare('SELECT * FROM meta').all()
      : [];

    uploadedDb.close();

    // Begin transaction to restore data
    const transaction = db.transaction(() => {
      // Clear existing data (order matters due to foreign keys)
      if (FTS5Enabled) {
        db.exec('DELETE FROM messages_fts');
      }
      db.exec('DELETE FROM messages');
      db.exec('DELETE FROM files');
      db.exec('DELETE FROM channels');

      // Reset auto-increment counters
      db.exec(`DELETE FROM sqlite_sequence WHERE name IN ('channels', 'messages', 'files')`);

      // Insert channels
      if (channels.length > 0) {
        const insertChannel = db.prepare(`
          INSERT INTO channels (id, name, created_at) VALUES (@id, @name, @created_at)
        `);
        for (const channel of channels) {
          insertChannel.run(channel);
        }
      }

      // Insert files first (messages reference files)
      if (files.length > 0) {
        const insertFile = db.prepare(`
          INSERT INTO files (id, channel_id, file_path, file_type, file_size, original_name, created_at)
          VALUES (@id, @channel_id, @file_path, @file_type, @file_size, @original_name, @created_at)
        `);
        for (const file of files) {
          insertFile.run(file);
        }
      }

      // Insert messages
      if (messages.length > 0) {
        const insertMessage = db.prepare(`
          INSERT INTO messages (id, channel_id, content, file_id, checked, created_at)
          VALUES (@id, @channel_id, @content, @file_id, @checked, @created_at)
        `);
        for (const message of messages) {
          insertMessage.run(message);
        }

        // Rebuild FTS index
        if (FTS5Enabled) {
          db.exec(`INSERT INTO messages_fts(messages_fts) VALUES('rebuild')`);
        }
      }
    });

    transaction();

    // Clean up uploaded file
    await unlink(uploadedPath);

    logger.info('Database restore completed successfully');
    res.json({
      success: true,
      message: 'Database restored successfully',
      stats: {
        channels: channels.length,
        messages: messages.length,
        files: files.length
      }
    });
  } catch (error) {
    logger.critical(`Restore failed: ${error}`);

    // Clean up uploaded file on error
    try {
      await unlink(uploadedPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    res.status(500).json({ error: 'Failed to restore database: ' + (error as Error).message });
  }
});
