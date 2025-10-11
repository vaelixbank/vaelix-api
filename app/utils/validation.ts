import { Request, Response, NextFunction } from 'express';

export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }

  if (typeof apiKey !== 'string' || apiKey.length < 10) {
    return res.status(401).json({
      error: 'Invalid API key format',
      code: 'INVALID_API_KEY'
    });
  }

  next();
};

export const validateAuthToken = (req: Request, res: Response, next: NextFunction) => {
  const authToken = req.headers['authorization'] as string || req.headers['auth_token'] as string;

  if (!authToken) {
    return res.status(401).json({
      error: 'Auth token required',
      code: 'MISSING_AUTH_TOKEN'
    });
  }

  // Remove Bearer prefix if present
  const token = authToken.replace('Bearer ', '');

  if (typeof token !== 'string' || token.length < 10) {
    return res.status(401).json({
      error: 'Invalid auth token format',
      code: 'INVALID_AUTH_TOKEN'
    });
  }

  next();
};

export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];

    for (const field of fields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing_fields: missingFields,
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    next();
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateCurrency = (currency: string): boolean => {
  const currencyRegex = /^[A-Z]{3}$/;
  return currencyRegex.test(currency);
};

export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0 && Number.isFinite(amount);
};