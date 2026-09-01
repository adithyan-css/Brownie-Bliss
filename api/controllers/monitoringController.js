const metricsService = require('../services/metricsService');

async function getDashboard(req, res) {
  try {
    const stats = await metricsService.getDashboardStats();

    res.json({
      success: true,
      failedLoginsCount: stats.eventCounts.failed_login,
      rateLimitViolationCount: stats.eventCounts.rate_limit_violation,
      otpAbuseCount: stats.eventCounts.otp_abuse,
      orderFailureCount: stats.eventCounts.order_failure,
      emailFailureCount: stats.eventCounts.email_delivery_failure,
      systemHealth: stats.systemHealth,
      recentSecurityEvents: stats.recentEvents,
      apiPerformanceStats: stats.apiPerformance,
      // For general extensibility
      eventCounts: stats.eventCounts,
    });
  } catch (err) {
    console.error('[MONITORING_CONTROLLER_ERROR]', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve monitoring statistics' });
  }
}

module.exports = {
  getDashboard,
};
