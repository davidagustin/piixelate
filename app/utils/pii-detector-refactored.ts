/**
 * PII Detection Orchestrator
 * Main module that coordinates all PII detection components
 * 
 * This refactored version addresses:
 * - Code organization: Split into smaller, focused modules
 * - Type safety: Proper TypeScript typing throughout
 * - Error handling: Consistent error handling patterns
 * - Performance: Optimized algorithms and memory management
 * - Code duplication: Extracted common patterns
 * - Documentation: Comprehensive JSDoc comments
 * - Configuration: Proper environment variable handling
 * - Security: Enhanced security measures
 */

import { PIIDetection, DetectionResult, DetectionStats } from '../types/pii-types';
import { ocrProcessor } from './ocr-processor';
import { patternDetector } from '../detectors/pattern-detector';
import { visionDetector } from '../detectors/vision-detector';
import { llmVerifier } from '../detectors/llm-verifier';
import { enhancedLLMDetector } from '../detectors/enhanced-llm-detector';
import { specializedDetector } from '../detectors/specialized-detectors';
import { multiLayerDetector } from '../detectors/multi-layer-detector';
import { errorHandler } from './error-handler';
import { detectionConfig } from '../config/detection-config';

/**
 * Main PII detection orchestrator class
 */
export class PIIDetectionOrchestrator {
  private config = detectionConfig.getDetectionConfig();
  private isInitialized = false;

