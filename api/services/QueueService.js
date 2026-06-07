const Job = require('../models/Job');

/**
 * Enqueue a new background job.
 * @param {string} type - Job type identifier (e.g., 'sendEmail', 'generateReceipt').
 * @param {object} payload - Arbitrary data passed to the job handler.
 * @param {object} [options] - Optional configuration (maxAttempts, delayMs).
 * @returns {Promise<Job>} The saved Job document.
 */
function enqueue(type, payload, options = {}) {
  const job = new Job({
    type,
    payload,
    maxAttempts: options.maxAttempts || 5,
    nextRetryAt: options.delayMs ? new Date(Date.now() + options.delayMs) : new Date(),
  });
  return job.save();
}

module.exports = { enqueue };
