/* eslint-disable no-console */
/**
 * Test file for Multi-Layer Detector
 * Tests the integrated multi-layer PII detection system
 */

import { multiLayerDetector } from './detectors/multi-layer-detector';

/**
 * Test data for multi-layer detection
 */
const multiLayerTestData = [
  {
    name: 'Simple Text Detection',
    text: 'Contact John Smith at john@company.com or call (555) 123-4567',
    expectedTypes: ['name', 'email', 'phone']
  },
  {
    name: 'Financial Information',
    text: 'Credit card: 4111-1111-1111-1111, SSN: 123-45-6789, Bank account: 1234567890',
    expectedTypes: ['credit_card', 'ssn', 'bank_account']
  },
  {
    name: 'Address and Contact',
    text: 'John Doe lives at 123 Main Street, Anytown, CA 90210. Email: john.doe@example.com',
    expectedTypes: ['name', 'address', 'email']
  },
  {
    name: 'Driver License Information',
    text: 'Hawaii Driver License: 01-47-87441, DOB: 06/03/1981, Name: McLOVIN',
    expectedTypes: ['drivers_license', 'name', 'date_of_birth']
  },
  {
    name: 'Technical Identifiers',
    text: 'IP: 192.168.1.1, MAC: 00:1B:44:11:3A:B7, VIN: 1HGBH41JXMN109186',
    expectedTypes: ['ip_address', 'mac_address', 'vehicle_vin']
  },
  {
    name: 'Medical Information',
    text: 'Patient ID: P12345, Insurance: INS987654, Prescription: RX123456',
    expectedTypes: ['patient_id', 'health_insurance', 'prescription_data']
  },
  {
    name: 'Complex Mixed Data',
    text: 'Dr. Sarah Johnson (sarah.j@medical.com) treated patient P789 at 456 Health Ave. Phone: (555) 987-6543. Insurance: MED123456',
    expectedTypes: ['name', 'email', 'patient_id', 'address', 'phone', 'health_insurance']
  }
];

/**
 * Test multi-layer detector
 */
