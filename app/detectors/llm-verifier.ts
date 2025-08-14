/**
 * Enhanced LLM Verification for PII Detection
 * Handles LLM-based verification and enhancement of PII detections with enterprise-grade capabilities
 */

import { PIIDetection, LLMVerificationRequest, DetectionSource } from '../types/pii-types';
import { callLLM, LLMResponse, LLMDetection } from '../config/llm-config';
import { errorHandler } from '../utils/error-handler';
import { detectionConfig } from '../config/detection-config';

/**
 * Enhanced LLM verifier class for PII detection verification
 */
export class LLMVerifier {
  private config = detectionConfig.getDetectionConfig();
  private lastVerificationTime = 0;
  private verificationCache = new Map<string, PIIDetection[]>();

  /**
   * Verify and enhance PII detections using LLM
   * @param fullText - Full text content
   * @param patternDetections - Pattern-based detections to verify
   * @param context - Additional context (optional)
   * @returns Enhanced PII detections
   */
  public async verifyWithLLM(
    fullText: string,
    patternDetections: PIIDetection[],
    context?: string
  ): Promise<PIIDetection[]> {
    if (!this.config.enableLLM) {
      return patternDetections;
    }

    try {
      // Check cache for recent verifications
      const cacheKey = this.generateCacheKey(fullText, patternDetections);
      const cachedResult = this.verificationCache.get(cacheKey);
      if (cachedResult && Date.now() - this.lastVerificationTime < 300000) { // 5 minute cache
        console.log('Using cached LLM verification result');
        return cachedResult;
      }

      const request: LLMVerificationRequest = {
        fullText,
        patternDetections,
        ...(context && { context }),
      };

      const response = await this.callLLMForVerification(request);
      const verifiedDetections = this.processLLMResponse(response, patternDetections);
      
      // Cache the result
      this.verificationCache.set(cacheKey, verifiedDetections);
      this.lastVerificationTime = Date.now();
      
      return verifiedDetections;
    } catch (error) {
      errorHandler.handleLLMError('llm_verification', error as Error);
      return patternDetections; // Fallback to pattern detections
    }
  }

  /**
   * Call LLM for verification with enhanced context
   * @param request - Verification request
   * @returns LLM response
   */
  private async callLLMForVerification(request: LLMVerificationRequest): Promise<LLMResponse> {
    const prompt = this.buildEnhancedVerificationPrompt(request);
    const context = this.buildContext(request);
    return await callLLM(prompt, context);
  }

  /**
   * Build enhanced verification prompt for LLM
   * @param request - Verification request
   * @returns Formatted prompt
   */
  private buildEnhancedVerificationPrompt(request: LLMVerificationRequest): string {
    const { fullText, patternDetections, context } = request;
    
    const detectionContext = patternDetections.map(d => ({
      type: d.type,
      text: d.text,
      confidence: d.confidence,
      line: d.line,
      source: d.source
    }));

    return `You are an expert PII verification system. Analyze the following text and verify/enhance PII detections.

TEXT TO ANALYZE:
"${this.sanitizeText(fullText)}"

EXISTING DETECTIONS TO VERIFY:
${JSON.stringify(detectionContext, null, 2)}

${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

VERIFICATION TASKS:
1. Verify each detected PII is actually sensitive information (not false positives)
2. Adjust confidence scores based on context and pattern strength
3. Add any missed PII that pattern matching didn't catch
4. Provide bounding box estimates for new detections
5. Include reasoning for verification decisions

Return a JSON array of verified detections with this exact structure:
[
  {
    "type": "pii_category",
    "text": "exact_text_found",
    "confidence": 0.95,
    "line": 0,
    "boundingBox": {"x": 0, "y": 0, "width": 200, "height": 30},
    "verified": true,
    "reasoning": "explanation of verification decision"
  }
]

IMPORTANT: Only return valid JSON. No additional text outside the JSON array.`;
  }

  /**
   * Build context for LLM analysis
   * @param request - Verification request
   * @returns Context string
   */
  private buildContext(request: LLMVerificationRequest): string {
    const { fullText, patternDetections } = request;
    
    const context = [
      `Text length: ${fullText.length} characters`,
      `Number of lines: ${fullText.split('\n').length}`,
      `Pattern detections found: ${patternDetections.length}`,
      `Detection types: ${[...new Set(patternDetections.map(d => d.type))].join(', ')}`,
      `Average confidence: ${patternDetections.length > 0 ? 
        (patternDetections.reduce((sum, d) => sum + d.confidence, 0) / patternDetections.length).toFixed(2) : '0'}`
    ];
    
    return context.join(' | ');
  }

  /**
   * Sanitize text for LLM input
   * @param text - Text to sanitize
   * @returns Sanitized text
   */
  private sanitizeText(text: string): string {
    // Remove potentially harmful characters and limit length
    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .substring(0, 8000); // Limit length to prevent token overflow
  }

