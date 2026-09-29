// High-Efficiency Sliding-Window Rate Limiter
// In-memory with auto-cleanup of expired windows to prevent memory leaks

class SlidingWindowRateLimiter {
  constructor(windowMs = 60000, maxRequests = 100, name = 'default') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.name = name;
    this.store = new Map(); // key -> array of timestamps
    
    // Cleanup stale entries every 2 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 120000);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref(); // Don't hold Node event loop open
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.store.entries()) {
      const valid = timestamps.filter(ts => now - ts < this.windowMs);
      if (valid.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, valid);
      }
    }
  }

  middleware() {
    return (req, res, next) => {
      // Key by client IP or authenticated User ID
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const key = `${this.name}:${req.user ? req.user.id : clientIp}`;
      const now = Date.now();

      const timestamps = this.store.get(key) || [];
      const windowStart = now - this.windowMs;
      const validTimestamps = timestamps.filter(ts => ts > windowStart);

      if (validTimestamps.length >= this.maxRequests) {
        const oldest = validTimestamps[0];
        const retryAfterSec = Math.ceil((oldest + this.windowMs - now) / 1000);
        res.setHeader('Retry-After', retryAfterSec);
        return res.status(429).json({
          success: false,
          error: `Too Many Requests: Rate limit exceeded for ${this.name}. Limit is ${this.maxRequests} requests per ${Math.round(this.windowMs / 1000)}s.`,
          retryAfterSeconds: retryAfterSec
        });
      }

      validTimestamps.push(now);
      this.store.set(key, validTimestamps);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - validTimestamps.length));

      next();
    };
  }
}

function createRateLimiter(windowMs, maxRequests, name) {
  const limiter = new SlidingWindowRateLimiter(windowMs, maxRequests, name);
  return limiter.middleware();
}

module.exports = {
  createRateLimiter,
  SlidingWindowRateLimiter
};
