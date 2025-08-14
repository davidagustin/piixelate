/**
 * Pattern-based PII Detection
 * Efficient pattern matching using regex for PII detection
 */

import { PIIDetection, PIIType, OCRResult, PatternMatch, DetectionSource } from '../types/pii-types';
import { PII_PATTERNS, getConfidenceScore } from '../utils/pii-patterns';
import { errorHandler, PIIErrorType } from '../utils/error-handler';
import { detectionConfig } from '../config/detection-config';

/**
 * Pattern detector class for efficient PII pattern matching
 */
export class PatternDetector {
  private patterns: Record<PIIType, RegExp[]>;
  private config = detectionConfig.getDetectionConfig();

  constructor() {
    this.patterns = PII_PATTERNS as Record<PIIType, RegExp[]>;
  }

  /**
   * Detect PII using pattern matching on OCR results
   * @param ocrResult - OCR processing result
   * @returns Array of PII detections
   */
  public async detectPII(ocrResult: OCRResult): Promise<PIIDetection[]> {
    try {
      // Limit logging to prevent console flooding
      if (this.config.debugMode) {
        console.log('Pattern detector - Lines:', ocrResult.lines.length);
      }
      
      const detections: PIIDetection[] = [];
      let totalDetections = 0;
      const maxDetections = this.config.maxDetections || 100;
      
      // Process each line for PII detection
      for (let lineIndex = 0; lineIndex < ocrResult.lines.length; lineIndex++) {
        const line = ocrResult.lines[lineIndex];
        
        // Stop if we've reached the maximum number of detections
        if (totalDetections >= maxDetections) {
          break;
        }
        
        const lineDetections = this.processLine(line, lineIndex, ocrResult.text);
        detections.push(...lineDetections);
        totalDetections += lineDetections.length;
      }

      // Remove duplicates and filter by confidence threshold
      const uniqueDetections = this.removeDuplicates(detections);
      const filteredDetections = this.filterByConfidence(uniqueDetections);

      if (this.config.debugMode) {
        console.log('Final pattern detections:', filteredDetections.length);
      }
      return filteredDetections;
    } catch (error) {
      console.error('Pattern detection error:', error);
      errorHandler.handleProcessingError('pattern_detection', error as Error);
      return [];
    }
  }

  /**
   * Process a single line for PII detection
   * @param line - OCR line data
   * @param lineIndex - Index of the line
   * @param fullText - Full text for context
   * @returns Array of PII detections for this line
   */
  private processLine(
    line: OCRResult['lines'][0], 
    lineIndex: number, 
    fullText: string
  ): PIIDetection[] {
    const detections: PIIDetection[] = [];
    const lineText = line.text;

    // Check each PII type
    Object.entries(this.patterns).forEach(([type, patterns]) => {
      const piiType = type as PIIType;
      
      patterns.forEach(pattern => {
        const matches = this.findMatches(lineText, pattern, piiType);
        
        matches.forEach(match => {
          const detection = this.createDetection(
            match,
            piiType,
            line,
            lineIndex,
            fullText
          );
          
          if (detection) {
            detections.push(detection);
            
            // For credit cards, also create a document-level detection
            if (piiType === 'credit_card') {
              const documentDetection = this.createDocumentLevelDetection(line, fullText);
              if (documentDetection) {
                detections.push(documentDetection);
              }
            }
          }
        });
      });
    });

    return detections;
  }

  /**
   * Create document-level detection for credit cards
   * @param line - OCR line data
   * @param fullText - Full text for context
   * @returns Document-level detection or null
   */
  private createDocumentLevelDetection(
    line: OCRResult['lines'][0], 
    fullText: string
  ): PIIDetection | null {
    try {
      // Create a larger bounding box around the credit card
      const bbox = line.bbox;
      const padding = 80; // Large padding for complete card coverage
      
      return {
        type: 'credit_card',
        confidence: 0.95,
        boundingBox: {
          x: Math.max(0, bbox.x0 - padding),
          y: Math.max(0, bbox.y0 - padding),
          width: bbox.x1 - bbox.x0 + (padding * 2),
          height: bbox.y1 - bbox.y0 + (padding * 2)
        },
        text: 'CREDIT CARD DOCUMENT',
        line: 0,
        source: 'pattern'
      };
    } catch (error) {
      console.error('Error creating document-level detection:', error);
      return null;
    }
  }

