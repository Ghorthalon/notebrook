import express from "express";
import cors from "cors";
import * as ChannelRoutes from "./routes/channel";
import * as FileRoutes from "./routes/file";
import * as MessageRoutes from "./routes/message";
import * as SearchRoutes from "./routes/search";
import * as BackupRoutes from "./routes/backup";
import { authenticate } from "./middleware/auth";
import { initializeDB } from "./db";
import { FRONTEND_DIR, UPLOAD_DIR } from "./config";


export const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static(FRONTEND_DIR));

app.use("/channels", ChannelRoutes.router);
app.use("/channels/:channelId/messages", MessageRoutes.router);
app.use("/channels/:channelId/messages/:messageId/files", FileRoutes.router);
app.use("/search", SearchRoutes.router);
app.use("/backup", BackupRoutes.router);

app.get('/check-token', authenticate, (req, res) => {
    res.json({ message: 'Token is valid' });
});

