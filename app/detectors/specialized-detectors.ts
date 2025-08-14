/**
 * Specialized PII Detectors
 * Specialized detection functions for specific PII types
 */

import { PIIDetection, OCRResult, DetectionSource } from '../types/pii-types';
import { PII_PATTERNS } from '../utils/pii-patterns';
import { errorHandler, PIIErrorType } from '../utils/error-handler';
import { detectionConfig } from '../config/detection-config';

/**
 * Specialized detector class for specific PII types
 */
export class SpecializedDetector {
  private config = detectionConfig.getDetectionConfig();

  /**
   * Detect document regions (driver's licenses, IDs, etc.)
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
      
      // Check if this looks like a driver's license or ID card
      const isLicense = this.isLicenseDocument(fullText);
      
      if (isLicense) {
        const detection = this.createDocumentDetection(ocrResult);
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
   * Check if text represents a license document
   * @param text - Text to check
   * @returns True if license document
   */
  private isLicenseDocument(text: string): boolean {
    const licenseIndicators = [
      'driver license',
      'id card',
      'hawaii',
      'honolulu',
      'california',
      'state of',
      'department of motor vehicles',
      'dmv',
    ];
    
    return licenseIndicators.some(indicator => text.includes(indicator));
  }

  /**
   * Create document detection for entire document
   * @param ocrResult - OCR processing result
   * @returns Document detection or null
   */
  private createDocumentDetection(ocrResult: OCRResult): PIIDetection | null {
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
    
    // Add some padding around the document
    const padding = 20;
    
    return {
      type: 'drivers_license',
      confidence: 0.95,
      boundingBox: {
        x: Math.max(0, minX - padding),
        y: Math.max(0, minY - padding),
        width: maxX - minX + (padding * 2),
        height: maxY - minY + (padding * 2)
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
    PII_PATTERNS.numerical_data.forEach(pattern => {
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
    PII_PATTERNS.sensitive_data.forEach((pattern: RegExp) => {
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
    PII_PATTERNS.barcode.forEach((pattern: RegExp) => {
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
      if (stats.hasOwnProperty(detection.type)) {
        stats[detection.type]++;
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
