const metricsService = require('../services/metricsService');

function monitoringMiddleware(req, res, next) {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e9 + diff[1]) / 1e6;

    // Use route path if matched by express (e.g. /api/orders/:orderId), otherwise fallback to request path
    const path = req.route ? req.route.path : req.path;

    metricsService.trackApiPerformance(path, req.method, res.statusCode, durationMs);
  });

  next();
}

module.exports = monitoringMiddleware;
