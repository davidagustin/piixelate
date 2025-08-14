/* eslint-disable no-console */
/**
 * PII Detection Error Handler
 * Centralized error handling with proper logging and recovery strategies
 */

import { PIIError, PIIErrorType } from '../types/pii-types';

/**
 * Error handler class for PII detection
 */
export class PIIErrorHandler {
  private static instance: PIIErrorHandler;
  private errors: PIIError[] = [];
  private maxErrors = 100; // Prevent memory leaks

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PIIErrorHandler {
    if (!PIIErrorHandler.instance) {
      PIIErrorHandler.instance = new PIIErrorHandler();
    }
    return PIIErrorHandler.instance;
  }

  /**
   * Create a new PII error
   */
  public createError(
    type: PIIErrorType,
    message: string,
    details?: any,
    recoverable: boolean = true
  ): PIIError {
    const error: PIIError = {
      type,
      message,
      details,
      timestamp: new Date(),
      recoverable,
    };

    this.logError(error);
    this.addError(error);

    return error;
  }

  /**
   * Handle initialization errors
   */
  public handleInitializationError(component: string, error: Error): PIIError {
    return this.createError(
      PIIErrorType.INITIALIZATION_ERROR,
      `Failed to initialize ${component}: ${error.message}`,
      { component, originalError: error.message },
      false
    );
  }

  /**
   * Handle processing errors
   */
  public handleProcessingError(operation: string, error: Error): PIIError {
    return this.createError(
      PIIErrorType.PROCESSING_ERROR,
      `Processing error in ${operation}: ${error.message}`,
      { operation, originalError: error.message },
      true
    );
  }

  /**
   * Handle LLM errors
   */
  public handleLLMError(operation: string, error: Error): PIIError {
    return this.createError(
      PIIErrorType.LLM_ERROR,
      `LLM error in ${operation}: ${error.message}`,
      { operation, originalError: error.message },
      true
    );
  }

  /**
   * Handle vision errors
   */
  public handleVisionError(operation: string, error: Error): PIIError {
    return this.createError(
      PIIErrorType.VISION_ERROR,
      `Computer vision error in ${operation}: ${error.message}`,
      { operation, originalError: error.message },
      true
    );
  }

  /**
   * Handle OCR errors
   */
  public handleOCRError(operation: string, error: Error): PIIError {
    return this.createError(
      PIIErrorType.OCR_ERROR,
      `OCR error in ${operation}: ${error.message}`,
      { operation, originalError: error.message },
      true
    );
  }

  /**
   * Handle configuration errors
   */
  public handleConfigurationError(setting: string, value: any): PIIError {
    return this.createError(
      PIIErrorType.CONFIGURATION_ERROR,
      `Invalid configuration for ${setting}: ${JSON.stringify(value)}`,
      { setting, value },
      false
    );
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(field: string, value: any, rule: string): PIIError {
    return this.createError(
      PIIErrorType.VALIDATION_ERROR,
      `Validation failed for ${field}: ${rule}`,
      { field, value, rule },
      true
    );
  }

  /**
   * Log error to console with appropriate level
   */
  private logError(error: PIIError): void {
    const logMessage = `[${error.type}] ${error.message}`;

    if (!error.recoverable) {
      console.error(logMessage, error.details);
    } else {
      console.warn(logMessage, error.details);
    }
  }

  /**
   * Add error to internal storage
   */
  private addError(error: PIIError): void {
    this.errors.push(error);

    // Prevent memory leaks by limiting stored errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  /**
   * Get all errors
   */
  public getErrors(): PIIError[] {
    return [...this.errors];
  }

  /**
   * Get errors by type
   */
  public getErrorsByType(type: PIIErrorType): PIIError[] {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * Get recent errors (last N errors)
   */
  public getRecentErrors(count: number = 10): PIIError[] {
    return this.errors.slice(-count);
  }

  /**
   * Clear all errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Check if there are any non-recoverable errors
   */
  public hasCriticalErrors(): boolean {
    return this.errors.some(error => !error.recoverable);
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<PIIErrorType, number> {
    const stats: Record<PIIErrorType, number> = {} as Record<PIIErrorType, number>;

    Object.values(PIIErrorType).forEach(type => {
      stats[type] = this.errors.filter(error => error.type === type).length;
    });

    return stats;
  }

  /**
   * Safe execution wrapper
   */
  public async safeExecute<T>(
    operation: () => Promise<T>,
    errorType: PIIErrorType,
    operationName: string,
    fallback?: T
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.createError(
        errorType,
        `Operation failed: ${operationName}`,
        { operationName, originalError: error instanceof Error ? error.message : String(error) },
        true
      );

      if (fallback !== undefined) {
        return fallback;
      }

      return null;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  public async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

/**
 * Export singleton instance
 */
export const errorHandler = PIIErrorHandler.getInstance();

/**
 * Utility function to create error with proper typing
 */
export function createPIIError(
  type: PIIErrorType,
  message: string,
  details?: any,
  recoverable: boolean = true
): PIIError {
  return errorHandler.createError(type, message, details, recoverable);
}

/**
 * Utility function for safe execution
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  errorType: PIIErrorType,
  operationName: string,
  fallback?: T
): Promise<T | null> {
  return errorHandler.safeExecute(operation, errorType, operationName, fallback);
}
