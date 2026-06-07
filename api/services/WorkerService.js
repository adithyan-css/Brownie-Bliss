const mongoose = require('mongoose');
const Job = require('../models/Job');
const handlers = require('./jobHandlers'); // job handlers
const mailer = require('../email/mailer');
const audit = require('../services/auditService');
const metrics = require('../services/metricsService');

/**
 * Simple in‑process worker that polls pending jobs and executes type‑specific handlers.
 * This is deliberately lightweight – ideal for development / single‑instance deployments.
 * For production you may replace it with a dedicated queue system (BullMQ, Bee‑Queue, etc.).
 */
class WorkerService {
  constructor({ pollIntervalMs = 2000, concurrency = 2 } = {}) {
    this.pollIntervalMs = pollIntervalMs;
    this.concurrency = concurrency;
    this.active = false;
    this.runningJobs = 0;
  }

  async start() {
    if (this.active) return;
    this.active = true;
    console.log('[worker] Background worker started');
    this._timer = setInterval(() => this._processQueue(), this.pollIntervalMs);
  }

  async stop() {
    this.active = false;
    clearInterval(this._timer);
    console.log('[worker] Background worker stopped');
  }

  async _processQueue() {
    if (!this.active) return;
    if (this.runningJobs >= this.concurrency) return; // respect concurrency limit
    // Find the next pending job that is ready to run
    const now = new Date();
    const job = await Job.findOne({
      status: 'pending',
      nextRetryAt: { $lte: now },
    }).sort({ nextRetryAt: 1, createdAt: 1 });
    if (!job) return;
    this.runningJobs++;
    try {
      await this._handleJob(job);
    } catch (err) {
      console.error('[worker] Unexpected error handling job', err);
    } finally {
      this.runningJobs--;
    }
  }

  async _handleJob(job) {
    // Mark as processing to avoid duplicate picks
    job.status = 'processing';
    await job.save();

    try {
      const handlers = require('../services/jobHandlers');
      console.log(`[worker] Processing job ${job._id} of type ${job.type}`);
        case 'sendReceiptEmail':
          await handlers.sendReceiptEmail(job);
          break;
        case 'logAudit':
          await handlers.logAudit(job);
          break;
        case 'trackMetric':
          await handlers.trackMetric(job);
          break;
        default:
          console.warn(`[worker] Unknown job type: ${job.type}`);
          break;
      }
      job.status = 'completed';
      await job.save();
    } catch (err) {
      console.error(`[worker] Job ${job._id} failed:`, err.message);
      job.attempts += 1;
      if (job.attempts >= job.maxAttempts) {
        job.status = 'dead';
        job.errorMessage = err.message;
        await job.save();
        return;
      }
      // Exponential backoff: 2^attempts * 1 minute
      const delayMs = Math.pow(2, job.attempts) * 60 * 1000;
      job.nextRetryAt = new Date(Date.now() + delayMs);
      job.status = 'pending';
      job.errorMessage = err.message;
      await job.save();
    }
  }
}

module.exports = new WorkerService();
