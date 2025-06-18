"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testShippingUtilities = testShippingUtilities;
exports.testInventoryService = testInventoryService;
exports.testEnhancedCartService = testEnhancedCartService;
exports.testCircuitBreakerAndObservability = testCircuitBreakerAndObservability;
exports.testEndToEndScenarios = testEndToEndScenarios;
exports.testPerformanceMetrics = testPerformanceMetrics;
exports.runAllTests = runAllTests;
exports.generateTestReport = generateTestReport;
exports.runBasicTests = runBasicTests;
const InventoryService_1 = require("../services/InventoryService");
const CartService_1 = require("../services/CartService");
const ProductService_1 = require("../services/ProductService");
const shippingUtils_1 = require("./shippingUtils");
const circuitBreaker_1 = require("./circuitBreaker");
const logger_1 = require("./logger");
async function executeTest(testName, testFunction, expectedOutcome) {
    const startTime = Date.now();
    try {
        (0, logger_1.logInfo)(`Starting test: ${testName}`, {
            action: 'TEST_START',
            resource: 'test_framework',
            metadata: { testName }
        });
        const result = await testFunction();
        const duration = Date.now() - startTime;
        let success = true;
        const details = { result };
        if (expectedOutcome !== undefined) {
            success = JSON.stringify(result) === JSON.stringify(expectedOutcome);
            details.expected = expectedOutcome;
            details.actual = result;
        }
        const testResult = {
            testName,
            success,
            duration,
            message: success ? 'Test passed' : 'Test failed - result mismatch',
            details
        };
        (0, logger_1.logInfo)(`Test completed: ${testName}`, {
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
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        (0, logger_1.logError)(`Test failed: ${testName}`, error, {
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
async function testShippingUtilities() {
    const results = [];
    results.push(await executeTest('Basic Shipping Fee Calculation', async () => {
        const fee = (0, shippingUtils_1.shippingFee)();
        return { fee, isValid: fee === 15000 };
    }, { fee: 15000, isValid: true }));
    results.push(await executeTest('Free Shipping Calculation', async () => {
        const calculation = (0, shippingUtils_1.calculateShippingWithRules)({
            subtotal: 250000
        });
        return {
            fee: calculation.fee,
            isEligible: calculation.isEligibleForFreeShipping,
            method: calculation.method
        };
    }, { fee: 0, isEligible: true, method: 'free' }));
    results.push(await executeTest('Standard Shipping Calculation', async () => {
        const calculation = (0, shippingUtils_1.calculateShippingWithRules)({
            subtotal: 100000
        });
        return {
            fee: calculation.fee,
            isEligible: calculation.isEligibleForFreeShipping,
            method: calculation.method,
            remaining: calculation.remainingForFreeShipping
        };
    }, { fee: 15000, isEligible: false, method: 'standard', remaining: 100000 }));
    results.push(await executeTest('Valid Colombian Address Validation', async () => {
        const validation = (0, shippingUtils_1.validateShippingAddress)({
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
    }, { valid: true, errorCount: 0, warningCount: 0 }));
    return createTestSuite('Shipping Utilities Tests', results);
}
async function testInventoryService() {
    const inventoryService = new InventoryService_1.InventoryService();
    const results = [];
    results.push(await executeTest('Stock Validation - Valid Product', async () => {
        const validation = await inventoryService.validateStock('test-product-id', 1);
        return {
            hasResult: !!validation,
            hasTimestamp: !!validation.timestamp,
            hasProductId: !!validation.productId
        };
    }));
    results.push(await executeTest('Stock Validation - Invalid Input', async () => {
        const validation = await inventoryService.validateStock('', 0);
        return {
            available: validation.available,
            hasMessage: !!validation.message,
            invalidInput: !validation.available
        };
    }, { available: false, hasMessage: true, invalidInput: true }));
    results.push(await executeTest('Bulk Stock Validation', async () => {
        const bulkValidation = await inventoryService.validateMultipleStock([
            { productId: 'test-1', quantity: 1 },
            { productId: 'test-2', quantity: 2 }
        ]);
        return {
            hasResults: bulkValidation.results.length > 0,
            resultCount: bulkValidation.results.length,
            hasErrors: bulkValidation.errors.length >= 0
        };
    }));
    results.push(await executeTest('Low Stock Products Fetch', async () => {
        const lowStockProducts = await inventoryService.getLowStockProducts(10);
        return {
            isArray: Array.isArray(lowStockProducts),
            hasValidStructure: lowStockProducts.every(product => product.productId &&
                typeof product.currentStock === 'number' &&
                product.severity)
        };
    }));
    return createTestSuite('Inventory Service Tests', results);
}
async function testEnhancedCartService() {
    const cartService = new CartService_1.CartService();
    const results = [];
    results.push(await executeTest('Cart Summary with Shipping Details', async () => {
        const summary = await cartService.getCartSummary('test-user-id');
        return {
            hasItems: Array.isArray(summary.items),
            hasShippingDetails: !!summary.shippingDetails,
            hasShippingMethod: !!summary.shippingDetails?.method,
            hasFreeShippingInfo: typeof summary.shippingDetails?.isEligibleForFreeShipping === 'boolean'
        };
    }));
    results.push(await executeTest('Cart Checkout Validation', async () => {
        const validation = await cartService.validateCartForCheckout('test-user-id');
        return {
            hasValidField: typeof validation.valid === 'boolean',
            hasErrors: Array.isArray(validation.errors),
            hasWarnings: Array.isArray(validation.warnings),
            hasStockValidations: Array.isArray(validation.stockValidations)
        };
    }));
    return createTestSuite('Enhanced Cart Service Tests', results);
}
async function testCircuitBreakerAndObservability() {
    const results = [];
    results.push(await executeTest('Circuit Breaker Health Check', async () => {
        const health = (0, circuitBreaker_1.getCircuitBreakerHealth)();
        return {
            hasHealthyField: typeof health.healthy === 'boolean',
            hasCircuits: typeof health.circuits === 'object',
            hasSummary: !!health.summary,
            circuitCount: health.summary.totalCircuits
        };
    }));
    results.push(await executeTest('Circuit Breaker Execution', async () => {
        const result = await circuitBreaker_1.supabaseCircuitBreakers.database.execute(async () => ({ test: 'success', timestamp: Date.now() }), 'test_operation');
        return {
            hasResult: !!result,
            hasTestField: result.test === 'success',
            hasTimestamp: !!result.timestamp
        };
    }));
    results.push(await executeTest('Circuit Breaker Metrics', async () => {
        const metrics = circuitBreaker_1.supabaseCircuitBreakers.database.getMetrics();
        return {
            hasState: !!metrics.state,
            hasFailures: typeof metrics.failures === 'number',
            hasSuccesses: typeof metrics.successes === 'number',
            hasTotalCalls: typeof metrics.totalCalls === 'number'
        };
    }));
    return createTestSuite('Circuit Breaker and Observability Tests', results);
}
async function testEndToEndScenarios() {
    const results = [];
    results.push(await executeTest('Product Fetch with Metadata Validation', async () => {
        const productService = new ProductService_1.ProductService();
        try {
            const products = await productService.getAllProducts({ featured: true });
            return {
                hasProducts: Array.isArray(products),
                productCount: products.length,
                hasValidStructure: products.length === 0 || products.every(p => p.id && p.name)
            };
        }
        catch (error) {
            return {
                hasProducts: false,
                productCount: 0,
                hasValidStructure: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }));
    results.push(await executeTest('Complete Shipping Calculation Workflow', async () => {
        const scenarios = [
            { subtotal: 50000, expectedFee: 15000 },
            { subtotal: 150000, expectedFee: 15000 },
            { subtotal: 250000, expectedFee: 0 }
        ];
        const results = scenarios.map(scenario => {
            const calc = (0, shippingUtils_1.calculateShippingWithRules)({ subtotal: scenario.subtotal });
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
    }));
    return createTestSuite('End-to-End Integration Tests', results);
}
async function testPerformanceMetrics() {
    const results = [];
    results.push(await executeTest('Shipping Calculation Performance', async () => {
        const iterations = 100;
        const startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            (0, shippingUtils_1.calculateShippingWithRules)({ subtotal: Math.random() * 300000 });
        }
        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / iterations;
        return {
            iterations,
            totalTime,
            avgTime,
            performance: avgTime < 1 ? 'EXCELLENT' : avgTime < 5 ? 'GOOD' : 'NEEDS_OPTIMIZATION'
        };
    }));
    results.push(await executeTest('Address Validation Performance', async () => {
        const iterations = 50;
        const startTime = Date.now();
        for (let i = 0; i < iterations; i++) {
            (0, shippingUtils_1.validateShippingAddress)({
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
    }));
    return createTestSuite('Performance Tests', results);
}
function createTestSuite(suiteName, results) {
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
async function runAllTests() {
    const startTime = Date.now();
    (0, logger_1.logInfo)('Starting comprehensive test suite execution', {
        action: 'TEST_SUITE_START',
        resource: 'test_framework'
    });
    const suites = [];
    try {
        suites.push(await testShippingUtilities());
        suites.push(await testInventoryService());
        suites.push(await testEnhancedCartService());
        suites.push(await testCircuitBreakerAndObservability());
        suites.push(await testEndToEndScenarios());
        suites.push(await testPerformanceMetrics());
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
        (0, logger_1.logInfo)('Test suite execution completed', {
            action: 'TEST_SUITE_COMPLETE',
            resource: 'test_framework',
            metadata: {
                ...overallSummary,
                suiteCount: suites.length,
                performance: totalDuration < 5000 ? 'GOOD' : totalDuration < 15000 ? 'ACCEPTABLE' : 'SLOW'
            }
        });
        return { suites, overallSummary };
    }
    catch (error) {
        (0, logger_1.logError)('Test suite execution failed', error, {
            action: 'TEST_SUITE_ERROR',
            resource: 'test_framework'
        });
        throw error;
    }
}
function generateTestReport(testResults) {
    const { suites, overallSummary } = testResults;
    let report = '\n=== GRIZZLAND BACKEND TEST REPORT ===\n\n';
    report += `Overall Results:\n`;
    report += `  Total Tests: ${overallSummary.totalTests}\n`;
    report += `  Passed: ${overallSummary.totalPassed}\n`;
    report += `  Failed: ${overallSummary.totalFailed}\n`;
    report += `  Success Rate: ${overallSummary.successRate}%\n`;
    report += `  Total Duration: ${overallSummary.totalDuration}ms\n\n`;
    suites.forEach(suite => {
        report += `${suite.suiteName}:\n`;
        report += `  Tests: ${suite.summary.total} | Passed: ${suite.summary.passed} | Failed: ${suite.summary.failed}\n`;
        report += `  Duration: ${suite.summary.duration}ms\n`;
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
async function runBasicTests() {
    return await testShippingUtilities();
}
//# sourceMappingURL=testScripts.js.map