/**
 * PII Detection Types and Interfaces
 * Centralized type definitions for the PII detection system
 */

/**
 * Core PII detection result interface
 */
export interface PIIDetection {
  type: PIIType;
  confidence: number;
  boundingBox: BoundingBox;
  text: string;
  line: number;
  verified?: boolean;
  source?: DetectionSource;
}

/**
 * All supported PII types
 */
export type PIIType =
  | 'credit_card'
  | 'address'
  | 'street_sign'
  | 'phone'
  | 'email'
  | 'ssn'
  | 'license_plate'
  | 'name'
  | 'drivers_license'
  | 'id_card'
  | 'zip_code'
  | 'barcode'
  | 'document_id'
  | 'numerical_data'
  | 'sensitive_data'
  | 'passport_number'
  | 'medical_info'
  | 'financial_data'
  | 'biometric_data'
  | 'ip_address'
  | 'mac_address'
  | 'vehicle_vin'
  | 'insurance_number'
  | 'bank_account'
  | 'tax_id'
  | 'student_id'
  | 'employee_id'
  | 'patient_id'
  | 'prescription_data'
  | 'health_insurance'
  | 'crypto_wallet'
  | 'social_media_handle'
  | 'date_of_birth';

/**
 * Bounding box coordinates
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Detection source for tracking which layer detected the PII
 */
export type DetectionSource = 'pattern' | 'vision' | 'llm' | 'specialized';

/**
 * OCR line result interface
 */
export interface OCRLine {
  text: string;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

/**
 * OCR result interface
 */
export interface OCRResult {
  text: string;
  lines: OCRLine[];
  confidence?: number;
  processingTime?: number;
}

/**
 * Vision detection interface
 */
export interface VisionDetection {
  type: 'text_region' | 'document' | 'face';
  confidence: number;
  boundingBox: BoundingBox;
}

/**
 * Detection configuration interface
 */
export interface DetectionConfig {
  enableComputerVision: boolean;
  enableLLM: boolean;
  enablePatternMatching: boolean;
  enableSpecializedDetection: boolean;
  confidenceThreshold: number;
  maxDetections: number;
}

/**
 * Error types for PII detection
 */
export enum PIIErrorType {
  INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  LLM_ERROR = 'LLM_ERROR',
  VISION_ERROR = 'VISION_ERROR',
  OCR_ERROR = 'OCR_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

/**
 * PII detection error interface
 */
export interface PIIError {
  type: PIIErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Detection result wrapper
 */
export interface DetectionResult {
  success: boolean;
  detections: PIIDetection[];
  errors: PIIError[];
  processingTime: number;
  metadata: {
    totalLines: number;
    totalCharacters: number;
    detectionSources: Record<DetectionSource, number>;
  };
}

/**
 * LLM verification request interface
 */
export interface LLMVerificationRequest {
  fullText: string;
  patternDetections: PIIDetection[];
  context?: string;
}

/**
 * LLM verification response interface
 */
export interface LLMVerificationResponse {
  verifiedDetections: PIIDetection[];
  newDetections: PIIDetection[];
  confidenceAdjustments: Array<{
    originalText: string;
    originalType: PIIType;
    newConfidence: number;
    reason: string;
  }>;
}

/**
 * Pattern match result interface
 */
export interface PatternMatch {
  type: PIIType;
  text: string;
  confidence: number;
  startIndex: number;
  endIndex: number;
  pattern: RegExp;
}

/**
 * Detection statistics interface
 */
export interface DetectionStats {
  totalDetections: number;
  detectionsByType: Record<PIIType, number>;
  averageConfidence: number;
  processingTimeMs: number;
  errorCount: number;
}
