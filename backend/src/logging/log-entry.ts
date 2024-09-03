export interface LogEntry {
    level: LogLevel;
    timestamp: number;
    message: string;
    additionalInfo?: any;
}

export enum LogLevel {
    info,
    warning,
    critical
}