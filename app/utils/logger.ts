interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: string;
  data?: any;
  requestId?: string;
  userId?: string;
}

class Logger {
  private formatMessage(entry: LogEntry): string {
    const baseMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;

    if (entry.requestId) {
      return `${baseMessage} [Request: ${entry.requestId}]`;
    }

    if (entry.userId) {
      return `${baseMessage} [User: ${entry.userId}]`;
    }

    return baseMessage;
  }

  private log(entry: LogEntry): void {
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

  info(message: string, data?: any, requestId?: string, userId?: string): void {
    this.log({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      data,
      requestId,
      userId,
    });
  }

  warn(message: string, data?: any, requestId?: string, userId?: string): void {
    this.log({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      data,
      requestId,
      userId,
    });
  }

  error(message: string, data?: any, requestId?: string, userId?: string): void {
    this.log({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      data,
      requestId,
      userId,
    });
  }

  debug(message: string, data?: any, requestId?: string, userId?: string): void {
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
  apiRequest(method: string, url: string, statusCode: number, duration: number, requestId?: string, userId?: string): void {
    this.info(`API ${method} ${url} - ${statusCode} (${duration}ms)`, undefined, requestId, userId);
  }

  apiError(method: string, url: string, error: any, requestId?: string, userId?: string): void {
    this.error(`API ${method} ${url} failed`, { error: error.message, stack: error.stack }, requestId, userId);
  }

  weavrRequest(method: string, endpoint: string, requestId?: string, userId?: string): void {
    this.debug(`Weavr API ${method} ${endpoint}`, undefined, requestId, userId);
  }

  weavrResponse(method: string, endpoint: string, statusCode: number, requestId?: string, userId?: string): void {
    this.debug(`Weavr API ${method} ${endpoint} - ${statusCode}`, undefined, requestId, userId);
  }

  weavrError(method: string, endpoint: string, error: any, requestId?: string, userId?: string): void {
    this.error(`Weavr API ${method} ${endpoint} failed`, { error: error.message }, requestId, userId);
  }
}

export const logger = new Logger();