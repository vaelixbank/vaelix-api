import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  apiKey?: string;
  authToken?: string;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
  const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  if (!authToken) {
    return res.status(401).json({ error: 'Auth token required' });
  }

  req.apiKey = apiKey;
  req.authToken = authToken.replace('Bearer ', ''); // Remove Bearer prefix if present

  next();
};