import { EventEmitter } from "events";
import { Scheduler } from "./utils/scheduler";
import { jobs } from "./jobs";
import { Logger } from "./logging/logger";
import { ConsoleAdapter } from "./logging/adapters/console-adapter";

export const events = new EventEmitter();
export const scheduler = new Scheduler();
export const logger = new Logger();
logger.addAdapter(new ConsoleAdapter());

jobs.forEach((job) => {
    job();
});