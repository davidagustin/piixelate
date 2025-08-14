/**
 * PII Detection Configuration
 * Centralized configuration management with environment variable handling
 */

import { DetectionConfig } from '../types/pii-types';
import { errorHandler, PIIErrorType } from '../utils/error-handler';

/**
 * Environment variable configuration interface
 */
interface EnvironmentVariables {
  // Detection settings
  ENABLE_COMPUTER_VISION: string;
  ENABLE_LLM: string;
  ENABLE_PATTERN_MATCHING: string;
  ENABLE_SPECIALIZED_DETECTION: string;

  // Performance settings
  CONFIDENCE_THRESHOLD: string;
  MAX_DETECTIONS: string;
  PROCESSING_TIMEOUT: string;

  // Security settings
  MAX_FILE_SIZE: string;
  ALLOWED_IMAGE_TYPES: string;

  // LLM settings
  LLM_PROVIDER: string;
  LLM_MODEL: string;
  LLM_ENDPOINT: string;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;

  // Debug settings
  DEBUG_MODE: string;
  LOG_LEVEL: string;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: DetectionConfig = {
  enableComputerVision: true,
  enableLLM: true,
  enablePatternMatching: true,
  enableSpecializedDetection: true,
  confidenceThreshold: 0.6,
  maxDetections: 100,
};

/**
 * Configuration validator
 */
class ConfigValidator {
  /**
   * Validate boolean environment variable
   */
  static validateBoolean(value: string, defaultValue: boolean): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Validate number environment variable
   */
  static validateNumber(value: string, defaultValue: number, min?: number, max?: number): number {
    if (!value) return defaultValue;

    const num = parseFloat(value);
    if (isNaN(num)) {
      errorHandler.handleConfigurationError('number_validation', value);
      return defaultValue;
    }

    if (min !== undefined && num < min) {
      errorHandler.handleConfigurationError('number_min', { value: num, min });
      return min;
    }

    if (max !== undefined && num > max) {
      errorHandler.handleConfigurationError('number_max', { value: num, max });
      return max;
    }

    return num;
  }

  /**
   * Validate string environment variable
   */
  static validateString(value: string, defaultValue: string, allowedValues?: string[]): string {
    if (!value) return defaultValue;

    if (allowedValues && !allowedValues.includes(value)) {
      errorHandler.handleConfigurationError('string_validation', { value, allowedValues });
      return defaultValue;
    }

    return value;
  }

