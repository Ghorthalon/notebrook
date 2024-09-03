import type { Request, Response } from "express";
import * as SearchService from "../services/search-service";
import { logger } from "../globals";

export const search = async (req: Request, res: Response) => {
    const { query, channelId } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }
    const results = await SearchService.search(query as string, channelId as string);
    logger.info(`Searched for ${query}`);
    res.json({ results });
}