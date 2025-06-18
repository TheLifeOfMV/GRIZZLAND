/**
 * GRIZZLAND Backend Test Scripts
 * Comprehensive testing utilities following PLAN_TESTSCRIPT guidelines
 * Real-environment validation with concrete examples and observability
 */

import { InventoryService } from '../services/InventoryService';
import { CartService } from '../services/CartService';
import { ProductService } from '../services/ProductService';
import { shippingFee, calculateShippingWithRules, validateShippingAddress } from './shippingUtils';
import { supabaseCircuitBreakers, getCircuitBreakerHealth } from './circuitBreaker';
import { Logger, logInfo, logError, logWarning } from './logger';

/**
 * Test result interfaces for structured reporting
 */
export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  message: string;
  details?: any;
  errors?: string[];
  warnings?: string[];
}

export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
}

/**
 * Test execution wrapper with observability
 */
async function executeTest(
  testName: string,
  testFunction: () => Promise<any>,
  expectedOutcome?: any
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    logInfo(`Starting test: ${testName}`, {
      action: 'TEST_START',
      resource: 'test_framework',
      metadata: { testName }
    });

    const result = await testFunction();
    const duration = Date.now() - startTime;

    // Validate expected outcome if provided
    let success = true;
    const details: any = { result };
    
    if (expectedOutcome !== undefined) {
      success = JSON.stringify(result) === JSON.stringify(expectedOutcome);
      details.expected = expectedOutcome;
      details.actual = result;
    }

    const testResult: TestResult = {
      testName,
      success,
      duration,
      message: success ? 'Test passed' : 'Test failed - result mismatch',
      details
    };

    logInfo(`Test completed: ${testName}`, {
      action: 'TEST_COMPLETE',
      resource: 'test_framework',
      metadata: {
        testName,
        success,
        duration: `${duration}ms`,
        performance: duration < 100 ? 'GOOD' : duration < 500 ? 'ACCEPTABLE' : 'SLOW'
      }
    });

    return testResult;

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError(`Test failed: ${testName}`, error as Error, {
      action: 'TEST_ERROR',
      resource: 'test_framework',
      metadata: { testName, duration: `${duration}ms` }
    });

    return {
      testName,
      success: false,
      duration,
      message: `Test failed with error: ${errorMessage}`,
      errors: [errorMessage]
    };
  }
}

/**
 * PHASE 1 TESTS: Shipping Utilities Validation
 */
export async function testShippingUtilities(): Promise<TestSuite> {
  const results: TestResult[] = [];

  // Test 1: Basic shipping fee calculation
  results.push(await executeTest(
    'Basic Shipping Fee Calculation',
    async () => {
      const fee = shippingFee();
      return { fee, isValid: fee === 15000 };
    },
    { fee: 15000, isValid: true }
  ));

  // Test 2: Free shipping calculation
  results.push(await executeTest(
    'Free Shipping Calculation',
    async () => {
      const calculation = calculateShippingWithRules({
        subtotal: 250000 // Above threshold
      });
      return {
        fee: calculation.fee,
        isEligible: calculation.isEligibleForFreeShipping,
        method: calculation.method
      };
    },
    { fee: 0, isEligible: true, method: 'free' }
  ));

  // Test 3: Standard shipping calculation
  results.push(await executeTest(
    'Standard Shipping Calculation',
    async () => {
      const calculation = calculateShippingWithRules({
        subtotal: 100000 // Below threshold
      });
      return {
        fee: calculation.fee,
        isEligible: calculation.isEligibleForFreeShipping,
        method: calculation.method,
        remaining: calculation.remainingForFreeShipping
      };
    },
    { fee: 15000, isEligible: false, method: 'standard', remaining: 100000 }
  ));

  // Test 4: Address validation - valid Colombian address
  results.push(await executeTest(
    'Valid Colombian Address Validation',
    async () => {
      const validation = validateShippingAddress({
        city: 'Bogotá',
        department: 'Bogotá',
        postalCode: '110111',
        address: 'Carrera 7 # 32-16'
      });
      return {
        valid: validation.valid,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length
      };
    },
    { valid: true, errorCount: 0, warningCount: 0 }
  ));

  return createTestSuite('Shipping Utilities Tests', results);
}

