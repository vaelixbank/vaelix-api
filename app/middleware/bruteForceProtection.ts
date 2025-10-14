import { Request, Response, NextFunction } from 'express';
import { UserQueries } from '../queries/userQueries';

interface LoginAttempt {
  count: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();

// Clean up old entries periodically
setInterval(() => {
  const now = new Date();
  for (const [key, attempt] of loginAttempts.entries()) {
    if (attempt.blockedUntil && attempt.blockedUntil < now) {
      loginAttempts.delete(key);
    } else if (!attempt.blockedUntil && (now.getTime() - attempt.lastAttempt.getTime()) > 24 * 60 * 60 * 1000) {
      loginAttempts.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

export const bruteForceProtection = async (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const identifier = req.body.identifier || req.body.email;

  if (!identifier) {
    return next();
  }

  // Get user to check previous attempts
  const user = await UserQueries.getUserByEmail(identifier);
  if (!user) {
    return next(); // Don't reveal if user exists
  }

  // Check database for recent failed attempts
  const recentAttempts = await UserQueries.getLoginAttemptsLast24h(user.id);
  if (recentAttempts >= 5) {
    return res.status(429).json({
      error: 'Account temporarily locked due to too many failed login attempts. Please try again later.',
      code: 'ACCOUNT_LOCKED',
      retryAfter: 900 // 15 minutes
    });
  }

  // Check in-memory attempts for this IP
  const attemptKey = `${clientIP}:${identifier}`;
  const attempt = loginAttempts.get(attemptKey);

  if (attempt) {
    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - attempt.lastAttempt.getTime();

    // If blocked
    if (attempt.blockedUntil && attempt.blockedUntil > now) {
      const remainingTime = Math.ceil((attempt.blockedUntil.getTime() - now.getTime()) / 1000);
      return res.status(429).json({
        error: 'Too many failed attempts. Please try again later.',
        code: 'BRUTE_FORCE_BLOCKED',
        retryAfter: remainingTime
      });
    }

    // Progressive delays
    if (attempt.count >= 3 && timeSinceLastAttempt < 30000) { // 30 seconds after 3 attempts
      attempt.blockedUntil = new Date(now.getTime() + 30000);
      return res.status(429).json({
        error: 'Too many attempts. Please wait 30 seconds.',
        code: 'BRUTE_FORCE_DELAY',
        retryAfter: 30
      });
    }
  }

  next();
};

export const recordFailedAttempt = (req: Request, identifier: string) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const attemptKey = `${clientIP}:${identifier}`;
  const now = new Date();

  const attempt = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: now };
  attempt.count += 1;
  attempt.lastAttempt = now;

  // Block after 5 attempts for 15 minutes
  if (attempt.count >= 5) {
    attempt.blockedUntil = new Date(now.getTime() + 15 * 60 * 1000);
  }

  loginAttempts.set(attemptKey, attempt);
};

export const clearAttempts = (req: Request, identifier: string) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const attemptKey = `${clientIP}:${identifier}`;
  loginAttempts.delete(attemptKey);
};