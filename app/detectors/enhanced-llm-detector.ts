/**
 * Enhanced LLM Detector for PII Detection
 * Provides enterprise-grade PII detection using multiple LLM providers with fallback mechanisms
 */

import { PIIDetection, DetectionSource } from '../types/pii-types';
import { callLLM, LLMDetection } from '../config/llm-config';
import { errorHandler } from '../utils/error-handler';
import { detectionConfig } from '../config/detection-config';

/**
 * Enhanced LLM detector configuration
 */
interface EnhancedLLMConfig {
  enableMultiProvider: boolean;
  enableFallback: boolean;
  enableEnsemble: boolean;
  confidenceThreshold: number;
  maxRetries: number;
  timeout: number;
}

/**
 * LLM provider configuration
 */
interface LLMProvider {
  name: string;
  priority: number;
  enabled: boolean;
  apiKey?: string | undefined;
  model: string;
  endpoint?: string | undefined;
}

/**
 * Detection result with provider information
 */
interface EnhancedDetectionResult {
  detections: PIIDetection[];
  provider: string;
  model: string;
  confidence: number;
  processingTime: number;
  success: boolean;
  error?: string;
}

/**
 * Enhanced LLM Detector class
 */
export class EnhancedLLMDetector {
  private config: EnhancedLLMConfig;
  private providers: LLMProvider[];
  private detectionCache = new Map<string, EnhancedDetectionResult>();
  private lastDetectionTime = 0;

  constructor() {
    this.config = {
      enableMultiProvider: true,
      enableFallback: true,
      enableEnsemble: false,
      confidenceThreshold: 0.6,
      maxRetries: 3,
      timeout: 15000,
    };

    this.providers = this.initializeProviders();
  }

