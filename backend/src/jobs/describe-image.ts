import type { Message } from "../../types";
import { events, logger } from "../globals"
import { describeImage } from "../services/image-description";
import { getMessage, updateMessage } from "../services/message-service";

export const describeImageJob = () => {
    events.on("file-uploaded", (id, channelId, messageId, filePath, fileType, fileSize, originalName) => {
        if (fileType.includes("image")) {
            describeImage(filePath).then((description) => {
                const msg = getMessage(messageId) as any;
                updateMessage(messageId, `${msg.content ? msg.content : ''}\n\n${description}`);
            }).catch((e) => {
                logger.warn(`Failed to describe image: ${e.message}`);
            });
        }
    });
}