  /**
   * Find all matches of a pattern in text
   * @param text - Text to search
   * @param pattern - Regex pattern
   * @param type - PII type for this pattern
   * @returns Array of pattern matches
   */
  private findMatches(text: string, pattern: RegExp, type: PIIType): PatternMatch[] {
    const matches: PatternMatch[] = [];
    let match;
    let matchCount = 0;
    const maxMatches = 10; // Limit matches per pattern to prevent excessive processing

    // Reset regex state
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null && matchCount < maxMatches) {
      matches.push({
        type,
        text: match[0],
        confidence: 0.7,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        pattern
      });
      matchCount++;
    }

    return matches;
  }

  /**
   * Create a PII detection from a pattern match
   * @param match - Pattern match result
   * @param type - PII type
   * @param line - OCR line data
   * @param lineIndex - Line index
   * @param context - Full text context
   * @returns PII detection or null if invalid
   */
  private createDetection(
    match: PatternMatch,
    type: PIIType,
    line: OCRResult['lines'][0],
    lineIndex: number,
    context: string
  ): PIIDetection | null {
    try {
      const confidence = getConfidenceScore(type, match.text, context);
      
      // Skip if confidence is below threshold
      if (confidence < this.config.confidenceThreshold) {
        return null;
      }

      const boundingBox = this.calculateBoundingBox(
        match,
        line,
        lineIndex
      );

      return {
        type,
        confidence,
        boundingBox,
        text: match.text,
        line: lineIndex,
        source: 'pattern' as DetectionSource
      };
    } catch (error) {
      errorHandler.handleProcessingError('detection_creation', error as Error);
      return null;
    }
  }

  /**
   * Calculate bounding box for a detection
   * @param match - Pattern match
   * @param line - OCR line data
   * @param lineIndex - Line index
   * @returns Bounding box coordinates
   */
  private calculateBoundingBox(
    match: PatternMatch,
    line: OCRResult['lines'][0],
    lineIndex: number
  ): PIIDetection['boundingBox'] {
    const lineWidth = line.bbox.x1 - line.bbox.x0;
    const charWidth = lineWidth / line.text.length;
    
    return {
      x: line.bbox.x0 + (match.startIndex * charWidth),
      y: line.bbox.y0,
      width: match.text.length * charWidth,
      height: line.bbox.y1 - line.bbox.y0,
    };
  }

  /**
   * Remove duplicate detections
   * @param detections - Array of detections
   * @returns Array with duplicates removed
   */
  private removeDuplicates(detections: PIIDetection[]): PIIDetection[] {
    const seen = new Set<string>();
    
    return detections.filter(detection => {
      const key = `${detection.text}-${detection.type}-${detection.line}`;
      
      if (seen.has(key)) {
        return false;
      }
      
      seen.add(key);
      return true;
    });
  }

  /**
   * Filter detections by confidence threshold
   * @param detections - Array of detections
   * @returns Filtered array
   */
  private filterByConfidence(detections: PIIDetection[]): PIIDetection[] {
    return detections.filter(
      detection => detection.confidence >= this.config.confidenceThreshold
    );
  }

  /**
   * Get detection statistics
   * @param detections - Array of detections
   * @returns Statistics object
   */
  public getDetectionStats(detections: PIIDetection[]): Record<PIIType, number> {
    const stats: Record<PIIType, number> = {} as Record<PIIType, number>;
    
    // Initialize all types with 0
    Object.keys(this.patterns).forEach(type => {
      stats[type as PIIType] = 0;
    });
    
    // Count detections by type
    detections.forEach(detection => {
      stats[detection.type]++;
    });
    
    return stats;
  }

  /**
   * Validate a specific PII type against patterns
   * @param text - Text to validate
   * @param type - PII type to check
   * @returns True if text matches the PII type
   */
  public validatePIIType(text: string, type: PIIType): boolean {
    const patterns = this.patterns[type];
    if (!patterns) {
      return false;
    }
    
    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Get all supported PII types
   * @returns Array of supported PII types
   */
  public getSupportedTypes(): PIIType[] {
    return Object.keys(this.patterns) as PIIType[];
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
export const patternDetector = new PatternDetector();

/**
 * Utility function for backward compatibility
 */
export async function performPatternDetection(ocrResult: OCRResult): Promise<PIIDetection[]> {
  return patternDetector.detectPII(ocrResult);
}