async function testMultiLayerDetector() {
  console.log('\n🔍 Testing Multi-Layer Detector...');
  console.log('=' .repeat(50));
  
  for (const test of multiLayerTestData) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`📝 Input: "${test.text}"`);
    console.log(`🎯 Expected: ${test.expectedTypes.join(', ')}`);
    
    try {
      const startTime = Date.now();
      const result = await multiLayerDetector.detectPII(test.text);
      const processingTime = Date.now() - startTime;
      
      console.log(`⏱️  Processing time: ${processingTime}ms`);
      console.log(`📊 Found ${result.detections.length} detections:`);
      
      if (result.detections.length === 0) {
        console.log('   ❌ No detections found');
      } else {
        result.detections.forEach((detection, index) => {
          console.log(`   ${index + 1}. Type: ${detection.type}`);
          console.log(`      Text: "${detection.text}"`);
          console.log(`      Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
          console.log(`      Source: ${detection.source}`);
          console.log(`      Verified: ${detection.verified ? '✅' : '❌'}`);
        });
      }
      
      // Check if expected types were found
      const foundTypes = result.detections.map(d => d.type);
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
      
      // Show metadata
      console.log(`📈 Metadata:`);
      console.log(`   Total lines: ${result.metadata.totalLines}`);
      console.log(`   Total characters: ${result.metadata.totalCharacters}`);
      console.log(`   Detection sources: ${JSON.stringify(result.metadata.detectionSources)}`);
      
    } catch (error) {
      console.error(`❌ Error during test: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Test multi-layer detector configuration
 */
function testMultiLayerConfig() {
  console.log('\n⚙️  Testing Multi-Layer Detector Configuration...');
  console.log('=' .repeat(50));
  
  const config = multiLayerDetector.getConfig();
  console.log('📋 Configuration:');
  console.log(JSON.stringify(config, null, 2));
  
  // Test cache statistics
  const cacheStats = multiLayerDetector.getCacheStats();
  console.log('\n📊 Cache Statistics:');
  console.log(`   Cache size: ${cacheStats.size}`);
  
  // Test layer configuration
  console.log('\n🔧 Layer Configuration:');
  Object.entries(config.layers).forEach(([layer, layerConfig]) => {
    console.log(`   - ${layer}: ${layerConfig.enabled ? '✅' : '❌'} (priority: ${layerConfig.priority})`);
  });
}

/**
 * Test individual layers
 */
async function testIndividualLayers() {
  console.log('\n🔍 Testing Individual Layers...');
  console.log('=' .repeat(50));
  
  const testText = 'John Smith (john@company.com) lives at 123 Main Street, phone (555) 123-4567';
  
  console.log(`📝 Test text: "${testText}"`);
  
  // Test the main detection method
  console.log(`\n🧪 Testing main detection method:`);
  
  try {
    const startTime = Date.now();
    const result = await multiLayerDetector.detectPII(testText);
    const processingTime = Date.now() - startTime;
    
    console.log(`   ⏱️  Processing time: ${processingTime}ms`);
    console.log(`   📊 Found ${result.detections.length} detections`);
    console.log(`   ✅ Success: ${result.success}`);
    console.log(`   ❌ Errors: ${result.errors.length}`);
    
    if (result.detections.length > 0) {
      result.detections.forEach((detection, index) => {
        console.log(`      ${index + 1}. ${detection.type}: "${detection.text}" (${(detection.confidence * 100).toFixed(1)}%)`);
      });
    }
    
    // Show metadata
    console.log(`   📈 Metadata:`);
    console.log(`      Total lines: ${result.metadata.totalLines}`);
    console.log(`      Total characters: ${result.metadata.totalCharacters}`);
    console.log(`      Detection sources: ${JSON.stringify(result.metadata.detectionSources)}`);
    
  } catch (error) {
    console.error(`   ❌ Error testing main detection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test ensemble detection
 */
async function testEnsembleDetection() {
  console.log('\n🔍 Testing Ensemble Detection...');
  console.log('=' .repeat(50));
  
  const testText = 'Dr. Sarah Johnson (sarah@medical.com) treated patient P123 at 456 Health Ave. Phone: (555) 987-6543';
  
  console.log(`📝 Test text: "${testText}"`);
  
  try {
    const startTime = Date.now();
    const result = await multiLayerDetector.detectPII(testText);
    const processingTime = Date.now() - startTime;
    
    console.log(`⏱️  Processing time: ${processingTime}ms`);
    console.log(`📊 Found ${result.detections.length} detections:`);
    
    result.detections.forEach((detection, index) => {
      console.log(`   ${index + 1}. Type: ${detection.type}`);
      console.log(`      Text: "${detection.text}"`);
      console.log(`      Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
      console.log(`      Source: ${detection.source}`);
      console.log(`      Verified: ${detection.verified ? '✅' : '❌'}`);
    });
    
  } catch (error) {
    console.error(`❌ Error during ensemble test: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Test performance benchmarks
 */
async function testPerformanceBenchmarks() {
  console.log('\n⚡ Testing Performance Benchmarks...');
  console.log('=' .repeat(50));
  
  const testTexts = [
    'Simple: john@example.com',
    'Medium: John Smith (john@company.com) at 123 Main St, (555) 123-4567',
    'Complex: Dr. Sarah Johnson (sarah@medical.com) treated patient P123 at 456 Health Ave, phone (555) 987-6543, SSN 123-45-6789, credit card 4111-1111-1111-1111'
  ];
  
  for (const testText of testTexts) {
    console.log(`\n🧪 Testing: "${testText}"`);
    
    try {
      const startTime = Date.now();
      const result = await multiLayerDetector.detectPII(testText);
      const processingTime = Date.now() - startTime;
      
      console.log(`   ⏱️  Processing time: ${processingTime}ms`);
      console.log(`   📊 Detections: ${result.detections.length}`);
      console.log(`   📈 Characters per second: ${Math.round(testText.length / (processingTime / 1000))}`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Main test function
 */
async function runMultiLayerTests() {
  console.log('🚀 Starting Multi-Layer Detector Tests...');
  console.log('=' .repeat(60));
  
  // Test configuration
  testMultiLayerConfig();
  
  // Test individual layers
  await testIndividualLayers();
  
  // Test ensemble detection
  await testEnsembleDetection();
  
  // Test multi-layer detector
  await testMultiLayerDetector();
  
  // Test performance
  await testPerformanceBenchmarks();
  
  console.log('\n✅ All multi-layer detector tests completed!');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runMultiLayerTests().catch((error) => {
    console.error('❌ Multi-layer detector test execution failed:', error);
    process.exit(1);
  });
}

export { runMultiLayerTests, testMultiLayerDetector, testMultiLayerConfig, testIndividualLayers, testEnsembleDetection, testPerformanceBenchmarks };