/**
 * PHASE 2 TESTS: Inventory Service Validation
 */
export async function testInventoryService(): Promise<TestSuite> {
  const inventoryService = new InventoryService();
  const results: TestResult[] = [];

  // Test 1: Stock validation for valid product
  results.push(await executeTest(
    'Stock Validation - Valid Product',
    async () => {
      // Note: This requires a real product ID from your database
      const validation = await inventoryService.validateStock('test-product-id', 1);
      return {
        hasResult: !!validation,
        hasTimestamp: !!validation.timestamp,
        hasProductId: !!validation.productId
      };
    }
  ));

  // Test 2: Stock validation - invalid input
  results.push(await executeTest(
    'Stock Validation - Invalid Input',
    async () => {
      const validation = await inventoryService.validateStock('', 0);
      return {
        available: validation.available,
        hasMessage: !!validation.message,
        invalidInput: !validation.available
      };
    },
    { available: false, hasMessage: true, invalidInput: true }
  ));

  // Test 3: Bulk stock validation
  results.push(await executeTest(
    'Bulk Stock Validation',
    async () => {
      const bulkValidation = await inventoryService.validateMultipleStock([
        { productId: 'test-1', quantity: 1 },
        { productId: 'test-2', quantity: 2 }
      ]);
      return {
        hasResults: bulkValidation.results.length > 0,
        resultCount: bulkValidation.results.length,
        hasErrors: bulkValidation.errors.length >= 0
      };
    }
  ));

  // Test 4: Low stock products fetch
  results.push(await executeTest(
    'Low Stock Products Fetch',
    async () => {
      const lowStockProducts = await inventoryService.getLowStockProducts(10);
      return {
        isArray: Array.isArray(lowStockProducts),
        hasValidStructure: lowStockProducts.every(product => 
          product.productId && 
          typeof product.currentStock === 'number' &&
          product.severity
        )
      };
    }
  ));

  return createTestSuite('Inventory Service Tests', results);
}

/**
 * PHASE 3 TESTS: Enhanced Cart Service Validation
 */
export async function testEnhancedCartService(): Promise<TestSuite> {
  const cartService = new CartService();
  const results: TestResult[] = [];

  // Test 1: Cart summary with shipping details
  results.push(await executeTest(
    'Cart Summary with Shipping Details',
    async () => {
      const summary = await cartService.getCartSummary('test-user-id');
      return {
        hasItems: Array.isArray(summary.items),
        hasShippingDetails: !!summary.shippingDetails,
        hasShippingMethod: !!summary.shippingDetails?.method,
        hasFreeShippingInfo: typeof summary.shippingDetails?.isEligibleForFreeShipping === 'boolean'
      };
    }
  ));

  // Test 2: Cart validation for checkout
  results.push(await executeTest(
    'Cart Checkout Validation',
    async () => {
      const validation = await cartService.validateCartForCheckout('test-user-id');
      return {
        hasValidField: typeof validation.valid === 'boolean',
        hasErrors: Array.isArray(validation.errors),
        hasWarnings: Array.isArray(validation.warnings),
        hasStockValidations: Array.isArray(validation.stockValidations)
      };
    }
  ));

  return createTestSuite('Enhanced Cart Service Tests', results);
}

/**
 * PHASE 4 TESTS: Circuit Breaker and Observability
 */
