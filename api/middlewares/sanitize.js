/**
 * Recursively sanitizes input objects by removing keys starting with '$'
 * to prevent MongoDB NoSQL Injection attacks.
 */
function sanitizeObject(obj) {
  if (obj instanceof Array) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'object' && obj[i] !== null) {
        sanitizeObject(obj[i]);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    });
  }
  return obj;
}

/**
 * Express middleware to sanitize body, query parameters, and route parameters.
 */
function nosqlSanitizer(req, res, next) {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
}

module.exports = nosqlSanitizer;
