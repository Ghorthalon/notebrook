import { type LogEntry } from "./log-entry";

export abstract class LogAdapter {
    public log(message: LogEntry) {
        if (this.shouldLog(message)) {
            this.logImpl(message);
        }
    }

    public abstract logImpl(message: LogEntry): boolean;

    public shouldLog(message: LogEntry): boolean {
        return true;
    }
}