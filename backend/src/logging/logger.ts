import { LogAdapter } from "./adapter";
import { type LogEntry, LogLevel } from "./log-entry";

export class Logger {
    private adapters: LogAdapter[];

    public constructor() {
        this.adapters = [];
    }

    public log(message: LogEntry) {
        this.adapters.forEach((adapter) => adapter.log(message));
    }

    public info(message: string, additionalInfo?: any) {
        this.log({
            level: LogLevel.info,
            message,
            additionalInfo,
            timestamp: Date.now()
        })
    }

    public warn(message: string, additionalInfo?: any) {
        this.log({
            level: LogLevel.warning,
            message,
            additionalInfo,
            timestamp: Date.now()
        })
    }

    public critical(message: string, additionalInfo?: any) {
        this.log({
            level: LogLevel.critical,
            message,
            additionalInfo,
            timestamp: Date.now()
        })
    }

    public addAdapter(adapter: LogAdapter) {
        this.adapters.push(adapter);
    }

    public removeAdapter(adapter: LogAdapter) {
        this.adapters.slice(this.adapters.indexOf(adapter), 1);
    }
}