  /**
   * Process LLM response with enhanced parsing
   * @param llmResponse - Raw LLM response
   * @param patternDetections - Original pattern detections
   * @returns Processed PII detections
   */
  private processLLMResponse(
    llmResponse: LLMResponse,
    patternDetections: PIIDetection[]
  ): PIIDetection[] {
    if (!llmResponse.success || !llmResponse.data) {
      console.warn('LLM verification failed:', llmResponse.error);
      return patternDetections;
    }

    try {
      const verifiedDetections = this.parseLLMResponse(llmResponse.data);
      return this.mergeDetections(verifiedDetections, patternDetections);
    } catch (error) {
      errorHandler.handleLLMError('response_parsing', error as Error);
      return patternDetections;
    }
  }

  /**
   * Parse LLM response with enhanced error handling
   * @param response - LLM response string
   * @returns Parsed detections
   */
  private parseLLMResponse(response: string): LLMDetection[] {
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
    } catch (parseError) {
      errorHandler.handleLLMError('json_parsing', parseError as Error);
      return [];
    }
  }

  /**
   * Merge LLM detections with pattern detections
   * @param llmDetections - LLM-verified detections
   * @param patternDetections - Original pattern detections
   * @returns Merged detections
   */
  private mergeDetections(
    llmDetections: LLMDetection[],
    patternDetections: PIIDetection[]
  ): PIIDetection[] {
    const finalDetections: PIIDetection[] = [];
    const processedPatternDetections = new Set<string>();

    // Process LLM detections
    llmDetections.forEach((detection: LLMDetection) => {
      if (this.isValidDetection(detection)) {
        const detectionKey = `${detection.type}:${detection.text}`;
        
        if (detection.verified === true) {
          // Use LLM confidence for verified detections
          finalDetections.push({
            type: detection.type as PIIDetection['type'],
            text: detection.text,
            confidence: Math.min(Math.max(detection.confidence || 0.9, 0), 1),
            line: detection.line || 0,
            boundingBox: detection.boundingBox || { x: 0, y: 0, width: 100, height: 30 },
            source: 'llm' as DetectionSource,
            verified: true,
          });
          
          // Mark corresponding pattern detection as processed
          processedPatternDetections.add(detectionKey);
        } else {
          // For unverified detections, reduce confidence
          const originalDetection = patternDetections.find(d => 
            d.text === detection.text && d.type === detection.type
          );
          if (originalDetection) {
            finalDetections.push({
              ...originalDetection,
              confidence: Math.max(originalDetection.confidence * 0.7, 0.3),
              verified: false,
            });
            processedPatternDetections.add(detectionKey);
          }
        }
      }
    });

    // Add any pattern detections that weren't processed by LLM
    patternDetections.forEach(patternDetection => {
      const detectionKey = `${patternDetection.type}:${patternDetection.text}`;
      if (!processedPatternDetections.has(detectionKey)) {
        finalDetections.push({
          ...patternDetection,
          verified: false,
        });
      }
    });

    return finalDetections;
  }

  /**
   * Validate detection object
   * @param detection - Detection object to validate
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
   * Generate cache key for verification results
   * @param fullText - Full text content
   * @param patternDetections - Pattern detections
   * @returns Cache key
   */
  private generateCacheKey(fullText: string, patternDetections: PIIDetection[]): string {
    const textHash = this.simpleHash(fullText.substring(0, 1000)); // Use first 1000 chars
    const detectionsHash = this.simpleHash(JSON.stringify(patternDetections));
    return `${textHash}-${detectionsHash}`;
  }

  /**
   * Simple hash function for cache keys
   * @param str - String to hash
   * @returns Hash value
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get verification statistics
   * @param detections - Array of detections
   * @returns Statistics object
   */
  public getVerificationStats(detections: PIIDetection[]): {
    total: number;
    verified: number;
    unverified: number;
    averageConfidence: number;
    llmDetections: number;
    patternDetections: number;
  } {
    const total = detections.length;
    const verified = detections.filter(d => d.verified).length;
    const unverified = total - verified;
    const averageConfidence = total > 0 
      ? detections.reduce((sum, d) => sum + d.confidence, 0) / total 
      : 0;
    const llmDetections = detections.filter(d => d.source === 'llm').length;
    const patternDetections = detections.filter(d => d.source === 'pattern').length;

    return {
      total,
      verified,
      unverified,
      averageConfidence,
      llmDetections,
      patternDetections,
    };
  }

  /**
   * Check if LLM verification is available
   * @returns True if LLM verification is enabled
   */
  public isAvailable(): boolean {
    return this.config.enableLLM;
  }

  /**
   * Update configuration
   * @param newConfig - New configuration
   */
  public updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear verification cache
   */
  public clearCache(): void {
    this.verificationCache.clear();
    this.lastVerificationTime = 0;
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  public getCacheStats(): {
    size: number;
    lastVerification: number;
  } {
    return {
      size: this.verificationCache.size,
      lastVerification: this.lastVerificationTime,
    };
  }
}

/**
 * Export singleton instance
 */
export const llmVerifier = new LLMVerifier();

/**
 * Utility function for backward compatibility
 */
export async function verifyWithLLM(
  fullText: string,
  patternDetections: PIIDetection[]
): Promise<PIIDetection[]> {
  return llmVerifier.verifyWithLLM(fullText, patternDetections);
}
