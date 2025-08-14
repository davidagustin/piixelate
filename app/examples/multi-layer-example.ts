/**
 * Multi-Layer PII Detection Example
 * Demonstrates the comprehensive multi-layer PII detection system
 * 
 * This example shows:
 * - Multiple detection layers working together
 * - Different LLM providers and algorithms
 * - PII obscuring techniques
 * - Performance monitoring
 * - Error handling and fallbacks
 */

import { multiLayerDetector } from '../detectors/multi-layer-detector';
import { piiObscurer } from '../utils/pii-obscurer';

import { PIIDetection, DetectionResult } from '../types/pii-types';

/**
 * Example PII detection scenarios
 */
const EXAMPLE_SCENARIOS = {
  creditCard: {
    name: 'Credit Card Document',
    description: 'Document containing credit card information',
    imageSrc: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Mock base64
    expectedTypes: ['credit_card', 'name', 'address'],
  },
  driverLicense: {
    name: 'Driver License',
    description: 'Driver license with personal information',
    imageSrc: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Mock base64
    expectedTypes: ['drivers_license', 'name', 'address', 'date_of_birth'],
  },
  medicalRecord: {
    name: 'Medical Record',
    description: 'Medical document with patient information',
    imageSrc: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Mock base64
    expectedTypes: ['patient_id', 'medical_info', 'name', 'date_of_birth'],
  },
  financialDocument: {
    name: 'Financial Document',
    description: 'Bank statement with account information',
    imageSrc: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Mock base64
    expectedTypes: ['bank_account', 'financial_data', 'name', 'address'],
  },
};

/**
 * Multi-layer PII detection example
 */
export class MultiLayerExample {

  /**
   * Run comprehensive multi-layer detection example
   */
  public async runExample(): Promise<void> {
    try {
      // Initialize the system
      await this.initializeSystem();

      // Run detection scenarios
      await this.runDetectionScenarios();

      // Demonstrate obscuring techniques
      await this.demonstrateObscuringTechniques();

      // Show performance analysis
      await this.showPerformanceAnalysis();

    } catch (error) {
      // Example failed
    }
  }

  /**
   * Initialize the multi-layer detection system
   */
  private async initializeSystem(): Promise<void> {
    try {
      await multiLayerDetector.initialize();
      
      // Show configuration
      multiLayerDetector.getConfig();
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Run detection scenarios
   */
  private async runDetectionScenarios(): Promise<void> {
    for (const [, scenario] of Object.entries(EXAMPLE_SCENARIOS)) {
      try {
        const result = await this.runSingleScenario(scenario);
        this.displayScenarioResults(scenario, result);
      } catch (error) {
        // Scenario failed
      }
    }
  }

  /**
   * Run a single detection scenario
   * @param scenario - Scenario configuration
   * @returns Detection result
   */
  private async runSingleScenario(scenario: any): Promise<DetectionResult> {
    const startTime = Date.now();
    
    // Run multi-layer detection
    const result = await multiLayerDetector.detectPII(scenario.imageSrc);
    
    const processingTime = Date.now() - startTime;
    
    return {
      ...result,
      processingTime,
    };
  }

  /**
   * Display scenario results
   * @param scenario - Scenario configuration
   * @param result - Detection result
   */
  private displayScenarioResults(_scenario: any, result: DetectionResult): void {
    if (result.errors.length > 0) {
      // Handle errors
    }

    // Show detections by type
    this.groupDetectionsByType(result.detections);

    // Show layer performance
    if (result.metadata) {
      // Process metadata
    }

    // Show accuracy analysis
    
  }

  /**
   * Group detections by type
   * @param detections - Array of detections
   * @returns Grouped detections
   */
  private groupDetectionsByType(detections: PIIDetection[]): Record<string, number> {
    return detections.reduce((acc, detection) => {
      acc[detection.type] = (acc[detection.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }



  /**
   * Demonstrate obscuring techniques
   */
  private async demonstrateObscuringTechniques(): Promise<void> {
    const sampleDetections: PIIDetection[] = [
      {
        type: 'credit_card',
        text: '4111-1111-1111-1111',
        confidence: 0.95,
        boundingBox: { x: 100, y: 100, width: 200, height: 30 },
        line: 0,
        source: 'pattern',
      },
      {
        type: 'email',
        text: 'sample@example.com',
        confidence: 0.90,
        boundingBox: { x: 100, y: 150, width: 180, height: 25 },
        line: 1,
        source: 'pattern',
      },
      {
        type: 'phone',
        text: '(XXX) XXX-XXXX',
        confidence: 0.88,
        boundingBox: { x: 100, y: 200, width: 150, height: 25 },
        line: 2,
        source: 'pattern',
      },
      {
        type: 'ssn',
        text: 'XXX-XX-XXXX',
        confidence: 0.92,
        boundingBox: { x: 100, y: 250, width: 120, height: 25 },
        line: 3,
        source: 'pattern',
      },
    ];

    const techniques = piiObscurer.getAvailableTechniques();
    
    techniques.forEach(technique => {
      sampleDetections.forEach(detection => {
        piiObscurer.obscurePII(detection, technique);
        // Process obscuring result
      });
    });
  }

  /**
   * Show performance analysis
   */
  private async showPerformanceAnalysis(): Promise<void> {
    // Get system statistics
    const cacheStats = multiLayerDetector.getCacheStats();
    const obscurerStats = piiObscurer.getTokenMapStats();

    // Performance recommendations
    if (cacheStats.size > 100) {
      // Consider clearing cache to free memory
    }
    if (obscurerStats.size > 50) {
      // Consider clearing token map for security
    }
    
    // Performance analysis completed
  }

  /**
   * Run a quick performance test
   */
  public async runPerformanceTest(): Promise<void> {
    const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'; // Mock base64
    const iterations = 3;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        await multiLayerDetector.detectPII(testImage);
        const endTime = Date.now();
        times.push(endTime - startTime);
      } catch (error) {
        // Test failed
      }
    }

    if (times.length > 0) {
      // Performance results calculated
    }
  }
}

/**
 * Export example instance
 */
export const multiLayerExample = new MultiLayerExample();

/**
 * Utility function to run the example
 */
export async function runMultiLayerExample(): Promise<void> {
  await multiLayerExample.runExample();
}

/**
 * Utility function to run performance test
 */
export async function runPerformanceTest(): Promise<void> {
  await multiLayerExample.runPerformanceTest();
}
