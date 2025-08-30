/**
 * Logger utility for structured logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ILogMeta {
  [key: string]: any;
}

export interface ILogger {
  debug(message: string, meta?: ILogMeta): void;
  info(message: string, meta?: ILogMeta): void;
  warn(message: string, meta?: ILogMeta): void;
  error(message: string, error?: Error | ILogMeta, meta?: ILogMeta): void;
  child(context: string): ILogger;
}

export class Logger implements ILogger {
  private static logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  private static logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  constructor(private context: string) {}

  /**
   * Create a child logger with additional context
   */
  child(context: string): ILogger {
    return new Logger(`${this.context}:${context}`);
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: ILogMeta): void {
    this.log('debug', message, meta);
  }

  /**
   * Log info message
   */
  info(message: string, meta?: ILogMeta): void {
    this.log('info', message, meta);
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: ILogMeta): void {
    this.log('warn', message, meta);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | ILogMeta, meta?: ILogMeta): void {
    let errorMeta: ILogMeta = {};
    let actualMeta = meta;

    if (error instanceof Error) {
      errorMeta = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        }
      };
    } else if (error && typeof error === 'object') {
      actualMeta = error;
    }

    this.log('error', message, { ...errorMeta, ...actualMeta });
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, meta?: ILogMeta): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      context: this.context,
      message,
      ...meta
    };

    // In production, this could be replaced with a proper logging service
    switch (level) {
      case 'debug':
        console.debug(JSON.stringify(logEntry));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
    }
  }

  /**
   * Check if message should be logged based on current log level
   */
  private shouldLog(level: LogLevel): boolean {
    return Logger.logLevels[level] >= Logger.logLevels[Logger.logLevel];
  }

  /**
   * Set global log level
   */
  static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }

  /**
   * Get current log level
   */
  static getLogLevel(): LogLevel {
    return Logger.logLevel;
  }
}

/**
 * Create a logger instance
 */
export function createLogger(context: string): ILogger {
  return new Logger(context);
}