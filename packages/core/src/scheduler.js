let flushPending = false;
let flushing = false;
const queue = [];
let lastFlushedIndex = -1;

/**
 * Schedules a job to be executed.
 *
 * @param {Function} callback - The job to be scheduled.
 * @returns {void}
 */
export function scheduler(callback) {
    queueJob(callback);
}

/**
 * Adds a job to the queue if it's not already in the queue, and schedules a flush.
 *
 * @param {Function} job - The job to be added to the queue.
 * @returns {void}
 */
function queueJob(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }

    queueFlush();
}

/**
 * Removes a job from the queue if it's in the queue and hasn't been flushed yet.
 *
 * @param {Function} job - The job to be removed from the queue.
 * @returns {void}
 */
export function dequeueJob(job) {
    const index = queue.indexOf(job);

    if (index !== -1 && index > lastFlushedIndex) {
        queue.splice(index, 1);
    }
}

/**
 * Schedules a flush of the job queue if a flush isn't already in progress or scheduled.
 *
 * @returns {void}
 */
function queueFlush() {
    if (!(flushing || flushPending)) {
        flushPending = true;

        queueMicrotask(flushJobs);
    }
}

/**
 * Flushes the job queue by executing each job in the queue in order.
 * After all jobs have been executed, the queue is cleared.
 *
 * @returns {void}
 */
export function flushJobs() {
    flushPending = false;
    flushing = true;

    for (let i = 0; i < queue.length; i++) {
        queue[i]();
        lastFlushedIndex = i;
    }

    queue.length = 0;
    lastFlushedIndex = -1;

    flushing = false;
}
