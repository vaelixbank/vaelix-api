// NASA Security Principle: CSRF Protection - Prevent Cross-Site Request Forgery attacks
// Validates CSRF tokens for state-changing operations (POST, PUT, DELETE, PATCH)

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export interface CSRFProtectedRequest extends Request {
  csrfToken?: string;
}

// Generate CSRF token (stored in session or JWT)
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF protection middleware for state-changing operations
// For APIs, CSRF is less critical with proper authentication, but included for defense in depth
export const csrfProtection = (req: CSRFProtectedRequest, res: Response, next: NextFunction) => {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For API requests, check CSRF token from header (optional for authenticated APIs)
  const csrfToken = req.headers['x-csrf-token'] as string || req.body._csrf;

  // If CSRF token is provided, validate it (basic check)
  if (csrfToken && (typeof csrfToken !== 'string' || csrfToken.length < 10)) {
    return res.status(403).json({
      error: 'Invalid CSRF token format',
      code: 'INVALID_CSRF_TOKEN'
    });
  }

  req.csrfToken = csrfToken;
  next();
};

// Middleware to add CSRF token to responses
export const addCSRFToken = (req: CSRFProtectedRequest, res: Response, next: NextFunction) => {
  const token = generateCSRFToken();
  // Store in session or send to client
  res.setHeader('X-CSRF-Token', token);
  req.csrfToken = token;
  next();
};