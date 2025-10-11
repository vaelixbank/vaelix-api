import { Request, Response, NextFunction } from 'express';
import pool from '../utils/database';
import { ApiKeyType } from '../models/ApiKey';

export interface AuthenticatedRequest extends Request {
  apiKey?: {
    id: number;
    user_id: number;
    type: ApiKeyType;
    expires_at?: Date;
  };
}

export const authenticateApiKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
    const apiSecret = req.headers['x-api-secret'] as string || req.headers['api_secret'] as string;

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        error: 'API key and secret required',
        code: 'MISSING_API_CREDENTIALS'
      });
    }

    const result = await pool.query(
      'SELECT id, user_id, type, expires_at FROM api_keys WHERE key = $1 AND secret = $2 AND (expires_at IS NULL OR expires_at > NOW())',
      [apiKey, apiSecret]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Invalid or expired API credentials',
        code: 'INVALID_API_CREDENTIALS'
      });
    }

    req.apiKey = result.rows[0];
    next();
  } catch (error) {
    console.error('Error authenticating API key:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requireServerKey = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.apiKey || req.apiKey.type !== 'server') {
    return res.status(403).json({
      error: 'Server API key required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

export const requireClientKey = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.apiKey || req.apiKey.type !== 'client') {
    return res.status(403).json({
      error: 'Client API key required',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};