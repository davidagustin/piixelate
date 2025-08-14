/**
 * Multi-Layer PII Detection System
 * Implements multiple layers of different algorithms and LLMs for comprehensive PII detection
 * 
 * Layer Architecture:
 * Layer 0: Computer Vision (identify regions of interest)
 * Layer 1: Pattern Matching (fast regex-based detection)
 * Layer 2: Specialized Detectors (domain-specific detection)
 * Layer 3: Enhanced LLM Detection (multiple LLM providers)
 * Layer 4: LLM Verification (cross-validation)
 * Layer 5: Ensemble Analysis (combine all results)
 * Layer 6: PII Obscuring (redaction and anonymization)
 */

import { PIIDetection, DetectionResult, OCRResult, DetectionSource } from '../types/pii-types';
import { EnhancedLLMDetector } from './enhanced-llm-detector';
import { PatternDetector } from './pattern-detector';
import { VisionDetector } from './vision-detector';
import { SpecializedDetector } from './specialized-detectors';
import { LLMVerifier } from './llm-verifier';
import { errorHandler } from '../utils/error-handler';
import { detectionConfig } from '../config/detection-config';
import { ocrProcessor } from '../utils/ocr-processor';
import { piiObscurer } from '../utils/pii-obscurer';

/**
 * Layer configuration interface
 */
interface LayerConfig {
  enabled: boolean;
  priority: number;
  timeout: number;
  confidenceThreshold: number;
  maxRetries: number;
}

/**
 * Multi-layer detection configuration
 */
interface MultiLayerConfig {
  layers: {
    vision: LayerConfig;
    pattern: LayerConfig;
    specialized: LayerConfig;
    enhancedLLM: LayerConfig;
    verification: LayerConfig;
    ensemble: LayerConfig;
    obscuring: LayerConfig;
  };
  enableParallelProcessing: boolean;
  enableCrossValidation: boolean;
  enableConfidenceBoost: boolean;
  enableFallback: boolean;
  maxTotalDetections: number;
  processingTimeout: number;
}

/**
 * Layer result interface
 */
interface LayerResult {
  layer: string;
  detections: PIIDetection[];
  processingTime: number;
  success: boolean;
  error?: string;
  confidence: number;
  provider?: string;
}

/**
 * Ensemble analysis result
 */
interface EnsembleResult {
  finalDetections: PIIDetection[];
  layerContributions: Record<string, number>;
  confidenceBoost: number;
  crossValidationScore: number;
}

/**
 * Multi-Layer PII Detector class
 */
export class MultiLayerDetector {
  private config: MultiLayerConfig;
  private enhancedLLMDetector: EnhancedLLMDetector;
  private patternDetector: PatternDetector;
  private visionDetector: VisionDetector;
  private specializedDetector: SpecializedDetector;
  private llmVerifier: LLMVerifier;
  private isInitialized = false;
  private detectionCache = new Map<string, DetectionResult>();

  constructor() {
    this.config = this.initializeConfig();
    this.enhancedLLMDetector = new EnhancedLLMDetector();
    this.patternDetector = new PatternDetector();
    this.visionDetector = new VisionDetector();
    this.specializedDetector = new SpecializedDetector();
    this.llmVerifier = new LLMVerifier();
    
    // Disable vision processing in Node.js environment
    if (typeof window === 'undefined') {
      this.config.layers.vision.enabled = false;
    }
  }

  /**
   * Initialize configuration
   */
  private initializeConfig(): MultiLayerConfig {
    const baseConfig = detectionConfig.getConfig();
    
    return {
      layers: {
        vision: {
          enabled: baseConfig.enableComputerVision,
          priority: 0,
          timeout: 10000,
          confidenceThreshold: 0.5,
          maxRetries: 2,
        },
        pattern: {
          enabled: baseConfig.enablePatternMatching,
          priority: 1,
          timeout: 5000,
          confidenceThreshold: 0.6,
          maxRetries: 1,
        },
        specialized: {
          enabled: baseConfig.enableSpecializedDetection,
          priority: 2,
          timeout: 8000,
          confidenceThreshold: 0.7,
          maxRetries: 2,
        },
        enhancedLLM: {
          enabled: baseConfig.enableLLM,
          priority: 3,
          timeout: 15000,
          confidenceThreshold: 0.6,
          maxRetries: 3,
        },
        verification: {
          enabled: baseConfig.enableLLM,
          priority: 4,
          timeout: 12000,
          confidenceThreshold: 0.8,
          maxRetries: 2,
        },
        ensemble: {
          enabled: true,
          priority: 5,
          timeout: 5000,
          confidenceThreshold: 0.7,
          maxRetries: 1,
        },
        obscuring: {
          enabled: true,
          priority: 6,
          timeout: 3000,
          confidenceThreshold: 0.9,
          maxRetries: 1,
        },
      },
      enableParallelProcessing: true,
      enableCrossValidation: true,
      enableConfidenceBoost: true,
      enableFallback: true,
      maxTotalDetections: baseConfig.maxDetections || 100,
      processingTimeout: 60000,
    };
  }

