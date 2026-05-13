const { Queue } = require('bullmq');
const Redis = require('ioredis');
const { logger } = require('../utils/logger');

let connection = null;
let emailQueue = null;
let queueAvailable = false;

// Initialize Redis connection and queue
async function initializeQueue() {
  try {
    if (!process.env.REDIS_URL) {
      logger.info('Redis URL not configured, email queue not available');
      return false;
    }

    // Create Redis connection
    connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // Test connection
    await connection.ping();
    logger.info('Redis connection established', { url: process.env.REDIS_URL });

    // Create email queue with retry and rate limiting
    emailQueue = new Queue('email-queue', {
      connection,
      defaultJobOptions: {
        attempts: 3, // Retry 3 times if failed
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5s delay, then exponential
        },
        removeOnComplete: {
          age: 3600, // Keep completed jobs for 1 hour
          count: 1000, // Max 1000 completed jobs
        },
        removeOnFail: {
          age: 24 * 3600, // Keep failed jobs for 24 hours
        },
      },
    });

    queueAvailable = true;
    logger.info('Email queue initialized successfully');
    return true;

  } catch (error) {
    logger.error('Failed to initialize email queue, will use fallback', {
      error: error.message
    });
    queueAvailable = false;
    connection = null;
    emailQueue = null;
    return false;
  }
}

// Add job to queue (with fallback to returning false)
async function addJob(type, data, options = {}) {
  if (!queueAvailable || !emailQueue) {
    return false; // Indicate queue not available
  }

  try {
    await emailQueue.add(type, data, options);
    return true;
  } catch (error) {
    logger.error('Failed to add job to queue', {
      error: error.message,
      type
    });
    return false;
  }
}

// Add multiple jobs in bulk
async function addBulkJobs(jobs) {
  if (!queueAvailable || !emailQueue) {
    return false; // Indicate queue not available
  }

  try {
    await emailQueue.addBulk(jobs);
    return true;
  } catch (error) {
    logger.error('Failed to add bulk jobs to queue', {
      error: error.message,
      count: jobs.length
    });
    return false;
  }
}

// Check if queue is available
function isQueueAvailable() {
  return queueAvailable;
}

// Graceful shutdown
async function shutdown() {
  if (emailQueue) {
    await emailQueue.close();
  }
  if (connection) {
    await connection.quit();
  }
  logger.info('Email queue shut down');
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = {
  initializeQueue,
  addJob,
  addBulkJobs,
  isQueueAvailable,
  shutdown,
  get emailQueue() { return emailQueue; },
  get connection() { return connection; }
};
