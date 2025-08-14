/**
 * LLM Verification for PII Detection
 * Handles LLM-based verification and enhancement of PII detections
 */

import { PIIDetection, LLMVerificationRequest, LLMVerificationResponse, DetectionSource } from '../types/pii-types';
import { callLLM } from '../config/llm-config';
import { errorHandler, PIIErrorType } from '../utils/error-handler';
import { detectionConfig } from '../config/detection-config';

/**
 * LLM verifier class for PII detection verification
 */
export class LLMVerifier {
  private config = detectionConfig.getDetectionConfig();

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
      const request: LLMVerificationRequest = {
        fullText,
        patternDetections,
        context,
      };

      const response = await this.callLLMForVerification(request);
      return this.processLLMResponse(response, patternDetections);
    } catch (error) {
      errorHandler.handleLLMError('llm_verification', error as Error);
      return patternDetections; // Fallback to pattern detections
    }
  }

  /**
   * Call LLM for verification
   * @param request - Verification request
   * @returns LLM response
   */
  private async callLLMForVerification(request: LLMVerificationRequest): Promise<string | null> {
    const prompt = this.buildVerificationPrompt(request);
    return await callLLM(prompt);
  }

  /**
   * Build verification prompt for LLM
   * @param request - Verification request
   * @returns Formatted prompt
   */
  private buildVerificationPrompt(request: LLMVerificationRequest): string {
    const { fullText, patternDetections, context } = request;
    
    const detectionContext = patternDetections.map(d => ({
      type: d.type,
      text: d.text,
      confidence: d.confidence,
      line: d.line
    }));

    return `Verify and enhance the following PII detections found in this text:

TEXT: "${this.sanitizeText(fullText)}"

PATTERN DETECTIONS: ${JSON.stringify(detectionContext, null, 2)}

${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

Please:
1. Verify each detected PII is actually PII (not false positives)
2. Adjust confidence scores based on context
3. Add any missed PII that pattern matching didn't catch
4. Provide bounding box estimates for new detections

Return a JSON array of verified detections with:
- type: PII category
- text: exact text found
- confidence: adjusted confidence (0.0-1.0)
- line: line number
- boundingBox: {x, y, width, height}
- verified: true/false (whether this was verified by LLM)

Example response:
[
  {
    "type": "credit_card",
    "text": "1234-5678-9012-3456",
    "confidence": 0.98,
    "line": 0,
    "boundingBox": {"x": 100, "y": 50, "width": 200, "height": 30},
    "verified": true
  }
]`;
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
   * Process LLM response
   * @param llmResponse - Raw LLM response
   * @param patternDetections - Original pattern detections
   * @returns Processed PII detections
   */
  private processLLMResponse(
    llmResponse: string | null,
    patternDetections: PIIDetection[]
  ): PIIDetection[] {
    if (!llmResponse) {
      return patternDetections;
    }

    try {
      const verifiedDetections = this.parseLLMResponse(llmResponse);
      return this.mergeDetections(verifiedDetections, patternDetections);
    } catch (error) {
      errorHandler.handleLLMError('response_parsing', error as Error);
      return patternDetections;
    }
  }

  /**
   * Parse LLM response
   * @param response - LLM response string
   * @returns Parsed detections
   */
  private parseLLMResponse(response: string): any[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to parsing entire response
      return JSON.parse(response);
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
    llmDetections: any[],
    patternDetections: PIIDetection[]
  ): PIIDetection[] {
    const finalDetections: PIIDetection[] = [];

    // Process LLM detections
    llmDetections.forEach((detection: any) => {
      if (this.isValidDetection(detection)) {
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
          }
        }
      }
    });

    // Add any pattern detections that weren't processed by LLM
    patternDetections.forEach(patternDetection => {
      const wasProcessed = finalDetections.some(d => 
        d.text === patternDetection.text && d.type === patternDetection.type
      );
      if (!wasProcessed) {
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
      detection.text.length > 0
    );
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
  } {
    const total = detections.length;
    const verified = detections.filter(d => d.verified).length;
    const unverified = total - verified;
    const averageConfidence = total > 0 
      ? detections.reduce((sum, d) => sum + d.confidence, 0) / total 
      : 0;

    return {
      total,
      verified,
      unverified,
      averageConfidence,
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
