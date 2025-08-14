/**
 * Specialized PII Detectors
 * Specialized detection functions for specific PII types
 */

import { PIIDetection, OCRResult, DetectionSource } from '../types/pii-types';
import { PII_PATTERNS } from '../utils/pii-patterns';
import { errorHandler } from '../utils/error-handler';
import { detectionConfig } from '../config/detection-config';

/**
 * Specialized detector class for specific PII types
 */
export class SpecializedDetector {
  private config = detectionConfig.getDetectionConfig();

  /**
   * Detect document regions (driver's licenses, IDs, credit cards, etc.)
   * @param ocrResult - OCR processing result
   * @returns Array of document detections
   */
  public detectDocumentRegions(ocrResult: OCRResult): PIIDetection[] {
    if (!this.config.enableSpecializedDetection) {
      return [];
    }

    try {
      const documentDetections: PIIDetection[] = [];
      const fullText = ocrResult.text.toLowerCase();
      
      // Check for different document types
      const documentType = this.identifyDocumentType(fullText);
      
      if (documentType) {
        const detection = this.createDocumentDetection(ocrResult, documentType);
        if (detection) {
          documentDetections.push(detection);
        }
      }
      
      return documentDetections;
    } catch (error) {
      errorHandler.handleProcessingError('document_detection', error as Error);
      return [];
    }
  }

  /**
   * Identify the type of document based on text content
   * @param text - Text to analyze
   * @returns Document type or null
   */
  private identifyDocumentType(text: string): string | null {
    // Credit card indicators
    const creditCardIndicators = [
      'visa', 'mastercard', 'amex', 'discover', 'jcb', 'diners',
      'valid thru', 'expires', 'expiry', 'card number', 'card no',
      'credit card', 'debit card', 'capital bank', 'bank'
    ];
    
    // Driver's license indicators
    const licenseIndicators = [
      'driver license', 'drivers license', 'driving license',
      'id card', 'identification card', 'state id',
      'hawaii', 'california', 'new york', 'texas', 'florida',
      'department of motor vehicles', 'dmv', 'organ donor'
    ];
    
    // Passport indicators
    const passportIndicators = [
      'passport', 'passport number', 'passport no',
      'united states', 'usa', 'republic of', 'nationality'
    ];
    
    // Government ID indicators
    const governmentIdIndicators = [
      'government id', 'state identification', 'official id',
      'federal id', 'national id', 'citizen id'
    ];
    
    // Employee/Student ID indicators
    const employeeIdIndicators = [
      'employee id', 'student id', 'member id',
      'staff id', 'faculty id', 'university id'
    ];
    
    // Check for credit card (highest priority for privacy)
    if (creditCardIndicators.some(indicator => text.toLowerCase().includes(indicator.toLowerCase()))) {
      return 'credit_card';
    }
    
    // Check for driver's license
    if (licenseIndicators.some(indicator => text.toLowerCase().includes(indicator.toLowerCase()))) {
      return 'drivers_license';
    }
    
    // Check for passport
    if (passportIndicators.some(indicator => text.toLowerCase().includes(indicator.toLowerCase()))) {
      return 'passport_number';
    }
    
    // Check for government ID
    if (governmentIdIndicators.some(indicator => text.toLowerCase().includes(indicator.toLowerCase()))) {
      return 'id_card';
    }
    
    // Check for employee/student ID
    if (employeeIdIndicators.some(indicator => text.toLowerCase().includes(indicator.toLowerCase()))) {
      return 'id_card';
    }
    
    return null;
  }



  /**
   * Create document detection for entire document
   * @param ocrResult - OCR processing result
   * @param documentType - Type of document detected
   * @returns Document detection or null
   */
  private createDocumentDetection(ocrResult: OCRResult, documentType: string): PIIDetection | null {
    const allLines = ocrResult.lines;
    if (allLines.length === 0) {
      return null;
    }

    // Find the bounding box that covers all text
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    
    allLines.forEach(line => {
      const bbox = line.bbox;
      minX = Math.min(minX, bbox.x0);
      minY = Math.min(minY, bbox.y0);
      maxX = Math.max(maxX, bbox.x1);
      maxY = Math.max(maxY, bbox.y1);
    });
    
    // Add generous padding around the document for complete coverage
    // Credit cards and IDs need more padding to ensure complete coverage
    const basePadding = 40;
    const extraPadding = documentType === 'credit_card' ? 60 : 40;
    const totalPadding = basePadding + extraPadding;
    
    return {
      type: documentType as any,
      confidence: 0.98, // High confidence for document detection
      boundingBox: {
        x: Math.max(0, minX - totalPadding),
        y: Math.max(0, minY - totalPadding),
        width: maxX - minX + (totalPadding * 2),
        height: maxY - minY + (totalPadding * 2)
      },
      text: 'DRIVER LICENSE DOCUMENT',
      line: 0,
      source: 'specialized' as DetectionSource,
    };
  }

