import { Scheduler, TimeUnit } from "../utils/scheduler";
import { scheduler } from "../globals";
import { db } from "../db";

export const scheduleVacuum = () => {
    scheduler.register('vacuum', () => {
        db.exec('VACUUM');
    }, 1, TimeUnit.DAY);
}
