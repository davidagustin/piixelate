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
import { detectionConfig } from '../config/detection-config';
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
  private config = detectionConfig.getConfig();

  /**
   * Run comprehensive multi-layer detection example
   */
  public async runExample(): Promise<void> {
    console.log('🚀 Starting Multi-Layer PII Detection Example');
    console.log('=' .repeat(60));

    try {
      // Initialize the system
      await this.initializeSystem();

      // Run detection scenarios
      await this.runDetectionScenarios();

      // Demonstrate obscuring techniques
      await this.demonstrateObscuringTechniques();

      // Show performance analysis
      await this.showPerformanceAnalysis();

      console.log('✅ Multi-Layer PII Detection Example completed successfully');
    } catch (error) {
      console.error('❌ Example failed:', error);
    }
  }

  /**
   * Initialize the multi-layer detection system
   */
  private async initializeSystem(): Promise<void> {
    console.log('🔧 Initializing Multi-Layer Detection System...');
    
    try {
      await multiLayerDetector.initialize();
      console.log('✅ System initialized successfully');
      
      // Show configuration
      const config = multiLayerDetector.getConfig();
      console.log('📋 Configuration:');
      console.log(`  - Vision Layer: ${config.layers.vision.enabled ? '✅' : '❌'}`);
      console.log(`  - Pattern Layer: ${config.layers.pattern.enabled ? '✅' : '❌'}`);
      console.log(`  - Specialized Layer: ${config.layers.specialized.enabled ? '✅' : '❌'}`);
      console.log(`  - Enhanced LLM Layer: ${config.layers.enhancedLLM.enabled ? '✅' : '❌'}`);
      console.log(`  - Verification Layer: ${config.layers.verification.enabled ? '✅' : '❌'}`);
      console.log(`  - Ensemble Layer: ${config.layers.ensemble.enabled ? '✅' : '❌'}`);
      console.log(`  - Obscuring Layer: ${config.layers.obscuring.enabled ? '✅' : '❌'}`);
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Run detection scenarios
   */
  private async runDetectionScenarios(): Promise<void> {
    console.log('\n🔍 Running Detection Scenarios...');
    console.log('=' .repeat(40));

    for (const [key, scenario] of Object.entries(EXAMPLE_SCENARIOS)) {
      console.log(`\n📄 Scenario: ${scenario.name}`);
      console.log(`📝 Description: ${scenario.description}`);
      
      try {
        const result = await this.runSingleScenario(scenario);
        this.displayScenarioResults(scenario, result);
      } catch (error) {
        console.error(`❌ Scenario ${scenario.name} failed:`, error);
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
  private displayScenarioResults(scenario: any, result: DetectionResult): void {
    console.log(`⏱️  Processing Time: ${result.processingTime}ms`);
    console.log(`🔍 Total Detections: ${result.detections.length}`);
    console.log(`✅ Success: ${result.success ? 'Yes' : 'No'}`);
    
    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`);
      result.errors.forEach(error => {
        console.log(`   - ${error.message}`);
      });
    }

    // Show detections by type
    const detectionsByType = this.groupDetectionsByType(result.detections);
    console.log('📊 Detections by Type:');
    Object.entries(detectionsByType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    // Show layer performance
    if (result.stats?.layerResults) {
      console.log('🏗️  Layer Performance:');
      result.stats.layerResults.forEach(layer => {
        console.log(`   - ${layer.layer}: ${layer.detections} detections, ${layer.processingTime}ms, confidence: ${layer.confidence.toFixed(2)}`);
      });
    }

    // Show accuracy analysis
    this.analyzeAccuracy(scenario, result.detections);
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
   * Analyze detection accuracy
   * @param scenario - Scenario configuration
   * @param detections - Array of detections
   */
  private analyzeAccuracy(scenario: any, detections: PIIDetection[]): void {
    const detectedTypes = new Set(detections.map(d => d.type));
    const expectedTypes = new Set(scenario.expectedTypes);
    
    const truePositives = [...detectedTypes].filter(type => expectedTypes.has(type));
    const falsePositives = [...detectedTypes].filter(type => !expectedTypes.has(type));
    const falseNegatives = [...expectedTypes].filter(type => !detectedTypes.has(type));
    
    console.log('🎯 Accuracy Analysis:');
    console.log(`   - True Positives: ${truePositives.length} (${truePositives.join(', ')})`);
    console.log(`   - False Positives: ${falsePositives.length} (${falsePositives.join(', ')})`);
    console.log(`   - False Negatives: ${falseNegatives.length} (${falseNegatives.join(', ')})`);
    
    const precision = truePositives.length / (truePositives.length + falsePositives.length);
    const recall = truePositives.length / (truePositives.length + falseNegatives.length);
    const f1Score = 2 * (precision * recall) / (precision + recall);
    
    console.log(`   - Precision: ${(precision * 100).toFixed(1)}%`);
    console.log(`   - Recall: ${(recall * 100).toFixed(1)}%`);
    console.log(`   - F1 Score: ${(f1Score * 100).toFixed(1)}%`);
  }

  /**
   * Demonstrate obscuring techniques
   */
  private async demonstrateObscuringTechniques(): Promise<void> {
    console.log('\n🎭 Demonstrating PII Obscuring Techniques...');
    console.log('=' .repeat(50));

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
      console.log(`\n🔒 Technique: ${technique.toUpperCase()}`);
      
      sampleDetections.forEach(detection => {
        const result = piiObscurer.obscurePII(detection, technique);
        console.log(`   ${detection.type}: "${detection.text}" → "${result.obscuredText}"`);
      });
    });
  }

  /**
   * Show performance analysis
   */
  private async showPerformanceAnalysis(): Promise<void> {
    console.log('\n📈 Performance Analysis...');
    console.log('=' .repeat(30));

    // Get system statistics
    const config = multiLayerDetector.getConfig();
    const cacheStats = multiLayerDetector.getCacheStats();
    const obscurerStats = piiObscurer.getTokenMapStats();

    console.log('🏗️  System Configuration:');
    console.log(`   - Max Total Detections: ${config.maxTotalDetections}`);
    console.log(`   - Processing Timeout: ${config.processingTimeout}ms`);
    console.log(`   - Enable Cross Validation: ${config.enableCrossValidation ? 'Yes' : 'No'}`);
    console.log(`   - Enable Confidence Boost: ${config.enableConfidenceBoost ? 'Yes' : 'No'}`);

    console.log('\n💾 Cache Statistics:');
    console.log(`   - Detection Cache Size: ${cacheStats.size}`);
    console.log(`   - Token Map Size: ${obscurerStats.size}`);
    console.log(`   - Token Counter: ${obscurerStats.counter}`);

    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    if (cacheStats.size > 100) {
      console.log('   - Consider clearing cache to free memory');
    }
    if (obscurerStats.size > 50) {
      console.log('   - Consider clearing token map for security');
    }
    
    console.log('   - Enable parallel processing for better performance');
    console.log('   - Use appropriate confidence thresholds for your use case');
    console.log('   - Consider disabling unused layers to reduce processing time');
  }

  /**
   * Run a quick performance test
   */
  public async runPerformanceTest(): Promise<void> {
    console.log('\n⚡ Running Performance Test...');
    console.log('=' .repeat(30));

    const testImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'; // Mock base64
    const iterations = 3;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      console.log(`   Test ${i + 1}/${iterations}...`);
      const startTime = Date.now();
      
      try {
        await multiLayerDetector.detectPII(testImage);
        const endTime = Date.now();
        times.push(endTime - startTime);
      } catch (error) {
        console.error(`   Test ${i + 1} failed:`, error);
      }
    }

    if (times.length > 0) {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`\n📊 Performance Results:`);
      console.log(`   - Average Time: ${avgTime.toFixed(0)}ms`);
      console.log(`   - Min Time: ${minTime}ms`);
      console.log(`   - Max Time: ${maxTime}ms`);
      console.log(`   - Variance: ${this.calculateVariance(times).toFixed(0)}ms`);
    }
  }

  /**
   * Calculate variance
   * @param values - Array of values
   * @returns Variance
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
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
