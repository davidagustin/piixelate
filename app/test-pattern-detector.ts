/* eslint-disable no-console */
/**
 * Test file for Pattern Detector
 * Tests all pattern-based PII detection capabilities
 */

import { patternDetector } from './detectors/pattern-detector';
import { PIIType } from './types/pii-types';

/**
 * Test data for pattern detection
 */
const patternTestData = [
  {
    name: 'Credit Card Patterns',
    text: 'Cards: 4111-1111-1111-1111, 5555-5555-5555-4444, 4532-1234-5678-9012',
    expectedTypes: ['credit_card']
  },
  {
    name: 'Phone Number Patterns',
    text: 'Phones: (555) 123-4567, 555.123.4567, +1-555-123-4567, 555-123-4567',
    expectedTypes: ['phone']
  },
  {
    name: 'Email Patterns',
    text: 'Emails: test@example.com, user.name@company.co.uk, admin+tag@domain.org',
    expectedTypes: ['email']
  },
  {
    name: 'SSN Patterns',
    text: 'SSNs: 123-45-6789, 987-65-4321',
    expectedTypes: ['ssn']
  },
  {
    name: 'Address Patterns',
    text: 'Addresses: 123 Main Street, 456 Oak Avenue, 789 Pine Road, 321 Elm Boulevard',
    expectedTypes: ['address']
  },
  {
    name: 'Driver License Patterns',
    text: 'Licenses: 01-47-87441, CA1234567, NY9876543',
    expectedTypes: ['drivers_license']
  },
  {
    name: 'Name Patterns',
    text: 'Names: John Smith, Jane Doe, Robert Johnson, Mary Williams',
    expectedTypes: ['name']
  },
  {
    name: 'IP Address Patterns',
    text: 'IPs: 192.168.1.1, 10.0.0.1, 172.16.0.1, 2001:db8::1',
    expectedTypes: ['ip_address']
  },
  {
    name: 'MAC Address Patterns',
    text: 'MACs: 00:1B:44:11:3A:B7, 00-1B-44-11-3A-B7, 001B.4411.3AB7',
    expectedTypes: ['mac_address']
  },
  {
    name: 'Mixed PII Test',
    text: 'John Smith (john@company.com) lives at 123 Main Street, phone (555) 123-4567, SSN 123-45-6789',
    expectedTypes: ['name', 'email', 'address', 'phone', 'ssn']
  }
];

/**
 * Test pattern detector
 */
async function testPatternDetector() {
  console.log('\n🔍 Testing Pattern Detector...');
  console.log('=' .repeat(50));
  
  for (const test of patternTestData) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📝 Input: "${test.text}"`);
    console.log(`🎯 Expected: ${test.expectedTypes.join(', ')}`);
    
    try {
      // Create OCR result from text
      const ocrResult = {
        text: test.text,
        lines: [{
          text: test.text,
          bbox: { x0: 0, y0: 0, x1: test.text.length * 10, y1: 30 }
        }],
        confidence: 0.95,
        processingTime: 0
      };
      
      const startTime = Date.now();
      const detections = await patternDetector.detectPII(ocrResult);
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
          console.log(`      Line: ${detection.line}`);
        });
      }
      
      // Check if expected types were found
      const foundTypes = detections.map(d => d.type);
      const missingTypes = test.expectedTypes.filter(type => !foundTypes.includes(type as any));
      const extraTypes = foundTypes.filter(type => !test.expectedTypes.includes(type as any));
      
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
 * Test pattern detector configuration
 */
function testPatternDetectorConfig() {
  console.log('\n⚙️  Testing Pattern Detector Configuration...');
  console.log('=' .repeat(50));
  
  // Get supported types
  const supportedTypes = patternDetector.getSupportedTypes();
  console.log('📋 Supported PII Types:');
  console.log(supportedTypes.join(', '));
  
  // Test pattern validation
  console.log('\n🧪 Testing Pattern Validation:');
  const testCases = [
    { text: '4111-1111-1111-1111', type: 'credit_card' as PIIType },
    { text: '(555) 123-4567', type: 'phone' as PIIType },
    { text: 'john@example.com', type: 'email' as PIIType },
    { text: '123-45-6789', type: 'ssn' as PIIType }
  ];
  
  testCases.forEach(testCase => {
    const isValid = patternDetector.validatePIIType(testCase.text, testCase.type);
    console.log(`   ${testCase.type}: "${testCase.text}" -> ${isValid ? '✅' : '❌'}`);
  });
}

/**
 * Test individual pattern types
 */
async function testIndividualPatterns() {
  console.log('\n🔍 Testing Individual Pattern Types...');
  console.log('=' .repeat(50));
  
  const patternTypes: PIIType[] = [
    'credit_card', 'phone', 'email', 'ssn', 'address', 
    'drivers_license', 'name', 'ip_address', 'mac_address'
  ];
  
  for (const patternType of patternTypes) {
    console.log(`\n🧪 Testing ${patternType} patterns:`);
    
    try {
      // Test validation for each type
      const testTexts = getTestTextsForType(patternType);
      console.log(`   📊 Testing ${testTexts.length} test cases for ${patternType}`);
      
      testTexts.forEach((testText, index) => {
        const isValid = patternDetector.validatePIIType(testText, patternType);
        console.log(`      ${index + 1}. "${testText}" -> ${isValid ? '✅' : '❌'}`);
      });
      
    } catch (error) {
      console.error(`   ❌ Error testing ${patternType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Get test texts for specific PII type
 */
function getTestTextsForType(type: PIIType): string[] {
  const testTexts = {
    credit_card: ['4111-1111-1111-1111', '5555-5555-5555-4444', '4532-1234-5678-9012'],
    phone: ['(555) 123-4567', '555.123.4567', '+1-555-123-4567'],
    email: ['test@example.com', 'user.name@company.co.uk', 'admin+tag@domain.org'],
    ssn: ['123-45-6789', '987-65-4321'],
    address: ['123 Main Street', '456 Oak Avenue', '789 Pine Road'],
    drivers_license: ['01-47-87441', 'CA1234567', 'NY9876543'],
    name: ['John Smith', 'Jane Doe', 'Robert Johnson'],
    ip_address: ['192.168.1.1', '10.0.0.1', '172.16.0.1'],
    mac_address: ['00:1B:44:11:3A:B7', '00-1B-44-11-3A-B7', '001B.4411.3AB7']
  };
  
  return testTexts[type as keyof typeof testTexts] || [];
}

/**
 * Main test function
 */
async function runPatternTests() {
  console.log('🚀 Starting Pattern Detector Tests...');
  console.log('=' .repeat(60));
  
  // Test configuration
  testPatternDetectorConfig();
  
  // Test individual patterns
  await testIndividualPatterns();
  
  // Test pattern detector
  await testPatternDetector();
  
  console.log('\n✅ All pattern detector tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runPatternTests().catch((error) => {
    console.error('❌ Pattern detector test execution failed:', error);
    process.exit(1);
  });
}

export { runPatternTests, testPatternDetector, testPatternDetectorConfig, testIndividualPatterns };