  /**
   * Validate array environment variable
   */
  static validateArray(value: string, defaultValue: string[]): string[] {
    if (!value) return defaultValue;

    try {
      const array = value.split(',').map(item => item.trim()).filter(Boolean);
      return array.length > 0 ? array : defaultValue;
    } catch (error) {
      errorHandler.handleConfigurationError('array_validation', value);
      return defaultValue;
    }
  }
}

/**
 * Load environment variables with validation
 */
function loadEnvironmentVariables(): EnvironmentVariables {
  return {
    // Detection settings
    ENABLE_COMPUTER_VISION: process.env.NEXT_PUBLIC_ENABLE_CV || 'true',
    ENABLE_LLM: process.env.NEXT_PUBLIC_ENABLE_LLM || 'true',
    ENABLE_PATTERN_MATCHING: process.env.NEXT_PUBLIC_ENABLE_PATTERN_MATCHING || 'true',
    ENABLE_SPECIALIZED_DETECTION: process.env.NEXT_PUBLIC_ENABLE_SPECIALIZED_DETECTION || 'true',

    // Performance settings
    CONFIDENCE_THRESHOLD: process.env.NEXT_PUBLIC_CONFIDENCE_THRESHOLD || '0.6',
    MAX_DETECTIONS: process.env.NEXT_PUBLIC_MAX_DETECTIONS || '100',
    PROCESSING_TIMEOUT: process.env.NEXT_PUBLIC_PROCESSING_TIMEOUT || '30000',

    // Security settings
    MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760',
    ALLOWED_IMAGE_TYPES: process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES || 'image/jpeg,image/png,image/gif,image/webp',

    // LLM settings
    LLM_PROVIDER: process.env.NEXT_PUBLIC_LLM_PROVIDER || 'mock',
    LLM_MODEL: process.env.NEXT_PUBLIC_LLM_MODEL || 'gpt-4o-mini',
    LLM_ENDPOINT: process.env.NEXT_PUBLIC_LLM_ENDPOINT || '',
    OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    ANTHROPIC_API_KEY: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',

    // Debug settings
    DEBUG_MODE: process.env.NODE_ENV === 'development' ? 'true' : 'false',
    LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL || 'warn',
  };
}

/**
 * Create detection configuration from environment variables
 */
function createDetectionConfig(): DetectionConfig {
  const env = loadEnvironmentVariables();

  const config: DetectionConfig = {
    enableComputerVision: ConfigValidator.validateBoolean(env.ENABLE_COMPUTER_VISION, true),
    enableLLM: ConfigValidator.validateBoolean(env.ENABLE_LLM, true),
    enablePatternMatching: ConfigValidator.validateBoolean(env.ENABLE_PATTERN_MATCHING, true),
    enableSpecializedDetection: ConfigValidator.validateBoolean(env.ENABLE_SPECIALIZED_DETECTION, true),
    confidenceThreshold: ConfigValidator.validateNumber(env.CONFIDENCE_THRESHOLD, 0.6, 0, 1),
    maxDetections: ConfigValidator.validateNumber(env.MAX_DETECTIONS, 100, 1, 1000),
  };

  // Validate configuration consistency
  validateConfigurationConsistency(config);

  return config;
}

/**
 * Validate configuration consistency
 */
function validateConfigurationConsistency(config: DetectionConfig): void {
  // Ensure at least one detection method is enabled
  if (!config.enableComputerVision && !config.enableLLM && !config.enablePatternMatching) {
    errorHandler.handleConfigurationError(
      'detection_methods',
      'At least one detection method must be enabled'
    );
    // Enable pattern matching as fallback
    config.enablePatternMatching = true;
  }

  // Validate LLM configuration if enabled
  if (config.enableLLM) {
    const env = loadEnvironmentVariables();
    const llmProvider = ConfigValidator.validateString(
      env.LLM_PROVIDER,
      'mock',
      ['openai', 'anthropic', 'local', 'mock']
    );

    if (llmProvider === 'openai' && !env.OPENAI_API_KEY) {
      errorHandler.handleConfigurationError(
        'openai_api_key',
        'OpenAI API key required when LLM is enabled with OpenAI provider'
      );
      config.enableLLM = false;
    }

    if (llmProvider === 'anthropic' && !env.ANTHROPIC_API_KEY) {
      errorHandler.handleConfigurationError(
        'anthropic_api_key',
        'Anthropic API key required when LLM is enabled with Anthropic provider'
      );
      config.enableLLM = false;
    }
  }
}

/**
 * Extended configuration interface with all settings
 */
export interface ExtendedDetectionConfig extends DetectionConfig {
  // Performance settings
  processingTimeout: number;

  // Security settings
  maxFileSize: number;
  allowedImageTypes: string[];

  // LLM settings
  llmProvider: string;
  llmModel: string;
  llmEndpoint?: string;
  openaiApiKey?: string;
  anthropicApiKey?: string;

