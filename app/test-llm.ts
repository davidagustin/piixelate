/* eslint-disable no-console */
/**
 * Test file for Enhanced LLM Detection
 * This file tests the enhanced LLM detection capabilities
 */

import { enhancedLLMDetector } from './detectors/enhanced-llm-detector';
import { llmVerifier } from './detectors/llm-verifier';
import { detectionConfig } from './config/detection-config';
import { PIIType } from './types/pii-types';

/**
 * Test data with various PII types
 */
const testData: Array<{
  name: string;
  text: string;
  expectedTypes: PIIType[];
}> = [
  {
    name: 'Credit Card Test',
    text: 'My credit card number is 4111-1111-1111-1111 and my phone is (555) 123-4567',
    expectedTypes: ['credit_card', 'phone']
  },
  {
    name: 'Email and Address Test',
    text: 'Contact me at sample@example.com or visit 123 Sample Street, Anytown, CA 90210',
    expectedTypes: ['email', 'address']
  },
  {
    name: 'SSN Test',
    text: 'My social security number is 123-45-6789',
    expectedTypes: ['ssn']
  },
  {
    name: 'Mixed PII Test',
    text: 'John Smith lives at 456 Main Avenue, his email is john@company.com, phone (555) 987-6543, and SSN 987-65-4321',
    expectedTypes: ['name', 'address', 'email', 'phone', 'ssn']
  },
  {
    name: 'Driver License Test',
    text: 'Hawaii Driver License: 01-47-87441, DOB: 06/03/1981, Name: McLOVIN',
    expectedTypes: ['drivers_license', 'name']
  }
];

/**
 * Test enhanced LLM detector
 */
async function testEnhancedLLMDetector() {
  console.log('\n🔍 Testing Enhanced LLM Detector...');
  console.log('=' .repeat(50));
  
  const config = detectionConfig.getConfig();
  console.log(`📋 Configuration: LLM Provider = ${config.llmProvider}, Model = ${config.llmModel}`);
  console.log(`🔧 LLM Enabled: ${config.enableLLM}`);
  
  for (const test of testData) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📝 Input: "${test.text}"`);
    console.log(`🎯 Expected: ${test.expectedTypes.join(', ')}`);
    
    try {
      const startTime = Date.now();
      const detections = await enhancedLLMDetector.detectPII(test.text);
      const processingTime = Date.now() - startTime;
      
      console.log(`⏱️  Processing time: ${processingTime}ms`);
      console.log(`📊 Found ${detections.length} detections:`);
      
      if (detections.length === 0) {
        console.log('   ❌ No detections found');
      } else {
        detections.forEach((detection, index) => {
          console.log(`   ${index + 1}. Type: ${detection.type}`);
          console.log(`      Text: "${detection.text}"`);
          console.log(`      Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
          console.log(`      Source: ${detection.source}`);
          console.log(`      Verified: ${detection.verified ? '✅' : '❌'}`);
        });
      }
      
      // Check if expected types were found
      const foundTypes = detections.map(d => d.type);
      const missingTypes = test.expectedTypes.filter(type => !foundTypes.includes(type));
      const extraTypes = foundTypes.filter(type => !test.expectedTypes.includes(type));
      
      if (missingTypes.length > 0) {
        console.log(`⚠️  Missing expected types: ${missingTypes.join(', ')}`);
      }
      if (extraTypes.length > 0) {
        console.log(`ℹ️  Extra types found: ${extraTypes.join(', ')}`);
      }
      if (missingTypes.length === 0 && extraTypes.length === 0) {
        console.log('✅ All expected types found!');
      }
      
    } catch (error) {
      console.error(`❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Test LLM verifier
 */
async function testLLMVerifier() {
  console.log('\n🔍 Testing LLM Verifier...');
  console.log('=' .repeat(50));
  
  const testText = 'Contact me at sample@example.com or call (555) 123-4567';
  const mockDetections = [
    {
      type: 'email' as const,
      text: 'sample@example.com',
      confidence: 0.8,
      line: 0,
      boundingBox: { x: 0, y: 0, width: 100, height: 30 },
      source: 'pattern' as const
    }
  ];

  console.log(`📝 Input text: "${testText}"`);
  console.log(`🔍 Mock detections: ${mockDetections.length}`);

  try {
    const startTime = Date.now();
    const verifiedDetections = await llmVerifier.verifyWithLLM(testText, mockDetections);
    const processingTime = Date.now() - startTime;
    
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📊 Verified ${verifiedDetections.length} detections:`);
    
    verifiedDetections.forEach((detection, index) => {
      console.log(`   ${index + 1}. Type: ${detection.type}`);
      console.log(`      Text: "${detection.text}"`);
      console.log(`      Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
      console.log(`      Verified: ${detection.verified ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error(`❌ Error during verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test configuration
 */
function testConfiguration() {
  console.log('\n⚙️  Testing Configuration...');
  console.log('=' .repeat(50));
  
  const summary = detectionConfig.getConfigSummary();
  
  console.log('📋 Configuration Summary:');
  console.log(JSON.stringify(summary, null, 2));
  
  // Test provider stats
  const providerStats = enhancedLLMDetector.getProviderStats();
  console.log('\n🔧 Provider Statistics:');
  console.log(`   Total providers: ${providerStats.total}`);
  console.log(`   Enabled providers: ${providerStats.enabled}`);
  providerStats.providers.forEach(provider => {
    console.log(`   - ${provider.name}: ${provider.enabled ? '✅' : '❌'} (priority: ${provider.priority})`);
  });
  
  // Test cache stats
  const cacheStats = enhancedLLMDetector.getCacheStats();
  console.log('\n💾 Cache Statistics:');
  console.log(`   Cache size: ${cacheStats.size}`);
  console.log(`   Last detection: ${cacheStats.lastDetection > 0 ? new Date(cacheStats.lastDetection).toISOString() : 'Never'}`);
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting PII Detection Tests...');
  console.log('=' .repeat(60));
  
  // Test configuration first
  testConfiguration();
  
  // Test enhanced LLM detector
  await testEnhancedLLMDetector();
  
  // Test LLM verifier
  await testLLMVerifier();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch((error) => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { runTests, testEnhancedLLMDetector, testLLMVerifier, testConfiguration };