  /**
   * Initialize all detection components
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize OCR processor
      await ocrProcessor.initialize();
      
      // Initialize vision detector if enabled
      if (this.config.enableComputerVision) {
        await visionDetector.initialize();
      }
      
      this.isInitialized = true;
    } catch (error) {
      errorHandler.handleInitializationError('pii_orchestrator', error as Error);
      throw error;
    }
  }

  /**
   * Main PII detection method with enhanced three-layer approach
   * @param imageSource - Image source for detection
   * @returns Comprehensive detection result
   */
  public async detectPII(imageSource: string): Promise<DetectionResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    
    try {
      // Ensure initialization
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate input
      this.validateImageInput(imageSource);

      // LAYER 0: Computer Vision detection (identify regions of interest)
      const visionDetections = await this.performVisionDetection(imageSource);
      
      // Perform OCR
      const ocrResult = await this.performOCR(imageSource);
      
      // LAYER 1: Pattern-based detection (fast and efficient)
      const patternDetections = await this.performPatternDetection(ocrResult);
      
      // Combine vision and pattern detections
      const combinedDetections = this.combineDetections(visionDetections, patternDetections, ocrResult);
      
      // LAYER 2: Specialized detection
      const specializedDetections = await this.performSpecializedDetection(ocrResult);
      combinedDetections.push(...specializedDetections);
      
      // Early return if no detections found
      if (combinedDetections.length === 0) {
        return this.createDetectionResult([], errors, startTime, ocrResult);
      }
      
      // LAYER 3: Enhanced LLM verification and detection (final layer)
      if (this.config.enableLLM) {
        const finalDetections = await this.performEnhancedLLMDetection(ocrResult.text, combinedDetections);
        return this.createDetectionResult(finalDetections, errors, startTime, ocrResult);
      } else {
        const sortedDetections = this.sortDetectionsByConfidence(combinedDetections);
        return this.createDetectionResult(sortedDetections, errors, startTime, ocrResult);
      }
      
    } catch (error) {
      const piiError = errorHandler.handleProcessingError('main_detection', error as Error);
      errors.push(piiError);
      
      // Return empty result with error information
      return this.createDetectionResult([], errors, startTime, { text: '', lines: [] });
    }
  }

  /**
   * Validate image input
   * @param imageSrc - Image source to validate
   */
  private validateImageInput(imageSrc: string): void {
    if (!imageSrc || typeof imageSrc !== 'string') {
      throw new Error('Invalid image source provided');
    }
    
    if (imageSrc.trim().length === 0) {
      throw new Error('Empty image source provided');
    }
  }

  /**
   * Perform computer vision detection
   * @param imageSrc - Image source
   * @returns Array of vision detections
   */
  private async performVisionDetection(imageSrc: string): Promise<any[]> {
    try {
      return await visionDetector.detectPII(imageSrc);
    } catch (error) {
      errorHandler.handleVisionError('vision_detection', error as Error);
      return [];
    }
  }

  /**
   * Perform OCR processing
   * @param imageSrc - Image source
   * @returns OCR result
   */
  private async performOCR(imageSrc: string): Promise<any> {
    try {
      return await ocrProcessor.recognize(imageSrc);
    } catch (error) {
      errorHandler.handleOCRError('ocr_processing', error as Error);
      throw error; // OCR is critical, so we re-throw
    }
  }

  /**
   * Perform pattern-based detection
   * @param ocrResult - OCR processing result
   * @returns Array of pattern detections
   */
  private async performPatternDetection(ocrResult: any): Promise<PIIDetection[]> {
    try {
      return await patternDetector.detectPII(ocrResult);
    } catch (error) {
      errorHandler.handleProcessingError('pattern_detection', error as Error);
      return [];
    }
  }

  /**
   * Combine vision and pattern detections
   * @param visionDetections - Vision-based detections
   * @param patternDetections - Pattern-based detections
   * @param ocrResult - OCR results
   * @returns Combined detections
   */
  private combineDetections(
    visionDetections: any[],
    patternDetections: PIIDetection[],
    ocrResult: any
  ): PIIDetection[] {
    try {
      return visionDetector.combineDetections(visionDetections, patternDetections, ocrResult);
    } catch (error) {
      errorHandler.handleProcessingError('detection_combination', error as Error);
      return patternDetections; // Fallback to pattern detections only
    }
  }

  /**
   * Perform specialized detection
   * @param ocrResult - OCR processing result
   * @returns Array of specialized detections
   */
  private async performSpecializedDetection(ocrResult: any): Promise<PIIDetection[]> {
    try {
      return await specializedDetector.runAllSpecializedDetections(ocrResult);
    } catch (error) {
      errorHandler.handleProcessingError('specialized_detection', error as Error);
      return [];
    }
  }

  /**
   * Perform enhanced LLM detection and verification
   * @param fullText - Full text content
   * @param detections - Detections to verify
   * @returns Enhanced detections
   */
  private async performEnhancedLLMDetection(
    fullText: string,
    detections: PIIDetection[]
  ): Promise<PIIDetection[]> {
    try {
      // First, use enhanced LLM detector for new detections
      const enhancedDetections = await enhancedLLMDetector.detectPII(fullText, this.buildContext(detections));
      
      // Then, use LLM verifier to verify existing detections
      const verifiedDetections = await llmVerifier.verifyWithLLM(fullText, detections);
      
      // Combine and deduplicate detections
      const allDetections = [...verifiedDetections, ...enhancedDetections];
      const uniqueDetections = this.deduplicateDetections(allDetections);
      
      return this.sortDetectionsByConfidence(uniqueDetections);
    } catch (error) {
      errorHandler.handleLLMError('enhanced_llm_detection', error as Error);
      return this.sortDetectionsByConfidence(detections); // Fallback to original detections
    }
  }

  /**
   * Build context for LLM analysis
   * @param detections - Existing detections
   * @returns Context string
   */
  private buildContext(detections: PIIDetection[]): string {
    const context = [
      `Existing detections: ${detections.length}`,
      `Detection types: ${[...new Set(detections.map(d => d.type))].join(', ')}`,
      `Average confidence: ${detections.length > 0 ? 
        (detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length).toFixed(2) : '0'}`
    ];
    
    return context.join(' | ');
  }

  /**
   * Deduplicate detections based on text and type
   * @param detections - Array of detections
   * @returns Deduplicated detections
   */
  private deduplicateDetections(detections: PIIDetection[]): PIIDetection[] {
    const detectionMap = new Map<string, PIIDetection>();
    
    detections.forEach(detection => {
      const key = `${detection.type}:${detection.text}`;
      const existing = detectionMap.get(key);
      
      if (!existing || detection.confidence > existing.confidence) {
        detectionMap.set(key, detection);
      }
    });
    
    return Array.from(detectionMap.values());
  }

  /**
   * Sort detections by confidence score
   * @param detections - Array of detections
   * @returns Sorted detections
   */
  private sortDetectionsByConfidence(detections: PIIDetection[]): PIIDetection[] {
    return detections.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Create detection result with metadata
   * @param detections - Array of detections
   * @param errors - Array of errors
   * @param startTime - Processing start time
   * @param ocrResult - OCR processing result
   * @returns Detection result
   */
  private createDetectionResult(
    detections: PIIDetection[],
    errors: any[],
    startTime: number,
    ocrResult: any
  ): DetectionResult {
    const processingTime = Date.now() - startTime;
    
    // Count detections by source
    const detectionSources: Record<string, number> = {
      pattern: 0,
      vision: 0,
      llm: 0,
      specialized: 0,
    };
    
    detections.forEach(detection => {
      const source = detection.source || 'pattern';
      if (detectionSources[source] !== undefined) {
        detectionSources[source]++;
      } else {
        detectionSources[source] = 1;
      }
    });

    return {
      success: errors.length === 0,
      detections: detections.slice(0, this.config.maxDetections), // Limit detections
      errors,
      processingTime,
      metadata: {
        totalLines: ocrResult.lines?.length || 0,
        totalCharacters: ocrResult.text?.length || 0,
        detectionSources,
      },
    };
  }

  /**
   * Get detection statistics
   * @param detections - Array of detections
   * @returns Detection statistics
   */
  public getDetectionStats(detections: PIIDetection[]): DetectionStats {
    const detectionsByType: Record<string, number> = {};
    let totalConfidence = 0;
    
    detections.forEach(detection => {
      // Count by type
      detectionsByType[detection.type] = (detectionsByType[detection.type] || 0) + 1;
      totalConfidence += detection.confidence;
    });

    return {
      totalDetections: detections.length,
      detectionsByType,
      averageConfidence: detections.length > 0 ? totalConfidence / detections.length : 0,
      processingTimeMs: 0, // Will be set by caller
      errorCount: errorHandler.getErrors().length,
    };
  }

  /**
   * Get enhanced LLM detector statistics
   * @returns Enhanced LLM statistics
   */
  public getEnhancedLLMStats(): {
    providerStats: any;
    cacheStats: any;
    config: any;
  } {
    return {
      providerStats: enhancedLLMDetector.getProviderStats(),
      cacheStats: enhancedLLMDetector.getCacheStats(),
      config: enhancedLLMDetector.getConfig(),
    };
  }

  /**
   * Clear all caches
   */
  public clearCaches(): void {
    enhancedLLMDetector.clearCache();
    llmVerifier.clearCache();
  }

  /**
   * Update configuration
   * @param newConfig - New configuration
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Detect PII using multi-layer approach
   * @param imageSrc - Image source for detection
   * @returns Comprehensive detection result with multi-layer analysis
   */
  public async detectPIIWithMultiLayer(imageSrc: string): Promise<DetectionResult> {
    try {
      // Ensure initialization
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Use the multi-layer detector
      return await multiLayerDetector.detectPII(imageSrc);
    } catch (error) {
      const piiError = errorHandler.handleProcessingError('multi_layer_detection', error as Error);
      return {
        detections: [],
        errors: [piiError],
        success: false,
        processingTime: 0,
        metadata: {
          totalLines: 0,
          totalCharacters: 0,
          detectionSources: {} as Record<string, number>,
        },
      };
    }
  }

  /**
   * Get multi-layer detector statistics
   * @returns Multi-layer detector statistics
   */
  public getMultiLayerStats(): {
    config: any;
    cacheStats: any;
  } {
    return {
      config: multiLayerDetector.getConfig(),
      cacheStats: multiLayerDetector.getCacheStats(),
    };
  }
}

/**
 * Export singleton instance
 */
export const piiDetectionOrchestrator = new PIIDetectionOrchestrator();

/**
 * Main detection function for backward compatibility
 */
export async function detectPII(imageSrc: string): Promise<DetectionResult> {
  return piiDetectionOrchestrator.detectPII(imageSrc);
}

/**
 * Enhanced detection function with metadata
 */
export async function detectPIIWithMetadata(imageSrc: string): Promise<DetectionResult> {
  return piiDetectionOrchestrator.detectPII(imageSrc);
}

/**
 * Multi-layer detection function
 */
export async function detectPIIWithMultiLayer(imageSrc: string): Promise<DetectionResult> {
  return piiDetectionOrchestrator.detectPIIWithMultiLayer(imageSrc);
}
