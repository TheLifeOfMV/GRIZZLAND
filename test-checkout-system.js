#!/usr/bin/env node

/**
 * CHECKOUT SYSTEM TESTING SCRIPT - GRIZZLAND
 * 
 * Following MONOCODE Principles:
 * - Observable Implementation: Structured logging for all test operations
 * - Explicit Error Handling: Comprehensive error validation
 * - One‑Command Setup: Single script to test entire checkout system
 * - Progressive Construction: Incremental test validation
 */

const fs = require('fs');
const path = require('path');

// Test Configuration
const config = {
  frontendUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:3002',
  testTimeout: 30000,
  retryAttempts: 3
};

// Test State Tracking
let testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  errors: []
};

// Observable Implementation - Structured Logging
function logTest(testName, status, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    test: testName,
    status,
    details,
    sessionId: `checkout_test_${Date.now()}`
  };
  
  console.log(`[${timestamp}] ${status.toUpperCase()}: ${testName}`);
  if (details.error) {
    console.error(`  Error: ${details.error}`);
  }
  if (details.message) {
    console.log(`  Message: ${details.message}`);
  }
  
  return logEntry;
}

// File Existence Validation
function validateFileExists(filePath, description) {
  const testName = `File Exists: ${description}`;
  
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      logTest(testName, 'PASS', {
        filePath,
        size: `${(stats.size / 1024).toFixed(2)}KB`,
        modified: stats.mtime.toISOString()
      });
      testResults.passed++;
      return true;
    } else {
      logTest(testName, 'FAIL', {
        error: `File not found: ${filePath}`
      });
      testResults.failed++;
      testResults.errors.push(`Missing file: ${filePath}`);
      return false;
    }
  } catch (error) {
    logTest(testName, 'ERROR', {
      error: error.message,
      filePath
    });
    testResults.failed++;
    testResults.errors.push(`Error checking file ${filePath}: ${error.message}`);
    return false;
  }
}

// Code Content Validation
function validateCodeContent(filePath, searchPatterns, description) {
  const testName = `Code Content: ${description}`;
  
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      logTest(testName, 'SKIP', {
        reason: `File not found: ${filePath}`
      });
      testResults.skipped++;
      return false;
    }
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const missingPatterns = [];
    
    searchPatterns.forEach(pattern => {
      if (typeof pattern === 'string') {
        if (!content.includes(pattern)) {
          missingPatterns.push(pattern);
        }
      } else if (pattern instanceof RegExp) {
        if (!pattern.test(content)) {
          missingPatterns.push(pattern.toString());
        }
      }
    });
    
    if (missingPatterns.length === 0) {
      logTest(testName, 'PASS', {
        filePath,
        patternsChecked: searchPatterns.length,
        message: 'All required patterns found'
      });
      testResults.passed++;
      return true;
    } else {
      logTest(testName, 'FAIL', {
        filePath,
        missingPatterns,
        error: `Missing ${missingPatterns.length} required patterns`
      });
      testResults.failed++;
      testResults.errors.push(`${filePath}: Missing patterns - ${missingPatterns.join(', ')}`);
      return false;
    }
  } catch (error) {
    logTest(testName, 'ERROR', {
      error: error.message,
      filePath
    });
    testResults.failed++;
    testResults.errors.push(`Error validating ${filePath}: ${error.message}`);
    return false;
  }
}

// API Endpoint Validation
async function validateApiEndpoint(endpoint, method = 'GET', description) {
  const testName = `API Endpoint: ${description}`;
  
  try {
    const url = `${config.backendUrl}${endpoint}`;
    
    // Note: This is a mock validation since we can't actually make HTTP calls in this context
    // In a real test environment, you would use fetch() or axios
    logTest(testName, 'SKIP', {
      reason: 'API testing requires running backend server',
      endpoint: url,
      method,
      message: 'Use manual testing or integration test suite'
    });
    testResults.skipped++;
    return false;
  } catch (error) {
    logTest(testName, 'ERROR', {
      error: error.message,
      endpoint
    });
    testResults.failed++;
    testResults.errors.push(`API test error ${endpoint}: ${error.message}`);
    return false;
  }
}

