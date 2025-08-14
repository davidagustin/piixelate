/* eslint-disable no-console */
/**
 * Test file for Specialized Detectors
 * Tests domain-specific PII detection capabilities
 */

import { specializedDetector } from './detectors/specialized-detectors';

/**
 * Test specialized detector configuration
 */
function testSpecializedConfig() {
  console.log('\n⚙️  Testing Specialized Detector Configuration...');
  console.log('=' .repeat(50));
  
  // Test if specialized detection is available
  const isAvailable = specializedDetector.isAvailable();
  console.log(`📋 Specialized Detection Available: ${isAvailable ? '✅' : '❌'}`);
  
  // Test individual detection methods
  console.log('\n🧪 Testing Individual Detection Methods:');
  
  const testText = 'Patient ID: P12345, Insurance: INS987654, Prescription: RX123456';
  const ocrResult = {
    text: testText,
    lines: [{
      text: testText,
      bbox: { x0: 0, y0: 0, x1: testText.length * 10, y1: 30 }
    }],
    confidence: 0.95,
    processingTime: 0
  };
  
  // Test document regions
  try {
    const documentDetections = specializedDetector.detectDocumentRegions(ocrResult);
    console.log(`   📄 Document Regions: ${documentDetections.length} detections`);
  } catch (error) {
    console.log(`   ❌ Document Regions: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Test numerical data
  try {
    const numericalDetections = specializedDetector.detectNumericalData(ocrResult);
    console.log(`   🔢 Numerical Data: ${numericalDetections.length} detections`);
  } catch (error) {
    console.log(`   ❌ Numerical Data: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Test sensitive data
  try {
    const sensitiveDetections = specializedDetector.detectSensitiveData(ocrResult);
    console.log(`   🔒 Sensitive Data: ${sensitiveDetections.length} detections`);
  } catch (error) {
    console.log(`   ❌ Sensitive Data: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Test barcodes
  try {
    const barcodeDetections = specializedDetector.detectBarcodes(ocrResult);
    console.log(`   📊 Barcodes: ${barcodeDetections.length} detections`);
  } catch (error) {
    console.log(`   ❌ Barcodes: Error - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test specialized detector with different document types
 */
async function testDocumentTypes() {
  console.log('\n🔍 Testing Document Types...');
  console.log('=' .repeat(50));
  
  const testCases = [
    {
      name: 'Medical Document',
      text: 'Patient ID: P12345, Insurance: INS987654, Prescription: RX123456, DOB: 06/03/1981'
    },
    {
      name: 'Driver License',
      text: 'Hawaii Driver License: 01-47-87441, DOB: 06/03/1981, Name: McLOVIN'
    },
    {
      name: 'Credit Card',
      text: 'VISA Credit Card: 4111-1111-1111-1111, Expires: 12/25, CVV: 123'
    },
    {
      name: 'Financial Document',
      text: 'Account: 1234567890, Routing: 021000021, Tax ID: 12-3456789'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Text: "${testCase.text}"`);
    
    const ocrResult = {
      text: testCase.text,
      lines: [{
        text: testCase.text,
        bbox: { x0: 0, y0: 0, x1: testCase.text.length * 10, y1: 30 }
      }],
      confidence: 0.95,
      processingTime: 0
    };
    
    try {
      const startTime = Date.now();
      const allDetections = await specializedDetector.runAllSpecializedDetections(ocrResult);
      const processingTime = Date.now() - startTime;
      
      console.log(`⏱️  Processing time: ${processingTime}ms`);
      console.log(`📊 Found ${allDetections.length} detections:`);
      
      if (allDetections.length > 0) {
        allDetections.forEach((detection, index) => {
          console.log(`   ${index + 1}. Type: ${detection.type}`);
          console.log(`      Text: "${detection.text}"`);
          console.log(`      Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
          console.log(`      Source: ${detection.source}`);
        });
      } else {
        console.log('   ❌ No detections found');
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Test specialized detector performance
 */
async function testSpecializedPerformance() {
  console.log('\n⚡ Testing Specialized Detector Performance...');
  console.log('=' .repeat(50));
  
  const performanceTests = [
    {
      name: 'Simple Medical',
      text: 'Patient ID: P12345',
      expectedTime: 100
    },
    {
      name: 'Complex Medical',
      text: 'Patient ID: P12345, Insurance: INS987654, Prescription: RX123456, DOB: 06/03/1981, Medical Record: MR789012',
      expectedTime: 200
    },
    {
      name: 'Mixed Document',
      text: 'Patient ID: P12345, Account: 1234567890, Passport: A12345678, IP: 192.168.1.1, BTC: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      expectedTime: 300
    }
  ];
  
  for (const test of performanceTests) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   📝 Text length: ${test.text.length} characters`);
    
    const ocrResult = {
      text: test.text,
      lines: [{
        text: test.text,
        bbox: { x0: 0, y0: 0, x1: test.text.length * 10, y1: 30 }
      }],
      confidence: 0.95,
      processingTime: 0
    };
    
    try {
      const startTime = Date.now();
      const detections = await specializedDetector.runAllSpecializedDetections(ocrResult);
      const processingTime = Date.now() - startTime;
      
      console.log(`   ⏱️  Processing time: ${processingTime}ms`);
      console.log(`   📊 Detections: ${detections.length}`);
      console.log(`   📈 Characters per second: ${Math.round(test.text.length / (processingTime / 1000))}`);
      
      if (processingTime > test.expectedTime) {
        console.log(`   ⚠️  Performance warning: Expected <${test.expectedTime}ms, got ${processingTime}ms`);
      } else {
        console.log(`   ✅ Performance OK: ${processingTime}ms < ${test.expectedTime}ms`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Main test function
 */
async function runSpecializedTests() {
  console.log('🚀 Starting Specialized Detector Tests...');
  console.log('=' .repeat(60));
  
  // Test configuration
  testSpecializedConfig();
  
  // Test document types
  await testDocumentTypes();
  
  // Test performance
  await testSpecializedPerformance();
  
  console.log('\n✅ All specialized detector tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runSpecializedTests().catch((error) => {
    console.error('❌ Specialized detector test execution failed:', error);
    process.exit(1);
  });
}

export { runSpecializedTests, testSpecializedConfig, testDocumentTypes, testSpecializedPerformance };
