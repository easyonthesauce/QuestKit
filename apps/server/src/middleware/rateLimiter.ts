import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => {
    // Use IP address as key, but could be enhanced with user ID for authenticated requests
    return req.ip || 'unknown';
  },
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Number of requests
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000, // Per 15 minutes (in seconds)
});

const authRateLimiter = new RateLimiterMemory({
  keyGenerator: (req: Request) => req.ip || 'unknown',
  points: 5, // Number of attempts
  duration: 900, // Per 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

export const rateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await rateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: secs
    });
  }
};

export const authRateLimiterMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await authRateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rejRes: any) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      retryAfter: secs
    });
  }
};

export { rateLimiterMiddleware as rateLimiter };