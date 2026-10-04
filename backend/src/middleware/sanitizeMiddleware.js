/**
 * NoSQL Injection & Input Sanitization Middleware (EC-8.1)
 * Recursively inspects and sanitizes objects in req.body, req.query, and req.params,
 * stripping any keys starting with '$' or containing '.' to prevent MongoDB operator injection.
 */

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Strip operators starting with $ or containing . (NoSQL injection vectors)
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function sanitizeMiddleware(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  next();
}

module.exports = {
  sanitizeMiddleware,
  sanitizeObject,
};
