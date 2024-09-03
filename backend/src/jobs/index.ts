import { describeImageJob } from "./describe-image";
import { scheduleVacuum } from "./vacuum";

export const jobs = [
    scheduleVacuum,
    describeImageJob
]