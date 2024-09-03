import type { Request, Response } from "express";
import * as ChannelService from "../services/channel-service";
import { logger } from "../globals";

export const createChannel = async (req: Request, res: Response) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    const chan = await ChannelService.createChannel(name);
    logger.info(`Channel ${name} created`);
    res.json(chan);
}

export const deleteChannel = async (req: Request, res: Response) => {
    const { channelId } = req.params;
    if (!channelId) {
        return res.status(400).json({ error: 'Channel ID is required' });
    }
    const result = await ChannelService.deleteChannel(channelId);

    if (result.changes === 0) {
        logger.warn(`Channel ${channelId} not found while deleting`);
        return res.status(404).json({ error: 'Channel not found' });
    }
    logger.info(`Channel ${channelId} deleted`);

    res.json({ message: 'Channel deleted successfully' });
}

export const getChannels = async (req: Request, res: Response) => {
    const channels = await ChannelService.getChannels();
    res.json({ channels });
}

export const mergeChannel = async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const { targetChannelId } = req.body;
    if (!channelId || !targetChannelId) {
        return res.status(400).json({ error: 'Channel ID and targetChannelId are required' });
    }
    const result = await ChannelService.mergeChannel(channelId, targetChannelId);
    logger.info(`Channel ${targetChannelId} merged into ${channelId}`);

    res.json({ message: 'Channels merged successfully' });
}

export const updateChannel = async (req: Request, res: Response) => {
    const { channelId } = req.params;
    const { name } = req.body;
    if (!channelId || !name) {
        return res.status(400).json({ error: 'Channel ID and name are required' });
    }
    const result = await ChannelService.updateChannel(channelId, name);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Channel not found' });
    }
    logger.info(`Channel ${channelId} updated as ${name}`);

    res.json({ message: 'Channel updated successfully' });
}