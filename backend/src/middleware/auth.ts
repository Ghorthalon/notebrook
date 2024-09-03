import type { NextFunction, Request, Response } from "express";
import { SECRET_KEY } from "../config";
import { logger } from "../globals";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }
    if (token === SECRET_KEY) {
        next();
    } else {
        res.status(401).json({ error: "Unauthenticated" })
    }
}
