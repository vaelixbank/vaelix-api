// NASA Security Principle: Authentication - Validate API credentials for all requests
// This middleware ensures both API key and auth token are present (further validation in specialized middleware)

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  authToken?: string;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // NASA Security Principle: Input Validation - Validate required authentication headers
  const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
  const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }

  if (!authToken) {
    return res.status(401).json({
      error: 'Auth token required',
      code: 'MISSING_AUTH_TOKEN'
    });
  }

  // Basic format validation for security
  if (typeof apiKey !== 'string' || apiKey.length < 10) {
    return res.status(401).json({
      error: 'Invalid API key format',
      code: 'INVALID_API_KEY_FORMAT'
    });
  }

  if (typeof authToken !== 'string' || authToken.length < 10) {
    return res.status(401).json({
      error: 'Invalid auth token format',
      code: 'INVALID_AUTH_TOKEN_FORMAT'
    });
  }

  // Store cleaned credentials (remove Bearer prefix)
  req.apiKey = apiKey;
  req.authToken = authToken.replace('Bearer ', '');

  next();
};