  /**
   * Initialize all detection components
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize vision detector
      if (this.config.layers.vision.enabled) {
        await this.visionDetector.initialize();
      }

      // Initialize enhanced LLM detector
      if (this.config.layers.enhancedLLM.enabled) {
        this.enhancedLLMDetector.updateConfig({
          enableMultiProvider: true,
          enableFallback: true,
          enableEnsemble: true,
          confidenceThreshold: this.config.layers.enhancedLLM.confidenceThreshold,
          maxRetries: this.config.layers.enhancedLLM.maxRetries,
          timeout: this.config.layers.enhancedLLM.timeout,
        });
      }

      this.isInitialized = true;
    } catch (error) {
      errorHandler.handleInitializationError('multi_layer_detector', error as Error);
      throw error;
    }
  }

  /**
   * Main PII detection method with multi-layer approach
   * @param imageSrc - Image source for detection
   * @returns Comprehensive detection result
   */
  public async detectPII(imageSrc: string): Promise<DetectionResult> {
    const startTime = Date.now();
    const errors: any[] = [];
    const layerResults: LayerResult[] = [];

    try {
      // Ensure initialization
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Check cache
      const cacheKey = this.generateCacheKey(imageSrc);
      const cachedResult = this.detectionCache.get(cacheKey);
      if (cachedResult && Date.now() - startTime < 300000) { // 5 minute cache
        return cachedResult;
      }

      // LAYER 0: Computer Vision Detection
      if (this.config.layers.vision.enabled) {
        const visionResult = await this.executeLayer('vision', () => 
          this.performVisionDetection(imageSrc)
        );
        layerResults.push(visionResult);
      }

      // Perform OCR (required for most layers)
      const ocrResult = await this.performOCR(imageSrc);

      // LAYER 1: Pattern Matching
      if (this.config.layers.pattern.enabled) {
        const patternResult = await this.executeLayer('pattern', () =>
          this.performPatternDetection(ocrResult)
        );
        layerResults.push(patternResult);
      }

      // LAYER 2: Specialized Detection
      if (this.config.layers.specialized.enabled) {
        const specializedResult = await this.executeLayer('specialized', () =>
          this.performSpecializedDetection(ocrResult)
        );
        layerResults.push(specializedResult);
      }

      // LAYER 3: Enhanced LLM Detection
      if (this.config.layers.enhancedLLM.enabled) {
        const llmResult = await this.executeLayer('enhancedLLM', () =>
          this.performEnhancedLLMDetection(ocrResult.text)
        );
        layerResults.push(llmResult);
      }

      // Combine all detections from previous layers
      const combinedDetections = this.combineLayerDetections(layerResults);

      // LAYER 4: LLM Verification
      if (this.config.layers.verification.enabled && combinedDetections.length > 0) {
        const verificationResult = await this.executeLayer('verification', () =>
          this.performLLMVerification(ocrResult.text, combinedDetections)
        );
        layerResults.push(verificationResult);
      }

      // LAYER 5: Ensemble Analysis
      const ensembleResult = await this.performEnsembleAnalysis(layerResults, combinedDetections);

      // LAYER 6: PII Obscuring
      const obscuringResult = await this.performPIIObscuring(ensembleResult.finalDetections);

      // Create final result
      const finalResult = this.createDetectionResult(
        obscuringResult.detections,
        errors,
        startTime,
        ocrResult
      );

      // Cache the result
      this.detectionCache.set(cacheKey, finalResult);

      return finalResult;

    } catch (error) {
      const piiError = errorHandler.handleProcessingError('multi_layer_detection', error as Error);
      errors.push(piiError);
      
      return this.createDetectionResult([], errors, startTime, { text: '', lines: [] });
    }
  }

