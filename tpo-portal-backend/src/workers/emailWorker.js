const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { sendJobNotificationEmail, sendIndividualJobEmail } = require('../utils/email');
const {logger} = require('../utils/logger');

let worker = null;
let connection = null;

async function startWorker() {
  try {
    if (!process.env.REDIS_URL) {
      logger.info('Redis URL not configured, worker not starting');
      return null;
    }

    // Create Redis connection for worker
    connection = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    // Wait for Redis connection
    await connection.ping();
    logger.info('Worker: Redis connection established');

    // Email worker with rate limiting
    worker = new Worker(
      'email-queue',
      async (job) => {
        const { type, data } = job.data;

        logger.info('Processing email job', {
          jobId: job.id,
          type,
          attempt: job.attemptsMade,
        });

        switch (type) {
          case 'JOB_NOTIFICATION_BATCH':
            // Original BCC method (for backward compatibility)
            const result = await sendJobNotificationEmail(data);
            logger.info('Batch job notification sent', {
              success: result.success,
              failed: result.failed?.length || 0,
            });
            return result;

          case 'JOB_NOTIFICATION_INDIVIDUAL':
            // Send individual email with rate limiting
            return await sendIndividualJobEmail(data);

          case 'WELCOME_EMAIL':
            const { sendWelcomeEmail } = require('../utils/email');
            await sendWelcomeEmail(data);
            return { success: true };

          case 'OTP_EMAIL':
            const { sendOTP } = require('../utils/email');
            await sendOTP(data);
            return { success: true };

          default:
            throw new Error(`Unknown email type: ${type}`);
        }
      },
      {
        connection,
        concurrency: 5, // Process 5 emails concurrently
        limiter: {
          max: 10, // Max 10 emails per rate limit window
          duration: 60000, // 1 minute window (10 emails/minute = safe for Gmail)
        },
      }
    );

    // Worker event handlers
    worker.on('completed', (job) => {
      logger.info('Email job completed', {
        jobId: job.id,
        type: job.data.type,
      });
    });

    worker.on('failed', (job, err) => {
      logger.error('Email job failed', {
        jobId: job?.id,
        type: job?.data?.type,
        error: err.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    worker.on('error', (err) => {
      logger.error('Worker error', { error: err.message });
    });

    logger.info('Email worker started successfully');
    return worker;

  } catch (error) {
    logger.error('Failed to start email worker', {
      error: error.message
    });
    return null;
  }
}

// Graceful shutdown
async function shutdown() {
  if (worker) {
    await worker.close();
    logger.info('Email worker stopped');
  }
  if (connection) {
    await connection.quit();
    logger.info('Worker Redis connection closed');
  }
}

process.on('SIGTERM', () => shutdown());
process.on('SIGINT', () => shutdown());

// Auto-start if this file is run directly
if (require.main === module) {
  startWorker();
}

module.exports = { startWorker, shutdown };
