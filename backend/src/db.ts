import Database from 'better-sqlite3';
import { DB_PATH } from './config';
import { logger } from './globals';
import { readdir, readFile } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { dedupeMessages } from './jobs/dedupe-messages';

export let FTS5Enabled = true;

export const initializeDB = () => {
  logger.info("Checking fts");
  const ftstest = db.prepare(`pragma compile_options;`);
  const result = ftstest.all() as { compile_options: string }[];
  if (result.find((o) => o["compile_options"].includes("ENABLE_FTS5"))) {
    logger.info("FTS5 is enabled");
  } else {
    logger.info("FTS5 is not enabled. Attempting to load...");
    try {
      db.loadExtension('./fts5');
    } catch (e) {
      logger.warn("Failed to load FTS5 extension. Disabling FTS5");
      FTS5Enabled = false;
    }
  }

  return FTS5Enabled;
}

export const migrate = async () => {
  logger.info(`Checking for migrations...`);
  const result = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='meta'`);
  if (result.all().length === 0) {
    logger.info(`Creating meta table...`);
    db.exec(`CREATE TABLE meta (version INTEGER)`);
    db.exec(`INSERT INTO meta (version) VALUES (-1)`);
  }

  const version = db.prepare(`SELECT version FROM meta`).get() as { version: number };
  logger.info(`Migration version: ${version.version}`);
  // we are in bun.js. use its API's to read the file list.
  logger.info(`Searching for migrations in ${join("migrations")}`);
  const files = await readdir(join("migrations"));

  for (const file of files) {
    const [fileVersion, ...rest] = file.split("_");
    logger.info(`Found migration ${fileVersion}`);
    if (fileVersion && Number(fileVersion) > version.version) {
      logger.info(`Running migration ${file}`);
      const sql = new TextDecoder().decode(await readFile(join(`migrations/${file}`)));
      db.exec(sql);
      const query = db.prepare(`UPDATE meta SET version = ($version)`);
      const res = query.run({ version: fileVersion })
      logger.info(`Migration ${file} done`);
    }
  }
  logger.info(`Migrations done`);
}

logger.info(`Loading database at ${DB_PATH}`);

// Ensure parent directory exists (avoid better-sqlite3 directory error)
try {
  const dir = dirname(DB_PATH);
  // Skip if dir is current directory or drive root-like (e.g., "C:")
  const isTrivialDir = dir === '.' || dir === '' || /^[A-Za-z]:\\?$/.test(dir);
  if (!isTrivialDir && !existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
} catch (e) {
  logger.warn(`Failed to ensure DB directory exists: ${e}`);
}

export const db = new Database(DB_PATH);





initializeDB();
migrate().then(() => dedupeMessages());
