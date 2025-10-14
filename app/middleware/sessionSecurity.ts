import { Request, Response, NextFunction } from 'express';
import { mobileAuthService } from '../services/mobileAuthService';

export interface AuthenticatedRequest extends Request {
  user?: any;
  session?: any;
}

// Middleware to validate and rotate sessions
export const validateSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.headers['authorization']?.replace('Bearer ', '');
    const sessionId = req.headers['x-session-id'] as string;

    if (!accessToken) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'MISSING_ACCESS_TOKEN'
      });
    }

    // Verify access token
    const user = await mobileAuthService.verifyAccessToken(accessToken);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired access token',
        code: 'INVALID_ACCESS_TOKEN'
      });
    }

    // If session ID provided, validate session
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

      req.session = session;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      error: 'Session validation failed',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
};

// Middleware to rotate tokens periodically
export const tokenRotation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // This would be called after successful requests to rotate tokens
  // For now, just pass through
  next();
};

// Middleware to invalidate old sessions on new login
export const invalidateOldSessions = async (userId: number) => {
  try {
    // Keep only the most recent session, invalidate others
    await mobileAuthService.invalidateAllUserSessions(userId);
  } catch (error) {
    console.error('Error invalidating old sessions:', error);
  }
};