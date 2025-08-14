/**
 * Application Constants
 * Centralized constants to avoid magic numbers and improve maintainability
 */

// File size constants (in bytes)
export const FILE_SIZE = {
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_FILE_SIZE: 1024, // 1KB
} as const;

// Image processing constants
export const IMAGE = {
  MAX_WIDTH: 800,
  MAX_HEIGHT: 600,
  QUALITY: 0.8,
  FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  COMPRESSION_QUALITY: 0.95,
} as const;

// Detection confidence thresholds
export const CONFIDENCE = {
  MIN: 0,
  MAX: 1,
  DEFAULT: 0.6,
  HIGH: 0.8,
  VERY_HIGH: 0.95,
  LOW: 0.3,
} as const;

// Processing timeouts (in milliseconds)
export const TIMEOUT = {
  DEFAULT: 30000,
  SHORT: 5000,
  LONG: 60000,
  OCR: 30000,
  LLM: 45000,
} as const;

// Color constants for image processing
export const COLORS = {
  GRAYSCALE_WEIGHTS: {
    RED: 0.299,
    GREEN: 0.587,
    BLUE: 0.114,
  },
  CHANNELS: 4, // RGBA
  MAX_VALUE: 255,
  MIN_VALUE: 0,
} as const;

// Sobel operator kernels
export const SOBEL = {
  X: [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  Y: [-1, -2, -1, 0, 0, 0, 1, 2, 1],
  THRESHOLD: 50,
  KERNEL_SIZE: 3,
} as const;

// Text detection constants
export const TEXT_DETECTION = {
  MIN_CONTOUR_SIZE: 10,
  MIN_ASPECT_RATIO: 0.5,
  MAX_ASPECT_RATIO: 10,
  MIN_AREA_RATIO: 0.001,
  MAX_AREA_RATIO: 0.5,
  MIN_WIDTH: 20,
  MIN_HEIGHT: 10,
  MIN_DENSITY: 0.01,
  MAX_DENSITY: 0.1,
  CONFIDENCE_BOOST: 1.2,
} as const;

// PII Pattern constants
export const PII_PATTERNS = {
  CREDIT_CARD_LENGTH: 16,
  SSN_LENGTH: 9,
  PHONE_LENGTH: 10,
  EMAIL_MIN_LENGTH: 5,
  ZIP_CODE_LENGTH: 5,
  VIN_LENGTH: 17,
  IPV4_SEGMENTS: 4,
  IPV6_SEGMENTS: 8,
  MAC_ADDRESS_SEGMENTS: 6,
} as const;

// Error handling constants
export const ERROR = {
  MAX_ERRORS: 100,
  RETRY_ATTEMPTS: 3,
  BACKOFF_MULTIPLIER: 2,
  INITIAL_DELAY: 1000,
} as const;

// Cache constants
export const CACHE = {
  TTL: 300000, // 5 minutes
  MAX_SIZE: 100,
  CLEANUP_INTERVAL: 60000, // 1 minute
} as const;

// UI constants
export const UI = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOOLTIP_DELAY: 1000,
  MAX_DISPLAY_ITEMS: 50,
} as const;

// API constants
export const API = {
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
  RATE_LIMIT_DELAY: 1000,
} as const;