  // Debug settings
  debugMode: boolean;
  logLevel: string;
}

/**
 * Create extended configuration
 */
function createExtendedConfig(): ExtendedDetectionConfig {
  const env = loadEnvironmentVariables();
  const baseConfig = createDetectionConfig();

  return {
    ...baseConfig,

    // Performance settings
    processingTimeout: ConfigValidator.validateNumber(env.PROCESSING_TIMEOUT, 30000, 1000, 300000),

    // Security settings
    maxFileSize: ConfigValidator.validateNumber(env.MAX_FILE_SIZE, 10485760, 1024, 100 * 1024 * 1024),
    allowedImageTypes: ConfigValidator.validateArray(
      env.ALLOWED_IMAGE_TYPES,
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    ),

    // LLM settings
    llmProvider: ConfigValidator.validateString(
      env.LLM_PROVIDER,
      'mock',
      ['openai', 'anthropic', 'local', 'mock']
    ),
    llmModel: ConfigValidator.validateString(env.LLM_MODEL, 'gpt-4o-mini'),
    llmEndpoint: env.LLM_ENDPOINT || undefined,
    openaiApiKey: env.OPENAI_API_KEY || undefined,
    anthropicApiKey: env.ANTHROPIC_API_KEY || undefined,

    // Debug settings
    debugMode: ConfigValidator.validateBoolean(env.DEBUG_MODE, false),
    logLevel: ConfigValidator.validateString(
      env.LOG_LEVEL,
      'warn',
      ['error', 'warn', 'info', 'debug']
    ),
  };
}

/**
 * Configuration manager class
 */
export class DetectionConfigManager {
  private static instance: DetectionConfigManager;
  private config: ExtendedDetectionConfig;
  private lastReload: Date;

  private constructor() {
    this.config = createExtendedConfig();
    this.lastReload = new Date();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DetectionConfigManager {
    if (!DetectionConfigManager.instance) {
      DetectionConfigManager.instance = new DetectionConfigManager();
    }
    return DetectionConfigManager.instance;
  }

  /**
   * Get current configuration
   */
  public getConfig(): ExtendedDetectionConfig {
    return { ...this.config };
  }

  /**
   * Get detection configuration
   */
  public getDetectionConfig(): DetectionConfig {
    const { processingTimeout, maxFileSize, allowedImageTypes, llmProvider, llmModel, llmEndpoint, openaiApiKey, anthropicApiKey, debugMode, logLevel, ...detectionConfig } = this.config;
    return detectionConfig;
  }

  /**
   * Reload configuration from environment
   */
  public reloadConfig(): void {
    this.config = createExtendedConfig();
    this.lastReload = new Date();
  }

  /**
   * Get last reload time
   */
  public getLastReload(): Date {
    return new Date(this.lastReload);
  }

  /**
   * Update configuration (for testing purposes)
   */
  public updateConfig(updates: Partial<DetectionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Validate file type
   */
  public isValidFileType(mimeType: string): boolean {
    return this.config.allowedImageTypes.includes(mimeType);
  }

  /**
   * Validate file size
   */
  public isValidFileSize(size: number): boolean {
    return size <= this.config.maxFileSize;
  }

  /**
   * Get configuration summary for logging
   */
  public getConfigSummary(): Record<string, any> {
    return {
      detectionMethods: {
        computerVision: this.config.enableComputerVision,
        llm: this.config.enableLLM,
        patternMatching: this.config.enablePatternMatching,
        specialized: this.config.enableSpecializedDetection,
      },
      performance: {
        confidenceThreshold: this.config.confidenceThreshold,
        maxDetections: this.config.maxDetections,
        processingTimeout: this.config.processingTimeout,
      },
      security: {
        maxFileSize: this.config.maxFileSize,
        allowedImageTypes: this.config.allowedImageTypes,
      },
      llm: {
        provider: this.config.llmProvider,
        model: this.config.llmModel,
        hasOpenAIKey: !!this.config.openaiApiKey,
        hasAnthropicKey: !!this.config.anthropicApiKey,
      },
      debug: {
        debugMode: this.config.debugMode,
        logLevel: this.config.logLevel,
      },
    };
  }
}

/**
 * Export singleton instance
 */
export const detectionConfig = DetectionConfigManager.getInstance();

/**
 * Export default configuration for backward compatibility
 */
export const defaultDetectionConfig: DetectionConfig = DEFAULT_CONFIG;
