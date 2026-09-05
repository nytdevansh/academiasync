import { Request, Response, NextFunction } from 'express';

interface RateLimitStoreEntry {
  count: number;
  resetTime: number;
}

interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests allowed within windowMs
  message?: string;
  keyGenerator?: (req: Request) => string;
}

/**
 * Creates an in-memory sliding window rate limiter middleware.
 * Zero external dependencies, fully compatible with Express 5,
 * and sets RFC-compliant RateLimit & Retry-After response headers.
 *
 * PRODUCTION NOTE:
 * This store is in-memory and scoped to a single Node.js process.
 * Acceptable for single-instance deployments (e.g. single Render web service).
 * If scaling to multiple load-balanced instances, replace the in-memory Map
 * with a shared distributed store (e.g. Redis / `rate-limit-redis`) to prevent
 * effective rate limit multiplication (limit × instance_count).
 */
export const createRateLimiter = (options: RateLimiterOptions) => {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later.',
    keyGenerator = (req: Request) => {
      const forwarded = req.headers?.['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        return forwarded.split(',')[0].trim();
      }
      return req.ip || req.socket?.remoteAddress || 'unknown-client';
    },
  } = options;

  const store = new Map<string, RateLimitStoreEntry>();

  // Periodically clean up expired entries every 5 minutes to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not keep Node process alive on exit
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      store.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    // Standard rate limit headers
    res.setHeader('RateLimit-Limit', max.toString());
    res.setHeader('RateLimit-Remaining', remaining.toString());
    res.setHeader('RateLimit-Reset', resetSeconds.toString());

    if (entry.count > max) {
      res.setHeader('Retry-After', resetSeconds.toString());
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: resetSeconds,
      });
      return;
    }

    next();
  };
};

/**
 * Strict rate limiter for sensitive authentication endpoints:
 * 10 requests per 15 minutes per IP.
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
});

/**
 * General rate limiter for all /api/v1/* routes:
 * 300 requests per 15 minutes per IP.
 */
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Too many requests sent to the API from this IP. Please slow down.',
});
