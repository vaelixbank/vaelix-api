"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class Logger {
    formatMessage(entry) {
        const baseMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
        if (entry.requestId) {
            return `${baseMessage} [Request: ${entry.requestId}]`;
        }
        if (entry.userId) {
            return `${baseMessage} [User: ${entry.userId}]`;
        }
        return baseMessage;
    }
    log(entry) {
        const message = this.formatMessage(entry);
        switch (entry.level) {
            case 'info':
                console.log(message, entry.data || '');
                break;
            case 'warn':
                console.warn(message, entry.data || '');
                break;
            case 'error':
                console.error(message, entry.data || '');
                break;
            case 'debug':
                if (process.env.NODE_ENV === 'development') {
                    console.debug(message, entry.data || '');
                }
                break;
        }
    }
    info(message, data, requestId, userId) {
        this.log({
            level: 'info',
            message,
            timestamp: new Date().toISOString(),
            data,
            requestId,
            userId,
        });
    }
    warn(message, data, requestId, userId) {
        this.log({
            level: 'warn',
            message,
            timestamp: new Date().toISOString(),
            data,
            requestId,
            userId,
        });
    }
    error(message, data, requestId, userId) {
        this.log({
            level: 'error',
            message,
            timestamp: new Date().toISOString(),
            data,
            requestId,
            userId,
        });
    }
    debug(message, data, requestId, userId) {
        this.log({
            level: 'debug',
            message,
            timestamp: new Date().toISOString(),
            data,
            requestId,
            userId,
        });
    }
    // Specialized logging methods
    apiRequest(method, url, statusCode, duration, requestId, userId) {
        this.info(`API ${method} ${url} - ${statusCode} (${duration}ms)`, undefined, requestId, userId);
    }
    apiError(method, url, error, requestId, userId) {
        this.error(`API ${method} ${url} failed`, { error: error.message, stack: error.stack }, requestId, userId);
    }
    weavrRequest(method, endpoint, requestId, userId) {
        this.debug(`Weavr API ${method} ${endpoint}`, undefined, requestId, userId);
    }
    weavrResponse(method, endpoint, statusCode, requestId, userId) {
        this.debug(`Weavr API ${method} ${endpoint} - ${statusCode}`, undefined, requestId, userId);
    }
    weavrError(method, endpoint, error, requestId, userId) {
        this.error(`Weavr API ${method} ${endpoint} failed`, { error: error.message }, requestId, userId);
    }
}
exports.logger = new Logger();
