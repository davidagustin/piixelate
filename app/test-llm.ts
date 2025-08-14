/**
 * Test file for Enhanced LLM Detection
 * This file tests the enhanced LLM detection capabilities
 */

import { enhancedLLMDetector } from './detectors/enhanced-llm-detector';
import { llmVerifier } from './detectors/llm-verifier';

/**
 * Test data with various PII types
 */
const testData = [
  {
    name: 'Credit Card Test',
    text: 'My credit card number is XXXX-XXXX-XXXX-XXXX and my phone is (XXX) XXX-XXXX',
    expectedTypes: ['credit_card', 'phone']
  },
  {
    name: 'Email and Address Test',
    text: 'Contact me at sample@example.com or visit XXX Sample Street, Anytown, CA XXXXX',
    expectedTypes: ['email', 'address']
  },
  {
    name: 'SSN Test',
    text: 'My social security number is XXX-XX-XXXX',
    expectedTypes: ['ssn']
  },
  {
    name: 'Mixed PII Test',
    text: 'Sample Name lives at XXX Sample Avenue, his email is sample@company.com, phone (XXX) XXX-XXXX, and SSN XXX-XX-XXXX',
    expectedTypes: ['name', 'address', 'email', 'phone', 'ssn']
  }
];

/**
 * Test enhanced LLM detector
 */
async function testEnhancedLLMDetector() {
  console.log('🧪 Testing Enhanced LLM Detector...\n');

  for (const test of testData) {
    console.log(`📋 Test: ${test.name}`);
    console.log(`📝 Text: "${test.text}"`);
    
    try {
      const detections = await enhancedLLMDetector.detectPII(test.text);
      
      console.log(`✅ Found ${detections.length} detections:`);
      detections.forEach(detection => {
        console.log(`   - ${detection.type}: "${detection.text}" (confidence: ${detection.confidence})`);
      });
      
      const foundTypes = detections.map(d => d.type);
      const missingTypes = test.expectedTypes.filter(type => !foundTypes.includes(type));
      
      if (missingTypes.length > 0) {
        console.log(`⚠️  Missing expected types: ${missingTypes.join(', ')}`);
      } else {
        console.log(`🎉 All expected types found!`);
      }
      
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
    
    console.log('');
  }
}

/**
 * Test LLM verifier
 */
async function testLLMVerifier() {
  console.log('🧪 Testing LLM Verifier...\n');

  const testText = 'Contact me at sample@example.com or call (XXX) XXX-XXXX';
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

  try {
    const verifiedDetections = await llmVerifier.verifyWithLLM(testText, mockDetections);
    
    console.log(`✅ Verified ${verifiedDetections.length} detections:`);
    verifiedDetections.forEach(detection => {
      console.log(`   - ${detection.type}: "${detection.text}" (confidence: ${detection.confidence}, verified: ${detection.verified})`);
    });
    
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }
}

/**
 * Test provider statistics
 */
function testProviderStats() {
  console.log('🧪 Testing Provider Statistics...\n');

  const providerStats = enhancedLLMDetector.getProviderStats();
  console.log('Provider Statistics:');
  console.log(`   Total providers: ${providerStats.total}`);
  console.log(`   Enabled providers: ${providerStats.enabled}`);
  console.log('   Provider details:');
  providerStats.providers.forEach(provider => {
    console.log(`     - ${provider.name}: ${provider.enabled ? '✅' : '❌'} (priority: ${provider.priority})`);
  });
  
  const cacheStats = enhancedLLMDetector.getCacheStats();
  console.log(`\nCache Statistics:`);
  console.log(`   Cache size: ${cacheStats.size}`);
  console.log(`   Last detection: ${cacheStats.lastDetection > 0 ? new Date(cacheStats.lastDetection).toISOString() : 'Never'}`);
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Enhanced LLM Detection Tests\n');
  
  // Test provider statistics
  testProviderStats();
  console.log('');
  
  // Test enhanced LLM detector
  await testEnhancedLLMDetector();
  
  // Test LLM verifier
  await testLLMVerifier();
  
  console.log('✅ All tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}

export { runTests, testEnhancedLLMDetector, testLLMVerifier, testProviderStats };
