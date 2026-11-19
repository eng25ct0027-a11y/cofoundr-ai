/**
 * Recursively strips keys that could be used for NoSQL operator injection.
 * Keeps payloads plain and predictable before they ever reach Mongoose.
 */
function sanitizeValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const clean = {};
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) continue;
      clean[key] = sanitizeValue(value[key]);
    }
    return clean;
  }
  return value;
}

function noSqlGuard(req, _res, next) {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  // Express 5 exposes a getter-only req.query, so mutate in place instead.
  if (req.query) {
    const cleaned = sanitizeValue({ ...req.query });
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, cleaned);
  }
  next();
}

module.exports = { noSqlGuard, sanitizeValue };
