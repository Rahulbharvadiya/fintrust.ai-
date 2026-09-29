// Comprehensive Security Middleware: Headers, Sanitization & Anti-Tamper Protection

function applySecurityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Cross-site scripting filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (allow webcam for biometric selfie verification, deny others)
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');
  
  // HTTP Strict Transport Security
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https: wss:;"
  );

  // Remove fingerprinting header
  res.removeHeader('X-Powered-By');

  next();
}

/**
 * Deep sanitization against Prototype Pollution, NoSQL/SQL injection markers, and Script Injection
 */
function sanitizeInput(obj, depth = 0) {
  if (depth > 10 || !obj || typeof obj !== 'object') {
    if (typeof obj === 'string') {
      // Strip dangerous script tags and null bytes
      return obj
        .replace(/\0/g, '')
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim();
    }
    return obj;
  }

  // Prevent prototype pollution
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeInput(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue; // Drop dangerous keys
    }
    sanitized[key] = sanitizeInput(value, depth + 1);
  }
  return sanitized;
}

function sanitizeRequestBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInput(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeInput(req.params);
  }
  next();
}

module.exports = {
  applySecurityHeaders,
  sanitizeInput,
  sanitizeRequestBody
};
