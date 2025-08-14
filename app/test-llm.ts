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
  for (const test of testData) {
    try {
      const detections = await enhancedLLMDetector.detectPII(test.text);
      
      const foundTypes = detections.map(d => d.type as string);
      const missingTypes = test.expectedTypes.filter(type => !foundTypes.includes(type));
      
    } catch (error) {
      // Error occurred during testing
    }
  }
}

/**
 * Test LLM verifier
 */
async function testLLMVerifier() {
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
    
  } catch (error) {
    // Error occurred during testing
  }
}

/**
 * Test provider statistics
 */
function testProviderStats() {
  const providerStats = enhancedLLMDetector.getProviderStats();
  const cacheStats = enhancedLLMDetector.getCacheStats();
}

/**
 * Main test function
 */
async function runTests() {
  // Test provider statistics
  testProviderStats();
  
  // Test enhanced LLM detector
  await testEnhancedLLMDetector();
  
  // Test LLM verifier
  await testLLMVerifier();
  
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(() => {
    // Test execution failed
  });
}

export { runTests, testEnhancedLLMDetector, testLLMVerifier, testProviderStats };
