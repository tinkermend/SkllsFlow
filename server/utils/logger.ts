/**
 * Simple structured logger
 * Provides consistent logging format across the application
 */

import { env } from '../config/env.js';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
    };

    return JSON.stringify(logData);
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | LogContext): void {
    let context: LogContext | undefined;

    if (error instanceof Error) {
      context = {
        error: error.message,
        stack: env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    } else if (error) {
      context = error;
    }

    console.error(this.formatMessage('error', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }
}

export const logger = new Logger();
