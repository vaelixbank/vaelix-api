import { Request, Response, NextFunction } from 'express';
import { mobileAuthService } from '../services/mobileAuthService';
import { MobileUser } from '../models/Auth';

export interface MobileAuthenticatedRequest extends Request {
  user?: MobileUser;
  sessionId?: string;
}

// JWT Authentication middleware
export const authenticateMobileUser = async (req: MobileAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionId = req.headers['x-session-id'] as string;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const user = await mobileAuthService.verifyAccessToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check session if provided
    if (sessionId) {
      const session = await mobileAuthService.getActiveSession(sessionId);
      if (!session || session.user_id !== user.id) {
        return res.status(401).json({
          error: 'Invalid session',
          code: 'INVALID_SESSION'
        });
      }

      // Update session activity
      await mobileAuthService.updateSessionActivity(sessionId);
      req.sessionId = sessionId;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalMobileAuth = async (req: MobileAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await mobileAuthService.verifyAccessToken(token);

      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

// Require verified user
export const requireVerifiedUser = (req: MobileAuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.is_verified) {
    return res.status(403).json({
      error: 'Account verification required',
      code: 'ACCOUNT_NOT_VERIFIED'
    });
  }
  next();
};

// Device validation middleware
export const validateDeviceId = (req: MobileAuthenticatedRequest, res: Response, next: NextFunction) => {
  const deviceId = req.headers['x-device-id'] as string || req.body.device_id;

  if (!deviceId) {
    return res.status(400).json({
      error: 'Device ID required',
      code: 'MISSING_DEVICE_ID'
    });
  }

  // Basic device ID validation (you can make this more sophisticated)
  if (typeof deviceId !== 'string' || deviceId.length < 10) {
    return res.status(400).json({
      error: 'Invalid device ID format',
      code: 'INVALID_DEVICE_ID'
    });
  }

  next();
};