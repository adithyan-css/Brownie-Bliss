const { isDbReady } = require('../config/db');

let SecurityEvent;
let ApiMetric;

function getSecurityEventModel() {
  if (!SecurityEvent) SecurityEvent = require('../models/SecurityEvent');
  return SecurityEvent;
}

function getApiMetricModel() {
  if (!ApiMetric) ApiMetric = require('../models/ApiMetric');
  return ApiMetric;
}

/**
 * Tracks a security or operational event.
 * Fire-and-forget: fails silently to console if database is unavailable.
 */
async function trackEvent({ event_type, severity = 'low', description, ip = null, metadata = {} }) {
  const entry = { event_type, severity, description, ip, metadata, created_at: new Date() };

  if (!isDbReady()) {
    console.warn('[METRICS_NO_DB_EVENT]', JSON.stringify(entry));
    return;
  }

  try {
    await getSecurityEventModel().create(entry);
  } catch (err) {
    console.error('[METRICS_SAVE_ERROR]', err.message, JSON.stringify(entry));
  }
}

/**
 * Tracks API response latency.
 * Fire-and-forget: fails silently to console if database is unavailable.
 */
async function trackApiPerformance(path, method, status, duration) {
  const entry = { path, method, status, duration, created_at: new Date() };

  if (!isDbReady()) {
    return; // Skip console logging every request to keep output clean
  }

  try {
    await getApiMetricModel().create(entry);
  } catch (err) {
    console.error('[METRICS_PERF_SAVE_ERROR]', err.message);
  }
}

/**
 * Compiles aggregated monitoring and performance statistics.
 */
async function getDashboardStats() {
  const stats = {
    eventCounts: {
      failed_login: 0,
      rate_limit_violation: 0,
      otp_abuse: 0,
      suspicious_order: 0,
      email_delivery_failure: 0,
      database_failure: 0,
      unhandled_exception: 0,
      order_failure: 0,
    },
    systemHealth: {
      database: 'disconnected',
      uptime: Math.round(process.uptime()),
      memoryUsage: process.memoryUsage(),
      platform: process.platform,
    },
    apiPerformance: [],
    recentEvents: [],
  };

  if (!isDbReady()) {
    return stats;
  }

  stats.systemHealth.database = 'connected';

  try {
    // 1. Aggregate event counts
    const counts = await getSecurityEventModel().aggregate([
      { $group: { _id: '$event_type', count: { $sum: 1 } } }
    ]);
    counts.forEach((item) => {
      if (stats.eventCounts.hasOwnProperty(item._id)) {
        stats.eventCounts[item._id] = item.count;
      }
    });

    // 2. Fetch 50 most recent security events
    stats.recentEvents = await getSecurityEventModel()
      .find()
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    // 3. Aggregate API performance metrics
    stats.apiPerformance = await getApiMetricModel().aggregate([
      {
        $group: {
          _id: { path: '$path', method: '$method' },
          avgDuration: { $avg: '$duration' },
          maxDuration: { $max: '$duration' },
          minDuration: { $min: '$duration' },
          requestCount: { $sum: 1 },
          errorCount: {
            $sum: {
              $cond: [{ $gte: ['$status', 400] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          path: '$_id.path',
          method: '$_id.method',
          avgDuration: { $round: ['$avgDuration', 2] },
          maxDuration: 1,
          minDuration: 1,
          requestCount: 1,
          errorCount: 1,
          errorRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$errorCount', '$requestCount'] },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { requestCount: -1 } },
    ]);
  } catch (err) {
    console.error('[METRICS_AGGREGATION_ERROR]', err);
  }

  return stats;
}

module.exports = {
  trackEvent,
  trackApiPerformance,
  getDashboardStats,
};
