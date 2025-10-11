import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    request_id?: string;
  };
}

export class ApiResponseHandler {
  static success<T>(res: Response, data: T, statusCode: number = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    code: string,
    statusCode: number = 500,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        message,
        code,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T): Response {
    return this.success(res, data, 201);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(res: Response, message: string, code: string = 'BAD_REQUEST', details?: any): Response {
    return this.error(res, message, code, 400, details);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized', code: string = 'UNAUTHORIZED'): Response {
    return this.error(res, message, code, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden', code: string = 'FORBIDDEN'): Response {
    return this.error(res, message, code, 403);
  }

  static notFound(res: Response, message: string = 'Not found', code: string = 'NOT_FOUND'): Response {
    return this.error(res, message, code, 404);
  }

  static conflict(res: Response, message: string, code: string = 'CONFLICT'): Response {
    return this.error(res, message, code, 409);
  }

  static unprocessableEntity(res: Response, message: string, code: string = 'UNPROCESSABLE_ENTITY', details?: any): Response {
    return this.error(res, message, code, 422, details);
  }

  static tooManyRequests(res: Response, message: string = 'Too many requests', code: string = 'TOO_MANY_REQUESTS'): Response {
    return this.error(res, message, code, 429);
  }

  static internalServerError(res: Response, message: string = 'Internal server error', code: string = 'INTERNAL_SERVER_ERROR'): Response {
    return this.error(res, message, code, 500);
  }
}