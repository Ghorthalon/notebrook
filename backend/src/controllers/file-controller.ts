import type { Request, Response } from "express";
import * as FileService from "../services/file-service";
import { logger } from "../globals";

export const uploadFile = async (req: Request, res: Response) => {
    const { channelId, messageId } = req.params;
    const filePath = (req.file as Express.Multer.File).path;
    const fileType = req.file?.mimetype;
    const fileSize = req.file?.size;
    const originalName = req.file?.originalname;
    
    if (!channelId || !messageId) {
        return res.status(400).json({ error: 'Channel ID and message ID are required' });
    }
    if (!filePath || !fileType || !fileSize || !originalName) {
        return res.status(400).json({ error: 'File is required' });
    }

    const result = await FileService.uploadFile(channelId, messageId, filePath, fileType!, fileSize!, originalName!);
    logger.info(`File ${originalName} uploaded to message ${messageId} as ${filePath}`);
    res.json({ id: result.lastInsertRowid, channelId, messageId, filePath, fileType });
}


export const getFiles = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
    }
    const files = await FileService.getFiles(messageId);
    res.json({ files });
}

