-- Add tri-state checked column to messages (NULL | 0 | 1)
ALTER TABLE messages ADD COLUMN checked INTEGER NULL;

