"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseHandler = void 0;
class ApiResponseHandler {
    static success(res, data, statusCode = 200) {
        const response = {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
        return res.status(statusCode).json(response);
    }
    static error(res, message, code, statusCode = 500, details) {
        const response = {
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
    static created(res, data) {
        return this.success(res, data, 201);
    }
    static noContent(res) {
        return res.status(204).send();
    }
    static badRequest(res, message, code = 'BAD_REQUEST', details) {
        return this.error(res, message, code, 400, details);
    }
    static unauthorized(res, message = 'Unauthorized', code = 'UNAUTHORIZED') {
        return this.error(res, message, code, 401);
    }
    static forbidden(res, message = 'Forbidden', code = 'FORBIDDEN') {
        return this.error(res, message, code, 403);
    }
    static notFound(res, message = 'Not found', code = 'NOT_FOUND') {
        return this.error(res, message, code, 404);
    }
    static conflict(res, message, code = 'CONFLICT') {
        return this.error(res, message, code, 409);
    }
    static unprocessableEntity(res, message, code = 'UNPROCESSABLE_ENTITY', details) {
        return this.error(res, message, code, 422, details);
    }
    static tooManyRequests(res, message = 'Too many requests', code = 'TOO_MANY_REQUESTS') {
        return this.error(res, message, code, 429);
    }
    static internalServerError(res, message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR') {
        return this.error(res, message, code, 500);
    }
}
exports.ApiResponseHandler = ApiResponseHandler;
