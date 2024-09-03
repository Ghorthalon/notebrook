export enum TimeUnit {
    SECOND = 1000,
    MINUTE = 60 * 1000,
    HOUR = 60 * 60 * 1000,
    DAY = 24 * 60 * 60 * 1000,
    WEEK = 7 * 24 * 60 * 60 * 1000
}

export type Task = () => void;

export interface TaskEntry {
    id: Timer;
    task: Task;
    remainingRuns: number;
}

export class Scheduler {
    private tasks: Map<string, TaskEntry> = new Map();

    static toMilliseconds(time: number, unit: TimeUnit): number {
        return time * unit;
    }

    register(taskName: string, task: Task, delay: number, unit: TimeUnit, runs: number = Infinity): void {
        if (this.tasks.has(taskName)) {
            throw new Error(`Task ${taskName} is already registered.`);
        }
        const performTask = () => {
            task();
            const taskEntry = this.tasks.get(taskName);
            if (taskEntry) {
                taskEntry.remainingRuns--;
                if (taskEntry.remainingRuns > 0) {
                    taskEntry.id = setTimeout(performTask, Scheduler.toMilliseconds(delay, unit));
                } else {
                    this.tasks.delete(taskName);
                }
            }
        };
        this.tasks.set(taskName, { id: setTimeout(performTask, Scheduler.toMilliseconds(delay, unit)), task, remainingRuns: runs });
    }

    unregister(taskName: string): void {
        const taskEntry = this.tasks.get(taskName);
        if (taskEntry) {
            clearTimeout(taskEntry.id);
            this.tasks.delete(taskName);
        }
    }

    getTasks(): Map<string, TaskEntry> {
        return this.tasks;
    }
}