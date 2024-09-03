-- 1. Create a backup of the existing tables
CREATE TABLE channels_backup AS SELECT * FROM channels;
CREATE TABLE files_backup AS SELECT * FROM files;
CREATE TABLE messages_backup AS SELECT * FROM messages;

-- 2. Drop the existing tables
DROP TABLE channels;
DROP TABLE files;
DROP TABLE messages;

-- 3. Recreate the tables with the updated schema
CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    createdAt DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channelId INTEGER,
    filePath TEXT,
    fileType TEXT,
    fileSize INTEGER,
    originalName TEXT,
    createdAt DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (channelId) REFERENCES channels (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channelId INTEGER,
    content TEXT,
    fileId INTEGER NULL,
    createdAt DATETIME DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (channelId) REFERENCES channels (id) ON DELETE CASCADE,
    FOREIGN KEY (fileId) REFERENCES files (id) ON DELETE SET NULL
);

-- 4. Migrate the data back from the backup tables
INSERT INTO channels (id, name, createdAt)
SELECT id, name, createdAt FROM channels_backup;

INSERT INTO files (id, channelId, filePath, fileType, fileSize, originalName, createdAt)
SELECT id, channelId, filePath, fileType, fileSize, originalName, createdAt FROM files_backup;

INSERT INTO messages (id, channelId, content, fileId, createdAt)
SELECT id, channelId, content, fileId, createdAt FROM messages_backup;

-- 5. Drop the backup tables
DROP TABLE channels_backup;
DROP TABLE files_backup;
DROP TABLE messages_backup;