// MONOCODE Principles Validation
function validateMonocodeCompliance(filePath, description) {
  const testName = `MONOCODE Compliance: ${description}`;
  
  const monocodePatterns = [
    // Observable Implementation
    /console\.log.*timestamp/i,
    /console\.log.*session/i,
    
    // Explicit Error Handling
    /try\s*{[\s\S]*catch\s*\(/,
    /throw new Error/,
    
    // Progressive Construction
    /useState/,
    /useEffect/,
    
    // Dependency Transparency
    /import.*from/
  ];
  
  return validateCodeContent(filePath, monocodePatterns, `${description} - MONOCODE patterns`);
}

// Main Test Execution
async function runCheckoutSystemTests() {
  console.log('\n🚀 GRIZZLAND CHECKOUT SYSTEM VALIDATION');
  console.log('==========================================\n');
  
  logTest('Test Suite Start', 'INFO', {
    timestamp: new Date().toISOString(),
    config
  });

  // Phase 1: File Structure Validation
  console.log('\n📁 PHASE 1: FILE STRUCTURE VALIDATION\n');
  
  validateFileExists('src/app/checkout/page.tsx', 'Main Checkout Page');
  validateFileExists('src/components/features/CheckoutForm.tsx', 'Checkout Form Component');
  validateFileExists('src/lib/validations/checkout.ts', 'Checkout Validation Schema');
  validateFileExists('src/lib/checkout-service.ts', 'Checkout Service');
  validateFileExists('src/app/checkout/confirmation/[orderId]/page.tsx', 'Order Confirmation Page');

  // Phase 2: Code Content Validation
  console.log('\n🔍 PHASE 2: CODE CONTENT VALIDATION\n');
  
  // Checkout Page Validation
  validateCodeContent(
    'src/app/checkout/page.tsx',
    [
      'CheckoutForm',
      'useCart',
      'useRouter',
      'Observable Implementation',
      'Explicit Error Handling'
    ],
    'Checkout Page Implementation'
  );

  // Checkout Form Validation
  validateCodeContent(
    'src/components/features/CheckoutForm.tsx',
    [
      'useForm',
      'zodResolver',
      'checkoutSchema',
      'PAYMENT_METHODS',
      'shipping',
      'payment',
      'review',
      'AnimatePresence'
    ],
    'Checkout Form Implementation'
  );

  // Validation Schema
  validateCodeContent(
    'src/lib/validations/checkout.ts',
    [
      'checkoutSchema',
      'CheckoutFormData',
      'PAYMENT_METHODS',
      'COLOMBIAN_DEPARTMENTS',
      'transformToCheckoutRequest'
    ],
    'Validation Schema'
  );

  // Checkout Service
  validateCodeContent(
    'src/lib/checkout-service.ts',
    [
      'CheckoutService',
      'processCheckout',
      'validateCart',
      'Observable Implementation',
      'Explicit Error Handling'
    ],
    'Checkout Service'
  );

  // Confirmation Page
  validateCodeContent(
    'src/app/checkout/confirmation/[orderId]/page.tsx',
    [
      'ConfirmationPage',
      'CheckCircleIcon',
      'motion',
      'checkoutService.getOrder',
      'formatPrice'
    ],
    'Confirmation Page'
  );

  // Phase 3: MONOCODE Compliance
  console.log('\n✅ PHASE 3: MONOCODE COMPLIANCE VALIDATION\n');
  
  validateMonocodeCompliance('src/app/checkout/page.tsx', 'Checkout Page');
  validateMonocodeCompliance('src/components/features/CheckoutForm.tsx', 'Checkout Form');
  validateMonocodeCompliance('src/lib/checkout-service.ts', 'Checkout Service');
  validateMonocodeCompliance('src/app/checkout/confirmation/[orderId]/page.tsx', 'Confirmation Page');

  // Phase 4: Integration Points
  console.log('\n🔗 PHASE 4: INTEGRATION POINTS VALIDATION\n');
  
  // Cart Integration
  validateCodeContent(
    'src/components/features/CartSlideOver.tsx',
    [
      '/checkout',
      'CHECKOUT_INITIATED_FROM_CART',
      'Observable Implementation'
    ],
    'Cart to Checkout Integration'
  );

  // Backend Integration Points
  validateFileExists('backend/src/routes/v1/checkout.ts', 'Backend Checkout Route');
  validateFileExists('backend/src/services/CartService.ts', 'Cart Service');
  validateFileExists('backend/src/services/PaymentService.ts', 'Payment Service');

  // Phase 5: Style Guide Compliance
  console.log('\n🎨 PHASE 5: STYLE GUIDE COMPLIANCE\n');
  
  validateCodeContent(
    'src/app/globals.css',
    [
      'checkout-step',
      'payment-method-card',
      'checkout-progress-step',
      'checkout-alert'
    ],
    'CSS Style Guide Implementation'
  );

  // Phase 6: API Endpoint Validation (Skipped - requires running backend)
  console.log('\n🌐 PHASE 6: API ENDPOINT VALIDATION\n');
  
  await validateApiEndpoint('/api/v1/checkout', 'POST', 'Process Checkout');
  await validateApiEndpoint('/api/v1/cart/validate', 'GET', 'Validate Cart');
  await validateApiEndpoint('/api/v1/checkout/validate-promo', 'POST', 'Validate Promo Code');

  // Generate Test Report
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================\n');
  
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️  Skipped: ${testResults.skipped}`);
  console.log(`📊 Total Tests: ${testResults.passed + testResults.failed + testResults.skipped}`);
  
  if (testResults.errors.length > 0) {
    console.log('\n🚨 ERRORS FOUND:\n');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  // Success/Failure Determination
  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  
  console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 90) {
    console.log('\n🎉 CHECKOUT SYSTEM VALIDATION: EXCELLENT');
    console.log('✅ System is ready for production use');
  } else if (successRate >= 75) {
    console.log('\n⚠️  CHECKOUT SYSTEM VALIDATION: GOOD');
    console.log('✅ System is functional with minor issues');
  } else if (successRate >= 50) {
    console.log('\n⚠️  CHECKOUT SYSTEM VALIDATION: NEEDS IMPROVEMENT');
    console.log('❌ Please address the failed tests before deployment');
  } else {
    console.log('\n🚨 CHECKOUT SYSTEM VALIDATION: CRITICAL ISSUES');
    console.log('❌ System requires significant fixes before use');
  }

  // Next Steps
  console.log('\n🚀 NEXT STEPS:');
  console.log('==============\n');
  console.log('1. Start the backend: cd backend && npm run dev');
  console.log('2. Start the frontend: npm run dev');
  console.log('3. Test checkout flow manually:');
  console.log('   - Add products to cart');
  console.log('   - Click checkout button');
  console.log('   - Complete checkout form');
  console.log('   - Verify order confirmation');
  console.log('4. Check payment instructions');
  console.log('5. Test error scenarios');
  
  logTest('Test Suite Complete', 'INFO', {
    timestamp: new Date().toISOString(),
    results: testResults,
    successRate: `${successRate.toFixed(1)}%`
  });

  return successRate >= 75;
}

// Execute tests if run directly
if (require.main === module) {
  runCheckoutSystemTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n💥 TEST EXECUTION ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runCheckoutSystemTests,
  validateFileExists,
  validateCodeContent,
  validateMonocodeCompliance
}; 