  /**
   * Execute a detection layer with timeout and retry logic
   * @param layerName - Name of the layer
   * @param layerFunction - Function to execute
   * @returns Layer result
   */
  private async executeLayer(
    layerName: keyof MultiLayerConfig['layers'],
    layerFunction: () => Promise<PIIDetection[]>
  ): Promise<LayerResult> {
    const layerConfig = this.config.layers[layerName];
    const startTime = Date.now();

    try {
      const detections = await this.withTimeout(
        layerFunction(),
        layerConfig.timeout
      );

      return {
        layer: layerName,
        detections,
        processingTime: Date.now() - startTime,
        success: true,
        confidence: detections.length === 0 ? 0 : detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length,
      };
    } catch (error) {
      return {
        layer: layerName,
        detections: [],
        processingTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
      };
    }
  }

  /**
   * Perform computer vision detection
   * @param imageSrc - Image source
   * @returns Vision detections
   */
  private async performVisionDetection(imageSrc: string): Promise<PIIDetection[]> {
    const visionDetections = await this.visionDetector.detectPII(imageSrc);
    return this.visionDetector.convertToPIIDetections(visionDetections, { text: '', lines: [] });
  }

  /**
   * Perform OCR processing
   * @param imageSrc - Image source
   * @returns OCR result
   */
  private async performOCR(imageSrc: string): Promise<OCRResult> {
    try {
      return await ocrProcessor.recognize(imageSrc);
    } catch (error) {
      errorHandler.handleProcessingError('ocr_processing', error as Error);
      // Return empty OCR result on error
      return {
        text: '',
        lines: [],
      };
    }
  }

  /**
   * Perform pattern-based detection
   * @param ocrResult - OCR result
   * @returns Pattern detections
   */
  private async performPatternDetection(ocrResult: OCRResult): Promise<PIIDetection[]> {
    return await this.patternDetector.detectPII(ocrResult);
  }

  /**
   * Perform specialized detection
   * @param ocrResult - OCR result
   * @returns Specialized detections
   */
  private async performSpecializedDetection(ocrResult: OCRResult): Promise<PIIDetection[]> {
    return this.specializedDetector.detectDocumentRegions(ocrResult);
  }

  /**
   * Perform enhanced LLM detection
   * @param text - Text to analyze
   * @returns LLM detections
   */
  private async performEnhancedLLMDetection(text: string): Promise<PIIDetection[]> {
    return await this.enhancedLLMDetector.detectPII(text);
  }

  /**
   * Perform LLM verification
   * @param text - Text to analyze
   * @param detections - Detections to verify
   * @returns Verified detections
   */
  private async performLLMVerification(text: string, detections: PIIDetection[]): Promise<PIIDetection[]> {
    return await this.llmVerifier.verifyWithLLM(text, detections);
  }

  /**
   * Perform ensemble analysis
   * @param layerResults - Results from all layers
   * @param combinedDetections - Combined detections
   * @returns Ensemble result
   */
  private async performEnsembleAnalysis(
    layerResults: LayerResult[],
    combinedDetections: PIIDetection[]
  ): Promise<EnsembleResult> {
    const detectionMap = new Map<string, PIIDetection[]>();
    
    // Group detections by text and type
    combinedDetections.forEach(detection => {
      const key = `${detection.type}:${detection.text}`;
      if (!detectionMap.has(key)) {
        detectionMap.set(key, []);
      }
      detectionMap.get(key)!.push(detection);
    });

    // Calculate layer contributions
    const layerContributions: Record<string, number> = {};
    layerResults.forEach(result => {
      layerContributions[result.layer] = result.detections.length;
    });

    // Ensemble detections
    const finalDetections: PIIDetection[] = [];
    let totalConfidence = 0;
    let crossValidationCount = 0;

    detectionMap.forEach((detections) => {
      if (detections.length >= 2) { // Require at least 2 layers to agree
        const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
        const bestDetection = detections.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        
        // Apply confidence boost for ensemble agreement
        const confidenceBoost = this.config.enableConfidenceBoost ? 
          Math.min(avgConfidence * 1.2, 1.0) : avgConfidence;
        
        finalDetections.push({
          ...bestDetection,
          confidence: confidenceBoost,
          verified: true,
        });

        totalConfidence += confidenceBoost;
        crossValidationCount++;
      }
    });

    const crossValidationScore = crossValidationCount > 0 ? 
      totalConfidence / crossValidationCount : 0;

    return {
      finalDetections,
      layerContributions,
      confidenceBoost: this.config.enableConfidenceBoost ? 1.2 : 1.0,
      crossValidationScore,
    };
  }

