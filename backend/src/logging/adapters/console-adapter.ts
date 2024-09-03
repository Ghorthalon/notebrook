import { LogAdapter } from "../adapter";
import { type LogEntry, LogLevel } from "../log-entry";

export class ConsoleAdapter extends LogAdapter {
    public logImpl(message: LogEntry): boolean {
        console.log(`${LogLevel[message.level]}: ${message.message}; ${new Date(message.timestamp).toLocaleString()}:`);
        if (message.additionalInfo) console.log(message.additionalInfo);
        return true;
    }
}