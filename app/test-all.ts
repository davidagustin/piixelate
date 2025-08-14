/* eslint-disable no-console */
/**
 * Comprehensive Test Runner for PII Detection System
 * Runs all tests across all detection modules
 */

import { runTests as runLLMTests } from './test-llm';
import { runPatternTests } from './test-pattern-detector';
import { runMultiLayerTests } from './test-multi-layer-detector';
import { runSpecializedTests } from './test-specialized-detectors';

/**
 * Test results summary
 */
interface TestSummary {
  module: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  detections: number;
  errors: number;
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 Starting Comprehensive PII Detection System Tests...');
  console.log('=' .repeat(80));
  console.log('📋 Testing all detection modules:');
  console.log('   - Enhanced LLM Detector');
  console.log('   - Pattern Detector');
  console.log('   - Multi-Layer Detector');
  console.log('   - Specialized Detectors');
  console.log('=' .repeat(80));
  
  const results: TestSummary[] = [];
  const startTime = Date.now();
  
  // Test 1: Enhanced LLM Detector
  console.log('\n🔍 Testing Enhanced LLM Detector...');
  console.log('=' .repeat(50));
  const llmStartTime = Date.now();
  try {
    await runLLMTests();
    const llmDuration = Date.now() - llmStartTime;
    results.push({
      module: 'Enhanced LLM Detector',
      status: 'passed',
      duration: llmDuration,
      detections: 0, // Will be calculated from test output
      errors: 0
    });
    console.log(`✅ Enhanced LLM Detector tests completed in ${llmDuration}ms`);
  } catch (error) {
    const llmDuration = Date.now() - llmStartTime;
    results.push({
      module: 'Enhanced LLM Detector',
      status: 'failed',
      duration: llmDuration,
      detections: 0,
      errors: 1
    });
    console.error(`❌ Enhanced LLM Detector tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Test 2: Pattern Detector
  console.log('\n🔍 Testing Pattern Detector...');
  console.log('=' .repeat(50));
  const patternStartTime = Date.now();
  try {
    await runPatternTests();
    const patternDuration = Date.now() - patternStartTime;
    results.push({
      module: 'Pattern Detector',
      status: 'passed',
      duration: patternDuration,
      detections: 0,
      errors: 0
    });
    console.log(`✅ Pattern Detector tests completed in ${patternDuration}ms`);
  } catch (error) {
    const patternDuration = Date.now() - patternStartTime;
    results.push({
      module: 'Pattern Detector',
      status: 'failed',
      duration: patternDuration,
      detections: 0,
      errors: 1
    });
    console.error(`❌ Pattern Detector tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Test 3: Multi-Layer Detector
  console.log('\n🔍 Testing Multi-Layer Detector...');
  console.log('=' .repeat(50));
  const multiLayerStartTime = Date.now();
  try {
    await runMultiLayerTests();
    const multiLayerDuration = Date.now() - multiLayerStartTime;
    results.push({
      module: 'Multi-Layer Detector',
      status: 'passed',
      duration: multiLayerDuration,
      detections: 0,
      errors: 0
    });
    console.log(`✅ Multi-Layer Detector tests completed in ${multiLayerDuration}ms`);
  } catch (error) {
    const multiLayerDuration = Date.now() - multiLayerStartTime;
    results.push({
      module: 'Multi-Layer Detector',
      status: 'failed',
      duration: multiLayerDuration,
      detections: 0,
      errors: 1
    });
    console.error(`❌ Multi-Layer Detector tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Test 4: Specialized Detectors
  console.log('\n🔍 Testing Specialized Detectors...');
  console.log('=' .repeat(50));
  const specializedStartTime = Date.now();
  try {
    await runSpecializedTests();
    const specializedDuration = Date.now() - specializedStartTime;
    results.push({
      module: 'Specialized Detectors',
      status: 'passed',
      duration: specializedDuration,
      detections: 0,
      errors: 0
    });
    console.log(`✅ Specialized Detectors tests completed in ${specializedDuration}ms`);
  } catch (error) {
    const specializedDuration = Date.now() - specializedStartTime;
    results.push({
      module: 'Specialized Detectors',
      status: 'failed',
      duration: specializedDuration,
      detections: 0,
      errors: 1
    });
    console.error(`❌ Specialized Detectors tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  // Generate summary report
  const totalDuration = Date.now() - startTime;
  console.log('\n📊 Test Summary Report');
  console.log('=' .repeat(80));
  
  let passedTests = 0;
  let failedTests = 0;
  let totalErrors = 0;
  let totalDetections = 0;
  
  results.forEach(result => {
    const statusIcon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${result.module}:`);
    console.log(`   Status: ${result.status.toUpperCase()}`);
    console.log(`   Duration: ${result.duration}ms`);
    console.log(`   Detections: ${result.detections}`);
    console.log(`   Errors: ${result.errors}`);
    console.log('');
    
    if (result.status === 'passed') passedTests++;
    if (result.status === 'failed') failedTests++;
    totalErrors += result.errors;
    totalDetections += result.detections;
  });
  
  console.log('📈 Overall Statistics:');
  console.log(`   Total Duration: ${totalDuration}ms`);
  console.log(`   Tests Passed: ${passedTests}/${results.length}`);
  console.log(`   Tests Failed: ${failedTests}/${results.length}`);
  console.log(`   Success Rate: ${((passedTests / results.length) * 100).toFixed(1)}%`);
  console.log(`   Total Errors: ${totalErrors}`);
  console.log(`   Total Detections: ${totalDetections}`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! PII Detection System is working correctly.');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed. Please review the errors above.`);
  }
  
  console.log('\n✅ Comprehensive test suite completed!');
  
  return {
    results,
    summary: {
      totalDuration,
      passedTests,
      failedTests,
      totalErrors,
      totalDetections,
      successRate: (passedTests / results.length) * 100
    }
  };
}

/**
 * Run specific test module
 */
async function runSpecificTest(moduleName: string) {
  console.log(`🔍 Running specific test: ${moduleName}`);
  
  switch (moduleName.toLowerCase()) {
    case 'llm':
    case 'enhanced-llm':
      await runLLMTests();
      break;
    case 'pattern':
    case 'pattern-detector':
      await runPatternTests();
      break;
    case 'multi-layer':
    case 'multi-layer-detector':
      await runMultiLayerTests();
      break;
    case 'specialized':
    case 'specialized-detectors':
      await runSpecializedTests();
      break;
    default:
      console.error(`❌ Unknown test module: ${moduleName}`);
      console.log('Available modules: llm, pattern, multi-layer, specialized');
      process.exit(1);
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const args = process.argv.slice(2);
  
  if (args.length > 0 && args[0]) {
    // Run specific test module
    runSpecificTest(args[0]).catch((error) => {
      console.error('❌ Specific test execution failed:', error);
      process.exit(1);
    });
  } else {
    // Run all tests
    runAllTests().catch((error) => {
      console.error('❌ Comprehensive test execution failed:', error);
      process.exit(1);
    });
  }
}

export { runAllTests, runSpecificTest };