  /**
   * Perform PII obscuring
   * @param detections - Detections to obscure
   * @returns Obscured detections
   */
  private async performPIIObscuring(detections: PIIDetection[]): Promise<LayerResult> {
    const obscuredDetections = detections.map(detection => {
      const obscuringResult = piiObscurer.obscurePII(detection, 'masking');
      return {
        ...detection,
        text: obscuringResult.obscuredText,
        obscured: true,
        obscuringTechnique: obscuringResult.technique,
      };
    });

    return {
      layer: 'obscuring',
      detections: obscuredDetections,
      processingTime: 0,
      success: true,
      confidence: obscuredDetections.length === 0 ? 0 : obscuredDetections.reduce((sum, d) => sum + d.confidence, 0) / obscuredDetections.length,
    };
  }

  /**
   * Combine detections from multiple layers
   * @param layerResults - Results from all layers
   * @returns Combined detections
   */
  private combineLayerDetections(layerResults: LayerResult[]): PIIDetection[] {
    const allDetections: PIIDetection[] = [];
    
    layerResults.forEach(result => {
      if (result.success) {
        allDetections.push(...result.detections);
      }
    });

    // Remove duplicates and sort by confidence
    return this.removeDuplicates(allDetections)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxTotalDetections);
  }

  /**
   * Remove duplicate detections
   * @param detections - Array of detections
   * @returns Unique detections
   */
  private removeDuplicates(detections: PIIDetection[]): PIIDetection[] {
    const seen = new Set<string>();
    return detections.filter(detection => {
      const key = `${detection.type}:${detection.text}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }



  /**
   * Execute function with timeout
   * @param promise - Promise to execute
   * @param timeout - Timeout in milliseconds
   * @returns Promise result
   */
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      ),
    ]);
  }

  /**
   * Generate cache key
   * @param imageSrc - Image source
   * @returns Cache key
   */
  private generateCacheKey(imageSrc: string): string {
    // Simple hash for caching
    let hash = 0;
    for (let i = 0; i < imageSrc.length; i++) {
      const char = imageSrc.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }



  /**
   * Get detection sources
   * @param detections - Detections to analyze
   * @returns Record of detection counts by source
   */
  private getDetectionSources(detections: PIIDetection[]): Record<DetectionSource, number> {
    const sources: Record<DetectionSource, number> = {} as Record<DetectionSource, number>;
    detections.forEach(detection => {
      if (detection.source) {
        sources[detection.source] = (sources[detection.source] || 0) + 1;
      }
    });
    return sources;
  }

  /**
   * Create detection result
   * @param detections - Final detections
   * @param errors - Processing errors
   * @param startTime - Start time
   * @param ocrResult - OCR result
   * @returns Detection result
   */
  private createDetectionResult(
    detections: PIIDetection[],
    errors: any[],
    startTime: number,
    ocrResult: OCRResult
  ): DetectionResult {
    const processingTime = Date.now() - startTime;

    return {
      success: errors.length === 0,
      detections,
      errors,
      processingTime,
      metadata: {
        totalLines: ocrResult.lines.length,
        totalCharacters: ocrResult.text.length,
        detectionSources: this.getDetectionSources(detections),
      },
    };
  }

  /**
   * Update configuration
   * @param newConfig - New configuration
   */
  public updateConfig(newConfig: Partial<MultiLayerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get configuration
   * @returns Current configuration
   */
  public getConfig(): MultiLayerConfig {
    return { ...this.config };
  }

  /**
   * Clear detection cache
   */
  public clearCache(): void {
    this.detectionCache.clear();
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getCacheStats(): { size: number } {
    return {
      size: this.detectionCache.size,
    };
  }
}

/**
 * Export singleton instance
 */
export const multiLayerDetector = new MultiLayerDetector();

/**
 * Utility function for backward compatibility
 */
export async function detectPIIWithMultiLayer(imageSrc: string): Promise<DetectionResult> {
  return multiLayerDetector.detectPII(imageSrc);
}
