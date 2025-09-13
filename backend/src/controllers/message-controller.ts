import type { Request, Response } from "express";
import * as MessageService from "../services/message-service";
import { logger } from "../globals";

export const createMessage = async (req: Request, res: Response) => {
    const { content } = req.body;
    const { channelId } = req.params;
    if (!content || !channelId) {
        return res.status(400).json({ error: 'Content and channel ID are required' });
    }
    const messageId = await MessageService.createMessage(channelId, content);
    logger.info(`Message ${messageId} created in channel ${channelId}`);

    res.json({ id: messageId, channelId, content, createdAt: new Date().toISOString() });
};

export const updateMessage = async (req: Request, res: Response) => {
    const { content } = req.body;
    const { messageId } = req.params;
    if (!content || !messageId) {
        return res.status(400).json({ error: 'Content and message ID are required   ' });
    }
    const result = await MessageService.updateMessage(messageId, content);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Message not found' });
    }
    logger.info(`Message ${messageId} updated`);

    res.json({ id: messageId, content });
}

export const deleteMessage = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
    }
    const result = await MessageService.deleteMessage(messageId);
    if (result.changes === 0) {
        return res.status(404).json({ error: 'Message not found' });
    }
    logger.info(`Message ${messageId} deleted`);

    res.json({ message: 'Message deleted successfully' });
}

export const getMessages = async (req: Request, res: Response) => {
    const { channelId } = req.params;
    if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required' });
    }
    const messages = await MessageService.getMessages(channelId);

    res.json({ messages });
}

export const moveMessage = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { targetChannelId } = req.body;
    
    if (!messageId || !targetChannelId) {
        return res.status(400).json({ error: 'Message ID and target channel ID are required' });
    }
    
    try {
        const result = await MessageService.moveMessage(messageId, targetChannelId);
        logger.info(`Message ${messageId} moved to channel ${targetChannelId}`);
        
        res.json({ 
            message: 'Message moved successfully',
            messageId: parseInt(messageId),
            targetChannelId: parseInt(targetChannelId)
        });
    } catch (error: any) {
        if (error.message === 'Message not found') {
            return res.status(404).json({ error: 'Message not found' });
        }
        logger.critical(`Failed to move message ${messageId}:`, error);
        res.status(500).json({ error: 'Failed to move message' });
    }
}

export const setChecked = async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { checked } = req.body as { checked: boolean | null | undefined };
    if (!messageId) {
        return res.status(400).json({ error: 'Message ID is required' });
    }
    const value = (checked === undefined) ? null : checked;
    // Ensure message exists; treat no-change updates as success
    const existing = await MessageService.getMessage(messageId);
    if (!existing) {
        return res.status(404).json({ error: 'Message not found' });
    }
    await MessageService.setMessageChecked(messageId, value);
    logger.info(`Message ${messageId} checked set to ${value}`);
    res.json({ id: parseInt(messageId), checked: value });
}