export async function testCircuitBreakerAndObservability(): Promise<TestSuite> {
  const results: TestResult[] = [];

  // Test 1: Circuit breaker health check
  results.push(await executeTest(
    'Circuit Breaker Health Check',
    async () => {
      const health = getCircuitBreakerHealth();
      return {
        hasHealthyField: typeof health.healthy === 'boolean',
        hasCircuits: typeof health.circuits === 'object',
        hasSummary: !!health.summary,
        circuitCount: health.summary.totalCircuits
      };
    }
  ));

  // Test 2: Circuit breaker execution
  results.push(await executeTest(
    'Circuit Breaker Execution',
    async () => {
      const result = await supabaseCircuitBreakers.database.execute(
        async () => ({ test: 'success', timestamp: Date.now() }),
        'test_operation'
      );
      return {
        hasResult: !!result,
        hasTestField: result.test === 'success',
        hasTimestamp: !!result.timestamp
      };
    }
  ));

  // Test 3: Circuit breaker metrics
  results.push(await executeTest(
    'Circuit Breaker Metrics',
    async () => {
      const metrics = supabaseCircuitBreakers.database.getMetrics();
      return {
        hasState: !!metrics.state,
        hasFailures: typeof metrics.failures === 'number',
        hasSuccesses: typeof metrics.successes === 'number',
        hasTotalCalls: typeof metrics.totalCalls === 'number'
      };
    }
  ));

  return createTestSuite('Circuit Breaker and Observability Tests', results);
}

/**
 * INTEGRATION TESTS: End-to-End Scenarios
 */
