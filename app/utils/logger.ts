/**
 * Logger Utility
 * Centralized logging with configurable levels and environment-based control
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
}

class Logger {
  private config: LogConfig;
  private static instance: Logger;

  private constructor() {
    this.config = {
      level: this.getLogLevelFromEnv(),
      enableConsole: process.env.NODE_ENV !== 'production',
      enableFile: false,
    };
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase();
    switch (level) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ` ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${formattedArgs}`;
  }

  public error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = this.formatMessage('error', message, ...args);
      if (this.config.enableConsole) {
        // eslint-disable-next-line no-console
        console.error(formattedMessage);
      }
    }
  }

  public warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = this.formatMessage('warn', message, ...args);
      if (this.config.enableConsole) {
        // eslint-disable-next-line no-console
        console.warn(formattedMessage);
      }
    }
  }

  public info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = this.formatMessage('info', message, ...args);
      if (this.config.enableConsole) {
        // eslint-disable-next-line no-console
        console.info(formattedMessage);
      }
    }
  }

  public debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = this.formatMessage('debug', message, ...args);
      if (this.config.enableConsole) {
        // eslint-disable-next-line no-console
        console.debug(formattedMessage);
      }
    }
  }

  public log(message: string, ...args: any[]): void {
    this.info(message, ...args);
  }

  public setConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): LogConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for direct import
export const logError = (message: string, ...args: any[]) => logger.error(message, ...args);
export const logWarn = (message: string, ...args: any[]) => logger.warn(message, ...args);
export const logInfo = (message: string, ...args: any[]) => logger.info(message, ...args);
export const logDebug = (message: string, ...args: any[]) => logger.debug(message, ...args);
export const log = (message: string, ...args: any[]) => logger.log(message, ...args);