  /**
   * Detect numerical data patterns
   * @param ocrResult - OCR processing result
   * @returns Array of numerical data detections
   */
  public detectNumericalData(ocrResult: OCRResult): PIIDetection[] {
    if (!this.config.enableSpecializedDetection) {
      return [];
    }

    try {
      const numericalDetections: PIIDetection[] = [];
      
      // Process each line for numerical data
      ocrResult.lines.forEach((line, lineIndex) => {
        const lineDetections = this.processNumericalLine(line, lineIndex);
        numericalDetections.push(...lineDetections);
      });
      
      return numericalDetections;
    } catch (error) {
      errorHandler.handleProcessingError('numerical_detection', error as Error);
      return [];
    }
  }

  /**
   * Process a line for numerical data detection
   * @param line - OCR line data
   * @param lineIndex - Line index
   * @returns Array of numerical detections
   */
  private processNumericalLine(
    line: OCRResult['lines'][0],
    lineIndex: number
  ): PIIDetection[] {
    const detections: PIIDetection[] = [];
    const lineText = line.text;
    
    // Check for numerical patterns
    PII_PATTERNS.numerical_data?.forEach(pattern => {
      const matches = lineText.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          const detection = this.createNumericalDetection(match, line, lineIndex);
          if (detection) {
            detections.push(detection);
          }
        });
      }
    });
    
    return detections;
  }

  /**
   * Create numerical data detection
   * @param match - Matched numerical data
   * @param line - OCR line data
   * @param lineIndex - Line index
   * @returns Numerical detection or null
   */
  private createNumericalDetection(
    match: string,
    line: OCRResult['lines'][0],
    lineIndex: number
  ): PIIDetection | null {
    try {
      // Find the position of this numerical data in the line
      const startIndex = line.text.indexOf(match);
      if (startIndex === -1) {
        return null;
      }
      
      // Calculate bounding box for this specific numerical data
      const lineWidth = line.bbox.x1 - line.bbox.x0;
      const charWidth = lineWidth / line.text.length;
      
      return {
        type: 'numerical_data',
        confidence: 0.9,
        boundingBox: {
          x: line.bbox.x0 + (startIndex * charWidth),
          y: line.bbox.y0,
          width: match.length * charWidth,
          height: line.bbox.y1 - line.bbox.y0
        },
        text: match,
        line: lineIndex,
        source: 'specialized' as DetectionSource,
      };
    } catch (error) {
      errorHandler.handleProcessingError('numerical_detection_creation', error as Error);
      return null;
    }
  }

  /**
   * Detect sensitive data (dates, birthdays, IDs)
   * @param ocrResult - OCR processing result
   * @returns Array of sensitive data detections
   */
  public detectSensitiveData(ocrResult: OCRResult): PIIDetection[] {
    if (!this.config.enableSpecializedDetection) {
      return [];
    }

    try {
      const sensitiveDetections: PIIDetection[] = [];
      
      // Process each line for sensitive data
      ocrResult.lines.forEach((line, lineIndex) => {
        const lineDetections = this.processSensitiveLine(line, lineIndex);
        sensitiveDetections.push(...lineDetections);
      });
      
      return sensitiveDetections;
    } catch (error) {
      errorHandler.handleProcessingError('sensitive_detection', error as Error);
      return [];
    }
  }

  /**
   * Process a line for sensitive data detection
   * @param line - OCR line data
   * @param lineIndex - Line index
   * @returns Array of sensitive data detections
   */
  private processSensitiveLine(
    line: OCRResult['lines'][0],
    lineIndex: number
  ): PIIDetection[] {
    const detections: PIIDetection[] = [];
    const lineText = line.text;
    
    // Check for sensitive patterns (dates, birthdays, IDs)
    PII_PATTERNS.sensitive_data?.forEach((pattern: RegExp) => {
      const matches = lineText.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          const detection = this.createSensitiveDetection(match, line, lineIndex);
          if (detection) {
            detections.push(detection);
          }
        });
      }
    });
    
    return detections;
  }

  /**
   * Create sensitive data detection
   * @param match - Matched sensitive data
   * @param line - OCR line data
   * @param lineIndex - Line index
   * @returns Sensitive detection or null
   */
  private createSensitiveDetection(
    match: string,
    line: OCRResult['lines'][0],
    lineIndex: number
  ): PIIDetection | null {
    try {
      // Find the position of this sensitive data in the line
      const startIndex = line.text.indexOf(match);
      if (startIndex === -1) {
        return null;
      }
      
      // Calculate bounding box for this specific sensitive data
      const lineWidth = line.bbox.x1 - line.bbox.x0;
      const charWidth = lineWidth / line.text.length;
      
      return {
        type: 'sensitive_data',
        confidence: 0.9,
        boundingBox: {
          x: line.bbox.x0 + (startIndex * charWidth),
          y: line.bbox.y0,
          width: match.length * charWidth,
          height: line.bbox.y1 - line.bbox.y0
        },
        text: match,
        line: lineIndex,
        source: 'specialized' as DetectionSource,
      };
    } catch (error) {
      errorHandler.handleProcessingError('sensitive_detection_creation', error as Error);
      return null;
    }
  }

  /**
   * Detect barcode patterns
   * @param ocrResult - OCR processing result
   * @returns Array of barcode detections
   */
  public detectBarcodes(ocrResult: OCRResult): PIIDetection[] {
    if (!this.config.enableSpecializedDetection) {
      return [];
    }

    try {
      const barcodeDetections: PIIDetection[] = [];
      
      // Process each line for barcode patterns
      ocrResult.lines.forEach((line, lineIndex) => {
        const lineDetections = this.processBarcodeLine(line, lineIndex);
        barcodeDetections.push(...lineDetections);
      });
      
      return barcodeDetections;
    } catch (error) {
      errorHandler.handleProcessingError('barcode_detection', error as Error);
      return [];
    }
  }

  /**
   * Process a line for barcode detection
   * @param line - OCR line data
   * @param lineIndex - Line index
   * @returns Array of barcode detections
   */
  private processBarcodeLine(
    line: OCRResult['lines'][0],
    lineIndex: number
  ): PIIDetection[] {
    const detections: PIIDetection[] = [];
    const lineText = line.text;
    
    // Check for barcode patterns
    PII_PATTERNS.barcode?.forEach((pattern: RegExp) => {
      const matches = lineText.match(pattern);
      
      if (matches) {
        matches.forEach(match => {
          // Skip very short matches that might be false positives
          if (match.length < 6) {
            return;
          }
          
          const detection = this.createBarcodeDetection(match, line, lineIndex);
          if (detection) {
            detections.push(detection);
          }
        });
      }
    });
    
    return detections;
  }

  /**
   * Create barcode detection
   * @param match - Matched barcode
   * @param line - OCR line data
   * @param lineIndex - Line index
   * @returns Barcode detection or null
   */
  private createBarcodeDetection(
    match: string,
    line: OCRResult['lines'][0],
    lineIndex: number
  ): PIIDetection | null {
    try {
      // Find the position of this barcode in the line
      const startIndex = line.text.indexOf(match);
      if (startIndex === -1) {
        return null;
      }
      
      // Calculate bounding box for this specific barcode
      const lineWidth = line.bbox.x1 - line.bbox.x0;
      const charWidth = lineWidth / line.text.length;
      
      return {
        type: 'barcode',
        confidence: 0.85,
        boundingBox: {
          x: line.bbox.x0 + (startIndex * charWidth),
          y: line.bbox.y0,
          width: match.length * charWidth,
          height: line.bbox.y1 - line.bbox.y0
        },
        text: match,
        line: lineIndex,
        source: 'specialized' as DetectionSource,
      };
    } catch (error) {
      errorHandler.handleProcessingError('barcode_detection_creation', error as Error);
      return null;
    }
  }

  /**
   * Detect specialized PII types with enhanced accuracy
   * @param ocrResult - OCR processing result
   * @returns Array of specialized PII detections
   */
  private detectSpecializedPII(ocrResult: OCRResult): PIIDetection[] {
    const detections: PIIDetection[] = [];
    
    try {
      ocrResult.lines.forEach((line, lineIndex) => {
        const lineText = line.text.toLowerCase();
        
        // Enhanced date of birth detection
        if (this.isDateOfBirth(lineText)) {
          const detection = this.createSpecializedDetection(
            line, lineIndex, 'date_of_birth', 0.9
          );
          if (detection) detections.push(detection);
        }
        
        // Enhanced address detection with context
        if (this.isAddress(lineText)) {
          const detection = this.createSpecializedDetection(
            line, lineIndex, 'address', 0.85
          );
          if (detection) detections.push(detection);
        }
        
        // Enhanced name detection with context
        if (this.isName(lineText)) {
          const detection = this.createSpecializedDetection(
            line, lineIndex, 'name', 0.8
          );
          if (detection) detections.push(detection);
        }
      });
      
      return detections;
    } catch (error) {
      errorHandler.handleProcessingError('specialized_pii_detection', error as Error);
      return [];
    }
  }
  
  /**
   * Detect contextual PII based on surrounding text
   * @param ocrResult - OCR processing result
   * @returns Array of contextual PII detections
   */
  private detectContextualPII(ocrResult: OCRResult): PIIDetection[] {
    const detections: PIIDetection[] = [];
    
    try {
      const fullText = ocrResult.text.toLowerCase();
      
      // Check for medical context
      if (this.hasMedicalContext(fullText)) {
        const medicalDetections = this.detectMedicalPII(ocrResult);
        detections.push(...medicalDetections);
      }
      
      // Check for financial context
      if (this.hasFinancialContext(fullText)) {
        const financialDetections = this.detectFinancialPII(ocrResult);
        detections.push(...financialDetections);
      }
      
      // Check for government context
      if (this.hasGovernmentContext(fullText)) {
        const governmentDetections = this.detectGovernmentPII(ocrResult);
        detections.push(...governmentDetections);
      }
      
      return detections;
    } catch (error) {
      errorHandler.handleProcessingError('contextual_pii_detection', error as Error);
      return [];
    }
  }
  
  /**
   * Check if text contains date of birth indicators
   */
  private isDateOfBirth(text: string): boolean {
    const dobPatterns = [
      /\b(?:dob|date of birth|birth date|born)\s*[:=]?\s*\d{1,2}\/\d{1,2}\/\d{2,4}\b/i,
      /\b(?:dob|date of birth|birth date|born)\s*[:=]?\s*\d{1,2}-\d{1,2}-\d{2,4}\b/i,
      /\b(?:dob|date of birth|birth date|born)\s*[:=]?\s*\d{4}-\d{2}-\d{2}\b/i,
    ];
    
    return dobPatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * Check if text contains address indicators
   */
  private isAddress(text: string): boolean {
    const addressPatterns = [
      /\b\d+\s+[a-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct|place|pl|way|terrace|ter)\b/i,
      /\b\d+\s+[a-z\s]+(?:apartment|apt|suite|ste|unit|floor|fl)\s*\d*\b/i,
    ];
    
    return addressPatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * Check if text contains name indicators
   */
  private isName(text: string): boolean {
    const namePatterns = [
      /\b(?:name|full name|legal name)\s*[:=]?\s*[A-Z][a-z]+\s+[A-Z][a-z]+\b/,
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // First Middle Last
    ];
    
    return namePatterns.some(pattern => pattern.test(text));
  }
  
  /**
   * Check if text has medical context
   */
  private hasMedicalContext(text: string): boolean {
    const medicalKeywords = [
      'patient', 'medical', 'health', 'clinic', 'hospital', 'doctor', 'physician',
      'diagnosis', 'treatment', 'medication', 'prescription', 'allergy', 'symptom'
    ];
    
    return medicalKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * Check if text has financial context
   */
  private hasFinancialContext(text: string): boolean {
    const financialKeywords = [
      'account', 'balance', 'transaction', 'deposit', 'withdrawal', 'credit',
      'debit', 'bank', 'financial', 'investment', 'stock', 'bond'
    ];
    
    return financialKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * Check if text has government context
   */
  private hasGovernmentContext(text: string): boolean {
    const governmentKeywords = [
      'government', 'state', 'federal', 'official', 'department', 'agency',
      'license', 'permit', 'certificate', 'registration', 'tax'
    ];
    
    return governmentKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * Detect medical PII
   */
  private detectMedicalPII(ocrResult: OCRResult): PIIDetection[] {
    const detections: PIIDetection[] = [];
    
    ocrResult.lines.forEach((line, lineIndex) => {
      const lineText = line.text.toLowerCase();
      
      if (lineText.includes('patient') || lineText.includes('medical')) {
        const detection = this.createSpecializedDetection(
          line, lineIndex, 'medical_info', 0.85, ocrResult.text
        );
        if (detection) detections.push(detection);
      }
    });
    
    return detections;
  }
  
  /**
   * Detect financial PII
   */
  private detectFinancialPII(ocrResult: OCRResult): PIIDetection[] {
    const detections: PIIDetection[] = [];
    
    ocrResult.lines.forEach((line, lineIndex) => {
      const lineText = line.text.toLowerCase();
      
      if (lineText.includes('account') || lineText.includes('balance')) {
        const detection = this.createSpecializedDetection(
          line, lineIndex, 'financial_data', 0.85, ocrResult.text
        );
        if (detection) detections.push(detection);
      }
    });
    
    return detections;
  }
  
  /**
   * Detect government PII
   */
  private detectGovernmentPII(ocrResult: OCRResult): PIIDetection[] {
    const detections: PIIDetection[] = [];
    
    ocrResult.lines.forEach((line, lineIndex) => {
      const lineText = line.text.toLowerCase();
      
      if (lineText.includes('government') || lineText.includes('official')) {
        const detection = this.createSpecializedDetection(
          line, lineIndex, 'id_card', 0.9, ocrResult.text
        );
        if (detection) detections.push(detection);
      }
    });
    
    return detections;
  }
  
  /**
   * Create specialized detection with enhanced context
   */
  private createSpecializedDetection(
    line: OCRResult['lines'][0],
    lineIndex: number,
    type: string,
    confidence: number
  ): PIIDetection | null {
    try {
      return {
        type: type as any,
        confidence,
        boundingBox: {
          x: line.bbox.x0,
          y: line.bbox.y0,
          width: line.bbox.x1 - line.bbox.x0,
          height: line.bbox.y1 - line.bbox.y0,
        },
        text: line.text,
        line: lineIndex,
        source: 'specialized' as DetectionSource,
      };
    } catch (error) {
      errorHandler.handleProcessingError('specialized_detection_creation', error as Error);
      return null;
    }
  }

  /**
   * Run all specialized detections
   * @param ocrResult - OCR processing result
   * @returns Array of all specialized detections
   */
  public async runAllSpecializedDetections(ocrResult: OCRResult): Promise<PIIDetection[]> {
    const allDetections: PIIDetection[] = [];
    
    // Document regions
    const documentDetections = this.detectDocumentRegions(ocrResult);
    allDetections.push(...documentDetections);
    
    // Numerical data
    const numericalDetections = this.detectNumericalData(ocrResult);
    allDetections.push(...numericalDetections);
    
    // Sensitive data
    const sensitiveDetections = this.detectSensitiveData(ocrResult);
    allDetections.push(...sensitiveDetections);
    
    // Barcodes
    const barcodeDetections = this.detectBarcodes(ocrResult);
    allDetections.push(...barcodeDetections);
    
    // Enhanced specialized PII detection
    const specializedDetections = this.detectSpecializedPII(ocrResult);
    allDetections.push(...specializedDetections);
    
    // Context-aware detection
    const contextDetections = this.detectContextualPII(ocrResult);
    allDetections.push(...contextDetections);
    
    return allDetections;
  }

  /**
   * Get specialized detection statistics
   * @param detections - Array of detections
   * @returns Statistics object
   */
  public getSpecializedStats(detections: PIIDetection[]): Record<string, number> {
    const stats: Record<string, number> = {
      total: detections.length,
      documents: 0,
      numerical_data: 0,
      sensitive_data: 0,
      barcodes: 0,
    };
    
    detections.forEach(detection => {
      if (detection.type && stats.hasOwnProperty(detection.type)) {
        (stats as any)[detection.type]++;
      }
    });
    
    return stats;
  }

  /**
   * Check if specialized detection is available
   * @returns True if specialized detection is enabled
   */
  public isAvailable(): boolean {
    return this.config.enableSpecializedDetection;
  }

  /**
   * Update configuration
   * @param newConfig - New configuration
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Export singleton instance
 */
export const specializedDetector = new SpecializedDetector();

/**
 * Utility functions for backward compatibility
 */
export function detectDocumentRegions(ocrResult: OCRResult): PIIDetection[] {
  return specializedDetector.detectDocumentRegions(ocrResult);
}

export function detectNumericalData(ocrResult: OCRResult): PIIDetection[] {
  return specializedDetector.detectNumericalData(ocrResult);
}

export function detectSensitiveData(ocrResult: OCRResult): PIIDetection[] {
  return specializedDetector.detectSensitiveData(ocrResult);
}

export function detectBarcodes(ocrResult: OCRResult): PIIDetection[] {
  return specializedDetector.detectBarcodes(ocrResult);
}
