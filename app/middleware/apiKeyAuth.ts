// NASA Security Principle: Authorization - Role-Based Access Control (RBAC) for API access
// Validates API keys and enforces permissions based on key type and user roles

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { AuthQueries } from '../queries/authQueries';
import { ApiKeyType } from '../models/ApiKey';
import DatabaseManager from '../services/databaseManager';

export interface AuthenticatedRequest extends Request {
  apiKey?: {
    id: number;
    user_id: number;
    type: ApiKeyType;
    expires_at?: Date;
  };
  databasePool?: Pool;
  databaseId?: string;
}

// NASA Security Principle: Authentication - Validate API key and secret with database lookup
// Uses encrypted storage and expiration checks for secure credential validation
// Supports both traditional key-secret and certificate-based authentication
export const authenticateApiKey = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string || req.headers['api_key'] as string;
    const apiSecret = req.headers['x-api-secret'] as string || req.headers['api_secret'] as string;

    let apiKeyData: any = null;

    // Try certificate-based authentication first (mutual TLS)
    const { extractClientCertificate, validateCertificateFingerprint, extractFingerprintFromKey } = await import('../utils/certificates');
    const clientCert = extractClientCertificate(req);

    if (clientCert && apiKey) {
      // Certificate-based authentication
      apiKeyData = await AuthQueries.getApiKeyByCertificateFingerprint(apiKey, clientCert.fingerprint);

      if (apiKeyData && !validateCertificateFingerprint(clientCert.fingerprint, apiKeyData.certificate_fingerprint)) {
        return res.status(401).json({
          error: 'Certificate fingerprint mismatch',
          code: 'CERTIFICATE_MISMATCH'
        });
      }
    } else if (apiKey && apiSecret) {
      // Traditional key-secret authentication
      apiKeyData = await AuthQueries.getApiKey(apiKey, apiSecret);
    } else if (apiKey && apiKey.startsWith('vb_')) {
      // Enhanced vb_ key authentication - try to extract embedded certificate info
      const embeddedFingerprint = extractFingerprintFromKey(apiKey);
      if (embeddedFingerprint) {
        // Look up by embedded fingerprint
        apiKeyData = await AuthQueries.getApiKeyByCertificateFingerprint(apiKey, embeddedFingerprint);
      } else {
        // Fallback to traditional lookup
        apiKeyData = await AuthQueries.getApiKey(apiKey, '');
      }
    } else {
      return res.status(401).json({
        error: 'API credentials required (key+secret or certificate)',
        code: 'MISSING_API_CREDENTIALS'
      });
    }

    if (!apiKeyData) {
      return res.status(401).json({
        error: 'Invalid or expired API credentials',
        code: 'INVALID_API_CREDENTIALS'
      });
    }

    // Check expiration
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'API key expired',
        code: 'EXPIRED_API_KEY'
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
    // Log authentication failures for security monitoring
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

export const requireDatabaseKey = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.apiKey || req.apiKey.type !== 'database') {
    return res.status(403).json({
      error: 'Database API key required',
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

// Route to appropriate database based on API key
export const routeToDatabase = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.apiKey) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'MISSING_AUTH'
    });
  }

  try {
    const dbManager = DatabaseManager.getInstance();
    const pool = dbManager.getPoolByApiKey(req.apiKey.type, req.apiKey.user_id);

    // Determine database ID for logging/monitoring
    const databaseId = dbManager['resolveDatabaseId'](req.apiKey.type, req.apiKey.user_id);

    req.databasePool = pool;
    req.databaseId = databaseId;

    next();
  } catch (error) {
    console.error('Error routing to database:', error);
    res.status(500).json({
      error: 'Database routing failed',
      code: 'DATABASE_ROUTING_ERROR'
    });
  }
};

// Ensure database is healthy before proceeding
export const requireHealthyDatabase = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.databaseId) {
    return res.status(500).json({
      error: 'Database not routed',
      code: 'DATABASE_NOT_ROUTED'
    });
  }

  const dbManager = DatabaseManager.getInstance();
  const healthyDbs = dbManager.getHealthyDatabases();

  if (!healthyDbs.includes(req.databaseId)) {
    return res.status(503).json({
      error: 'Database temporarily unavailable',
      code: 'DATABASE_UNHEALTHY'
    });
  }

  next();
};
