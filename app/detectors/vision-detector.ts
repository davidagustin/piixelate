/**
 * Computer Vision PII Detection
 * Handles computer vision integration for PII detection
 */

import { PIIDetection, VisionDetection, OCRResult, DetectionSource } from '../types/pii-types';
import { computerVisionProcessor } from '../utils/computer-vision';
import { getImageDataFromSrc } from '../utils/image-processor';
import { errorHandler } from '../utils/error-handler';
import { detectionConfig } from '../config/detection-config';
import { PII_PATTERNS } from '../utils/pii-patterns';

/**
 * Vision detector class for computer vision-based PII detection
 */
export class VisionDetector {
  private config = detectionConfig.getDetectionConfig();
  private isInitialized = false;

  /**
   * Initialize the vision detector
   */
  public async initialize(): Promise<void> {
    // Skip initialization in Node.js environment
    if (typeof window === 'undefined') {
      this.isInitialized = false;
      return;
    }
    
    if (!this.config.enableComputerVision) {
      return;
    }

    try {
      await computerVisionProcessor.initialize();
      this.isInitialized = true;
    } catch (error) {
      errorHandler.handleInitializationError('vision_detector', error as Error);
      throw error;
    }
  }

  /**
   * Detect PII using computer vision
   * @param imageSource - Image source
   * @returns Array of vision detections
   */
  public async detectPII(imageSource: string): Promise<VisionDetection[]> {
    // Return empty array in Node.js environment
    if (typeof window === 'undefined') {
      return [];
    }
    
    if (!this.config.enableComputerVision || !this.isInitialized) {
      return [];
    }

    try {
      const imageData = await getImageDataFromSrc(imageSource);
      const visionDetections = await computerVisionProcessor.detectPII(imageData);
      
      return visionDetections;
    } catch (error) {
      errorHandler.handleVisionError('vision_detection', error as Error);
      return [];
    }
  }

  /**
   * Convert vision detections to PII detections
   * @param visionDetections - Raw vision detections
   * @param ocrResult - OCR results for text mapping
   * @returns Array of PII detections
   */
  public convertToPIIDetections(
    visionDetections: VisionDetection[],
    ocrResult: OCRResult
  ): PIIDetection[] {
    const piiDetections: PIIDetection[] = [];

    visionDetections.forEach(visionDetection => {
      const correspondingText = this.findTextInRegion(visionDetection.boundingBox, ocrResult);
      
      if (correspondingText) {
        const piiType = this.classifyVisionDetection(visionDetection, correspondingText);
        
        if (piiType) {
          piiDetections.push({
            type: piiType,
            confidence: visionDetection.confidence,
            boundingBox: visionDetection.boundingBox,
            text: correspondingText,
            line: 0, // Will be determined by OCR line mapping
            source: 'vision' as DetectionSource,
          });
        }
      }
    });

    return piiDetections;
  }

  /**
   * Find text in a specific region using OCR results
   * @param boundingBox - Region to search
   * @param ocrResult - OCR results
   * @returns Text found in region or null
   */
  private findTextInRegion(boundingBox: VisionDetection['boundingBox'], ocrResult: OCRResult): string | null {
    for (const line of ocrResult.lines) {
      const lineBox = line.bbox;
      
      // Check if line overlaps with the region
      if (this.boxesOverlap(boundingBox, lineBox)) {
        return line.text;
      }
    }
    return null;
  }

  /**
   * Check if two bounding boxes overlap
   * @param box1 - First bounding box
   * @param box2 - Second bounding box
   * @returns True if boxes overlap
   */
  private boxesOverlap(
    box1: VisionDetection['boundingBox'],
    box2: OCRResult['lines'][0]['bbox']
  ): boolean {
    return (
      box1.x < box2.x1 &&
      box1.x + box1.width > box2.x0 &&
      box1.y < box2.y1 &&
      box1.y + box1.height > box2.y0
    );
  }

  /**
   * Classify vision detection based on type and text content
   * @param visionDetection - Vision detection result
   * @param text - Associated text
   * @returns PII type or null
   */
  private classifyVisionDetection(
    visionDetection: VisionDetection,
    text: string
  ): PIIDetection['type'] | null {
    switch (visionDetection.type) {
      case 'text_region':
        return this.classifyTextRegion(text);
        
      case 'document':
        return this.classifyDocument(text);
        
      case 'face':
        // Faces are PII but we don't have a specific type for them
        // Could be classified as 'name' if we have name detection
        return null;
        
      default:
        return null;
    }
  }

  /**
   * Classify text region based on content
   * @param text - Text content
   * @returns PII type or null
   */
  private classifyTextRegion(text: string): PIIDetection['type'] | null {
    // Use pattern matching to classify the text
    for (const [type, patterns] of Object.entries(PII_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return type as PIIDetection['type'];
        }
      }
    }
    return null;
  }

  /**
   * Classify document based on content
   * @param text - Document text
   * @returns PII type or null
   */
  private classifyDocument(text: string): PIIDetection['type'] | null {
    const lowerText = text.toLowerCase();
    
    // Check for driver's license or ID card indicators
    if (lowerText.includes('driver license') || 
        lowerText.includes('id card') || 
        lowerText.includes('passport') ||
        lowerText.includes('hawaii') ||
        lowerText.includes('honolulu')) {
      return 'drivers_license';
    }
    
    // Document regions might contain addresses or other structured PII
    if (text.match(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd)\b/gi)) {
      return 'address';
    }
    
    return null;
  }

  /**
   * Combine vision and pattern detections
   * @param visionDetections - Vision-based detections
   * @param patternDetections - Pattern-based detections
   * @param ocrResult - OCR results
   * @returns Combined detections
   */
  public combineDetections(
    visionDetections: VisionDetection[],
    patternDetections: PIIDetection[],
    ocrResult: OCRResult
  ): PIIDetection[] {
    const combined: PIIDetection[] = [];
    
    // Add pattern detections
    combined.push(...patternDetections);
    
    // Convert and add vision detections
    const visionPIIDetections = this.convertToPIIDetections(visionDetections, ocrResult);
    combined.push(...visionPIIDetections);
    
    // Remove duplicates
    return this.removeDuplicateDetections(combined);
  }

  /**
   * Remove duplicate detections
   * @param detections - Array of detections
   * @returns Array with duplicates removed
   */
  private removeDuplicateDetections(detections: PIIDetection[]): PIIDetection[] {
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
   * Get vision detection statistics
   * @param visionDetections - Array of vision detections
   * @returns Statistics object
   */
  public getVisionStats(visionDetections: VisionDetection[]): Record<string, number> {
    const stats: Record<string, number> = {
      total: visionDetections.length,
      text_regions: 0,
      documents: 0,
      faces: 0,
    };
    
    visionDetections.forEach(detection => {
      if (detection.type && stats.hasOwnProperty(detection.type)) {
        (stats as any)[detection.type]++;
      }
    });
    
    return stats;
  }

  /**
   * Check if vision detector is available
   * @returns True if vision detection is enabled and initialized
   */
  public isAvailable(): boolean {
    return this.config.enableComputerVision && this.isInitialized;
  }

  /**
   * Get initialization status
   * @returns True if initialized
   */
  public getInitializationStatus(): boolean {
    return this.isInitialized;
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
export const visionDetector = new VisionDetector();

/**
 * Utility function for backward compatibility
 */
export function combineDetections(
  visionDetections: VisionDetection[],
  patternDetections: PIIDetection[],
  ocrResult: OCRResult
): PIIDetection[] {
  return visionDetector.combineDetections(visionDetections, patternDetections, ocrResult);
}