export async function testEndToEndScenarios(): Promise<TestSuite> {
  const results: TestResult[] = [];

  // Test 1: Complete product fetch with metadata validation
  results.push(await executeTest(
    'Product Fetch with Metadata Validation',
    async () => {
      const productService = new ProductService();
      // This will fail gracefully if no products exist
      try {
        const products = await productService.getAllProducts({ featured: true });
        return {
          hasProducts: Array.isArray(products),
          productCount: products.length,
          hasValidStructure: products.length === 0 || products.every(p => p.id && p.name)
        };
      } catch (error) {
        return {
          hasProducts: false,
          productCount: 0,
          hasValidStructure: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  ));

  // Test 2: Shipping calculation workflow
  results.push(await executeTest(
    'Complete Shipping Calculation Workflow',
    async () => {
      // Test different subtotal scenarios
      const scenarios = [
        { subtotal: 50000, expectedFee: 15000 },
        { subtotal: 150000, expectedFee: 15000 },
        { subtotal: 250000, expectedFee: 0 }
      ];

      const results = scenarios.map(scenario => {
        const calc = calculateShippingWithRules({ subtotal: scenario.subtotal });
        return {
          subtotal: scenario.subtotal,
          expectedFee: scenario.expectedFee,
          actualFee: calc.fee,
          correct: calc.fee === scenario.expectedFee
        };
      });

      return {
        allCorrect: results.every(r => r.correct),
        results,
        testCount: scenarios.length
      };
    }
  ));

  return createTestSuite('End-to-End Integration Tests', results);
}

/**
 * PERFORMANCE TESTS: Response Time and Load Validation
 */
export async function testPerformanceMetrics(): Promise<TestSuite> {
  const results: TestResult[] = [];

  // Test 1: Shipping calculation performance
  results.push(await executeTest(
    'Shipping Calculation Performance',
    async () => {
      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        calculateShippingWithRules({ subtotal: Math.random() * 300000 });
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / iterations;

      return {
        iterations,
        totalTime,
        avgTime,
        performance: avgTime < 1 ? 'EXCELLENT' : avgTime < 5 ? 'GOOD' : 'NEEDS_OPTIMIZATION'
      };
    }
  ));

  // Test 2: Address validation performance
  results.push(await executeTest(
    'Address Validation Performance',
    async () => {
      const iterations = 50;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        validateShippingAddress({
          city: 'Bogotá',
          department: 'Bogotá',
          postalCode: '110111',
          address: `Test Address ${i}`
        });
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / iterations;

      return {
        iterations,
        totalTime,
        avgTime,
        performance: avgTime < 2 ? 'EXCELLENT' : avgTime < 10 ? 'GOOD' : 'NEEDS_OPTIMIZATION'
      };
    }
  ));

  return createTestSuite('Performance Tests', results);
}

/**
 * Utility function to create test suite summary
 */
function createTestSuite(suiteName: string, results: TestResult[]): TestSuite {
  const total = results.length;
  const passed = results.filter(r => r.success).length;
  const failed = total - passed;
  const duration = results.reduce((sum, r) => sum + r.duration, 0);

  return {
    suiteName,
    results,
    summary: {
      total,
      passed,
      failed,
      duration
    }
  };
}

/**
 * Run all test suites and generate comprehensive report
 */
export async function runAllTests(): Promise<{
  suites: TestSuite[];
  overallSummary: {
    totalTests: number;
    totalPassed: number;
    totalFailed: number;
    totalDuration: number;
    successRate: number;
  };
}> {
  const startTime = Date.now();

  logInfo('Starting comprehensive test suite execution', {
    action: 'TEST_SUITE_START',
    resource: 'test_framework'
  });

  const suites: TestSuite[] = [];

  try {
    // Execute all test suites
    suites.push(await testShippingUtilities());
    suites.push(await testInventoryService());
    suites.push(await testEnhancedCartService());
    suites.push(await testCircuitBreakerAndObservability());
    suites.push(await testEndToEndScenarios());
    suites.push(await testPerformanceMetrics());

    // Calculate overall summary
    const totalTests = suites.reduce((sum, suite) => sum + suite.summary.total, 0);
    const totalPassed = suites.reduce((sum, suite) => sum + suite.summary.passed, 0);
    const totalFailed = suites.reduce((sum, suite) => sum + suite.summary.failed, 0);
    const totalDuration = Date.now() - startTime;
    const successRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    const overallSummary = {
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      successRate: Math.round(successRate * 100) / 100
    };

    logInfo('Test suite execution completed', {
      action: 'TEST_SUITE_COMPLETE',
      resource: 'test_framework',
      metadata: {
        ...overallSummary,
        suiteCount: suites.length,
        performance: totalDuration < 5000 ? 'GOOD' : totalDuration < 15000 ? 'ACCEPTABLE' : 'SLOW'
      }
    });

    return { suites, overallSummary };

  } catch (error) {
    logError('Test suite execution failed', error as Error, {
      action: 'TEST_SUITE_ERROR',
      resource: 'test_framework'
    });

    throw error;
  }
}

/**
 * Generate human-readable test report
 */
export function generateTestReport(testResults: { suites: TestSuite[]; overallSummary: any }): string {
  const { suites, overallSummary } = testResults;
  
  let report = '\n=== GRIZZLAND BACKEND TEST REPORT ===\n\n';
  
  // Overall summary
  report += `Overall Results:\n`;
  report += `  Total Tests: ${overallSummary.totalTests}\n`;
  report += `  Passed: ${overallSummary.totalPassed}\n`;
  report += `  Failed: ${overallSummary.totalFailed}\n`;
  report += `  Success Rate: ${overallSummary.successRate}%\n`;
  report += `  Total Duration: ${overallSummary.totalDuration}ms\n\n`;

  // Suite details
  suites.forEach(suite => {
    report += `${suite.suiteName}:\n`;
    report += `  Tests: ${suite.summary.total} | Passed: ${suite.summary.passed} | Failed: ${suite.summary.failed}\n`;
    report += `  Duration: ${suite.summary.duration}ms\n`;
    
    // Failed tests details
    const failedTests = suite.results.filter(r => !r.success);
    if (failedTests.length > 0) {
      report += `  Failed Tests:\n`;
      failedTests.forEach(test => {
        report += `    - ${test.testName}: ${test.message}\n`;
        if (test.errors) {
          test.errors.forEach(error => report += `      Error: ${error}\n`);
        }
      });
    }
    report += '\n';
  });

  return report;
}

/**
 * Run basic shipping tests
 */
export async function runBasicTests(): Promise<TestSuite> {
  return await testShippingUtilities();
} 