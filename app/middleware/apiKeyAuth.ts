import { Request, Response, NextFunction } from 'express';
import { AuthQueries } from '../queries/authQueries';
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

    const apiKeyData = await AuthQueries.getApiKey(apiKey, apiSecret);

    if (!apiKeyData) {
      return res.status(401).json({
        error: 'Invalid or expired API credentials',
        code: 'INVALID_API_CREDENTIALS'
      });
    }

    req.apiKey = {
      id: apiKeyData.id,
      user_id: apiKeyData.user_id,
      type: apiKeyData.type as ApiKeyType,
      expires_at: apiKeyData.expires_at
    };
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

export const requireRole = (requiredRole: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'MISSING_AUTH'
      });
    }

    try {
      const userRoles = await AuthQueries.getUserRoles(req.apiKey.user_id);
      const hasRole = userRoles.some((role: any) => role.name === requiredRole);

      if (!hasRole) {
        return res.status(403).json({
          error: `Role '${requiredRole}' required`,
          code: 'INSUFFICIENT_ROLE'
        });
      }

      next();
    } catch (error) {
      console.error('Error checking role:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};