  /**
   * Initialize LLM providers
   */
  private initializeProviders(): LLMProvider[] {
    const env = detectionConfig.getConfig();
    
    return [
      {
        name: 'openai',
        priority: 1,
        enabled: !!env.openaiApiKey,
        apiKey: env.openaiApiKey,
        model: 'gpt-4o-mini',
      },
      {
        name: 'anthropic',
        priority: 2,
        enabled: !!env.anthropicApiKey,
        apiKey: env.anthropicApiKey,
        model: 'claude-3-sonnet-20240229',
      },
      {
        name: 'google',
        priority: 3,
        enabled: !!env.googleAiApiKey,
        apiKey: env.googleAiApiKey,
        model: 'gemini-pro',
      },
      {
        name: 'mock',
        priority: 4,
        enabled: true,
        model: 'mock-llm-v2',
      },
    ].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Detect PII using enhanced LLM capabilities
   * @param text - Text to analyze
   * @param context - Additional context
   * @returns Enhanced detection result
   */
  public async detectPII(text: string, context?: string): Promise<PIIDetection[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    try {
      // Check cache
      const cacheKey = this.generateCacheKey(text, context);
      const cachedResult = this.detectionCache.get(cacheKey);
      if (cachedResult && Date.now() - this.lastDetectionTime < 300000) { // 5 minute cache
        return cachedResult.detections;
      }

      let result: PIIDetection[] = [];

      if (this.config.enableMultiProvider) {
        result = await this.detectWithMultipleProviders(text, context);
      } else {
        result = await this.detectWithSingleProvider(text, context);
      }

      // Cache the result
      const detectionResult: EnhancedDetectionResult = {
        detections: result,
        provider: 'enhanced-llm',
        model: 'multi-provider',
        confidence: this.calculateAverageConfidence(result),
        processingTime: Date.now() - this.lastDetectionTime,
        success: true,
      };

      this.detectionCache.set(cacheKey, detectionResult);
      this.lastDetectionTime = Date.now();

      return result;
    } catch (error) {
      errorHandler.handleLLMError('enhanced_llm_detection', error as Error);
      return [];
    }
  }

  /**
   * Detect PII using multiple providers with fallback
   * @param text - Text to analyze
   * @param context - Additional context
   * @returns Combined detection results
   */
  private async detectWithMultipleProviders(text: string, context?: string): Promise<PIIDetection[]> {
    const enabledProviders = this.providers.filter(p => p.enabled);
    const results: EnhancedDetectionResult[] = [];

    // Try each provider in priority order
    for (const provider of enabledProviders) {
      try {
        const result = await this.detectWithProvider(text, context, provider);
        if (result.success && result.detections.length > 0) {
          results.push(result);
          
          // If we have a good result, we can stop here unless ensemble is enabled
          if (!this.config.enableEnsemble && result.confidence > 0.8) {
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    // Combine results
    if (this.config.enableEnsemble && results.length > 1) {
      return this.ensembleDetections(results);
    } else if (results.length > 0) {
      // Return the best result
      const bestResult = results.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      return bestResult.detections;
    }

    return [];
  }

  /**
   * Detect PII using a single provider
   * @param text - Text to analyze
   * @param context - Additional context
   * @returns Detection results
   */
  private async detectWithSingleProvider(text: string, context?: string): Promise<PIIDetection[]> {
    const enabledProviders = this.providers.filter(p => p.enabled);
    
    for (const provider of enabledProviders) {
      try {
        const result = await this.detectWithProvider(text, context, provider);
        if (result.success) {
          return result.detections;
        }
      } catch (error) {
        continue;
      }
    }

    return [];
  }

  /**
   * Detect PII using a specific provider
   * @param text - Text to analyze
   * @param context - Additional context
   * @param provider - Provider configuration
   * @returns Detection result
   */
  private async detectWithProvider(
    text: string, 
    context?: string, 
    provider?: LLMProvider
  ): Promise<EnhancedDetectionResult> {
    const startTime = Date.now();
    
    try {
      // Create enhanced prompt for the specific provider
      const prompt = this.createEnhancedPrompt(text, context);
      
      // Call LLM with provider-specific configuration
      const llmResponse = await callLLM(prompt, context);
      
      if (!llmResponse.success || !llmResponse.data) {
        throw new Error(llmResponse.error || 'LLM call failed');
      }

      // Parse and validate detections
      const detections = this.parseDetections(llmResponse.data);
      const validDetections = this.validateDetections(detections);
      
      return {
        detections: validDetections,
        provider: provider?.name || 'unknown',
        model: provider?.model || 'unknown',
        confidence: this.calculateAverageConfidence(validDetections),
        processingTime: Date.now() - startTime,
        success: true,
      };
    } catch (error) {
      return {
        detections: [],
        provider: provider?.name || 'unknown',
        model: provider?.model || 'unknown',
        confidence: 0,
        processingTime: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create enhanced prompt for PII detection
   * @param text - Text to analyze
   * @param context - Additional context
   * @returns Enhanced prompt
   */
  private createEnhancedPrompt(text: string, context?: string): string {
    const enhancedText = context ? `${text}\n\nContext: ${context}` : text;
    
    return `You are an expert PII detection system with enterprise-grade accuracy. Analyze the following text and identify all Personally Identifiable Information.

TEXT TO ANALYZE:
"${this.sanitizeText(enhancedText)}"

DETECTION CATEGORIES:
1. FINANCIAL: Credit cards, bank accounts, tax IDs, insurance numbers
2. PERSONAL: Driver's licenses, passports, government IDs, employee IDs
3. CONTACT: Phone numbers, emails, addresses, social media handles
4. MEDICAL: Patient IDs, prescriptions, health insurance, medical records
5. TECHNICAL: IP addresses, MAC addresses, VIN numbers, serial numbers
6. DOCUMENTS: Case numbers, reference numbers, transaction IDs

ANALYSIS REQUIREMENTS:
- Examine text carefully for any sensitive information
- Consider context to avoid false positives
- Provide accurate confidence scores
- Include bounding box estimates
- Add reasoning for complex detections

Return ONLY a valid JSON array with this structure:
[
  {
    "type": "category_name",
    "text": "exact_text_found",
    "confidence": 0.95,
    "line": 0,
    "boundingBox": {"x": 0, "y": 0, "width": 200, "height": 30},
    "verified": true,
    "reasoning": "brief explanation"
  }
]

IMPORTANT: Only return valid JSON. No additional text.`;
  }

  /**
   * Parse LLM response into detections
   * @param response - LLM response
   * @returns Parsed detections
   */
  private parseDetections(response: string): LLMDetection[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      // Fallback to parsing entire response
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Validate and convert detections to PIIDetection format
   * @param detections - Raw detections
   * @returns Validated detections
   */
  private validateDetections(detections: LLMDetection[]): PIIDetection[] {
    return detections
      .filter(detection => this.isValidDetection(detection))
      .map(detection => ({
        type: detection.type as PIIDetection['type'],
        text: detection.text,
        confidence: Math.min(Math.max(detection.confidence || 0.5, 0), 1),
        line: detection.line || 0,
        boundingBox: detection.boundingBox || { x: 0, y: 0, width: 100, height: 30 },
        source: 'llm' as DetectionSource,
        verified: detection.verified || false,
      }))
      .filter(detection => detection.confidence >= this.config.confidenceThreshold);
  }

  /**
   * Validate detection object
   * @param detection - Detection to validate
   * @returns True if valid
   */
  private isValidDetection(detection: any): boolean {
    return (
      detection &&
      typeof detection.type === 'string' &&
      typeof detection.text === 'string' &&
      detection.text.length > 0 &&
      typeof detection.confidence === 'number' &&
      detection.confidence >= 0 &&
      detection.confidence <= 1
    );
  }

  /**
   * Ensemble multiple detection results
   * @param results - Multiple detection results
   * @returns Ensembled detections
   */
  private ensembleDetections(results: EnhancedDetectionResult[]): PIIDetection[] {
    const detectionMap = new Map<string, PIIDetection[]>();
    
    // Group detections by text and type
    results.forEach(result => {
      result.detections.forEach(detection => {
        const key = `${detection.type}:${detection.text}`;
        if (!detectionMap.has(key)) {
          detectionMap.set(key, []);
        }
        detectionMap.get(key)!.push(detection);
      });
    });

    // Ensemble detections
    const ensembledDetections: PIIDetection[] = [];
    
    detectionMap.forEach((detections) => {
      if (detections.length >= 2) { // Require at least 2 providers to agree
        const avgConfidence = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
        const bestDetection = detections.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        );
        
        ensembledDetections.push({
          ...bestDetection,
          confidence: Math.min(avgConfidence * 1.1, 1.0), // Boost confidence for ensemble
          verified: true,
        });
      }
    });

    return ensembledDetections;
  }

  /**
   * Calculate average confidence of detections
   * @param detections - Array of detections
   * @returns Average confidence
   */
  private calculateAverageConfidence(detections: PIIDetection[]): number {
    if (detections.length === 0) return 0;
    return detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
  }

  /**
   * Generate cache key
   * @param text - Text content
   * @param context - Additional context
   * @returns Cache key
   */
  private generateCacheKey(text: string, context?: string): string {
    const textHash = this.simpleHash(text.substring(0, 1000));
    const contextHash = context ? this.simpleHash(context) : '0';
    return `${textHash}-${contextHash}`;
  }

  /**
   * Simple hash function
   * @param str - String to hash
   * @returns Hash value
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Sanitize text for LLM input
   * @param text - Text to sanitize
   * @returns Sanitized text
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/[<>]/g, '')
      .replace(/\n/g, ' ')
      .substring(0, 8000);
  }

  /**
   * Update configuration
   * @param newConfig - New configuration
   */
  public updateConfig(newConfig: Partial<EnhancedLLMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get configuration
   * @returns Current configuration
   */
  public getConfig(): EnhancedLLMConfig {
    return { ...this.config };
  }

  /**
   * Clear detection cache
   */
  public clearCache(): void {
    this.detectionCache.clear();
    this.lastDetectionTime = 0;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getCacheStats(): {
    size: number;
    lastDetection: number;
  } {
    return {
      size: this.detectionCache.size,
      lastDetection: this.lastDetectionTime,
    };
  }

  /**
   * Get provider statistics
   * @returns Provider statistics
   */
  public getProviderStats(): {
    total: number;
    enabled: number;
    providers: Array<{ name: string; enabled: boolean; priority: number }>;
  } {
    return {
      total: this.providers.length,
      enabled: this.providers.filter(p => p.enabled).length,
      providers: this.providers.map(p => ({
        name: p.name,
        enabled: p.enabled,
        priority: p.priority,
      })),
    };
  }
}

/**
 * Export singleton instance
 */
export const enhancedLLMDetector = new EnhancedLLMDetector();

/**
 * Utility function for backward compatibility
 */
export async function detectPIIWithEnhancedLLM(
  text: string,
  context?: string
): Promise<PIIDetection[]> {
  return enhancedLLMDetector.detectPII(text, context);
}
