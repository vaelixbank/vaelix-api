import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponseHandler } from '../utils/response';

export interface AuthenticatedRequest extends Request {
  admin?: {
    email: string;
    role: string;
  };
}

export const adminAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponseHandler.unauthorized(res, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      email: string;
      role: string;
    };

    // Check if user has admin role
    if (decoded.role !== 'admin') {
      return ApiResponseHandler.forbidden(res, 'Admin access required');
    }

    req.admin = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return ApiResponseHandler.unauthorized(res, 'Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      return ApiResponseHandler.unauthorized(res, 'Token expired');
    }

    return ApiResponseHandler.internalServerError(res, 'Authentication error');
  }
};