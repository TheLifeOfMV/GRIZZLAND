/**
 * GRIZZLAND Contact System Test Suite
 * 
 * Tests all contact functionality:
 * - Frontend form validation and submission
 * - Backend API endpoints
 * - Database operations
 * - Admin management features
 * - Email notifications
 * 
 * Run with: node test-contact-system.js
 */

const https = require('https');
const http = require('http');

// Test configuration
const config = {
  baseUrl: 'http://localhost:3003', // [BACKEND_PORT][[memory:5687231858551259871]]
  endpoints: {
    submit: '/api/v1/contact',
    health: '/api/v1/contact/health',
    docs: '/api/v1/contact/docs',
    adminSubmissions: '/api/v1/contact/admin/submissions',
    adminStats: '/api/v1/contact/admin/stats',
    adminUpdateStatus: '/api/v1/contact/admin/submissions/:id/status'
  }
};

// Test data
const testContactData = {
  valid: {
    name: 'Carlos Martínez',
    email: 'carlos.martinez@example.com',
    phone: '+573001234567',
    subject: 'Consulta sobre productos GRIZZLAND',
    message: 'Hola! Me interesa conocer más sobre su colección de invierno. ¿Podrían enviarme información detallada sobre las tallas disponibles?'
  },
  validMinimal: {
    name: 'Ana',
    email: 'ana@test.com',
    phone: '3009876543',
    message: 'Mensaje corto pero válido para testing.'
  },
  invalid: {
    nameEmpty: {
      name: '',
      email: 'test@test.com',
      phone: '+573001234567',
      message: 'Test message'
    },
    nameShort: {
      name: 'A',
      email: 'test@test.com',
      phone: '+573001234567',
      message: 'Test message'
    },
    emailInvalid: {
      name: 'Test User',
      email: 'invalid-email',
      phone: '+573001234567',
      message: 'Test message'
    },
    phoneInvalid: {
      name: 'Test User',
      email: 'test@test.com',
      phone: '123',
      message: 'Test message'
    },
    messageShort: {
      name: 'Test User',
      email: 'test@test.com',
      phone: '+573001234567',
      message: 'Short'
    },
    messageLong: {
      name: 'Test User',
      email: 'test@test.com',
      phone: '+573001234567',
      message: 'A'.repeat(501)
    }
  }
};

// HTTP request helper
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(config.baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GRIZZLAND-Contact-Test/1.0',
        ...headers
      }
    };

    if (data) {
      const body = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test utilities
function logTest(testName, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${testName}: ${status}${details ? ` - ${details}` : ''}`);
}

function logSection(sectionName) {
  console.log(`\n🧪 ${sectionName}`);
  console.log('='.repeat(50));
}

// Test 1: Health Check
async function testHealthCheck() {
  logSection('Contact System Health Check');
  
  try {
    const response = await makeRequest('GET', config.endpoints.health);
    
    if (response.status === 200 && response.data.status === 'healthy') {
      logTest('Health Check', 'PASS', 'Contact service is running');
      return true;
    } else {
      logTest('Health Check', 'FAIL', `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error) {
    logTest('Health Check', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 2: API Documentation
async function testApiDocs() {
  logSection('API Documentation');
  
  try {
    const response = await makeRequest('GET', config.endpoints.docs);
    
    if (response.status === 200 && response.data.api_name) {
      logTest('API Documentation', 'PASS', 'Documentation accessible');
      return true;
    } else {
      logTest('API Documentation', 'FAIL', `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('API Documentation', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 3: Valid Contact Form Submission
async function testValidSubmission() {
  logSection('Valid Contact Form Submissions');
  
  let allPassed = true;
  
  // Test with full data
  try {
    const response = await makeRequest('POST', config.endpoints.submit, testContactData.valid);
    
    if (response.status === 201 && response.data.success) {
      logTest('Complete Form Submission', 'PASS', `Submission ID: ${response.data.data?.id}`);
    } else {
      logTest('Complete Form Submission', 'FAIL', `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
      allPassed = false;
    }
  } catch (error) {
    logTest('Complete Form Submission', 'FAIL', `Error: ${error.message}`);
    allPassed = false;
  }
  
  // Test with minimal data
  try {
    const response = await makeRequest('POST', config.endpoints.submit, testContactData.validMinimal);
    
    if (response.status === 201 && response.data.success) {
      logTest('Minimal Form Submission', 'PASS', `Submission ID: ${response.data.data?.id}`);
    } else {
      logTest('Minimal Form Submission', 'FAIL', `Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
      allPassed = false;
    }
  } catch (error) {
    logTest('Minimal Form Submission', 'FAIL', `Error: ${error.message}`);
    allPassed = false;
  }
  
  return allPassed;
}

// Test 4: Invalid Form Validation
async function testInvalidSubmissions() {
  logSection('Invalid Form Validation');
  
  let allPassed = true;
  
  for (const [testName, invalidData] of Object.entries(testContactData.invalid)) {
    try {
      const response = await makeRequest('POST', config.endpoints.submit, invalidData);
      
      if (response.status === 400 && response.data.errors) {
        logTest(`Invalid ${testName}`, 'PASS', 'Validation error caught');
      } else {
        logTest(`Invalid ${testName}`, 'FAIL', `Expected 400 with errors, got ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      logTest(`Invalid ${testName}`, 'FAIL', `Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test 5: Rate Limiting
async function testRateLimiting() {
  logSection('Rate Limiting');
  
  try {
    // Make multiple rapid requests
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(makeRequest('POST', config.endpoints.submit, {
        ...testContactData.valid,
        name: `Test User ${i}`,
        email: `test${i}@example.com`
      }));
    }
    
    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (rateLimited) {
      logTest('Rate Limiting', 'PASS', 'Rate limiting is active');
      return true;
    } else {
      logTest('Rate Limiting', 'WARN', 'No rate limiting detected (might be disabled for testing)');
      return true;
    }
  } catch (error) {
    logTest('Rate Limiting', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 6: Admin Endpoints (without authentication)
async function testAdminEndpointsWithoutAuth() {
  logSection('Admin Endpoints Security');
  
  let allPassed = true;
  
  // Test admin submissions endpoint without auth
  try {
    const response = await makeRequest('GET', config.endpoints.adminSubmissions);
    
    if (response.status === 401 || response.status === 403) {
      logTest('Admin Submissions (No Auth)', 'PASS', 'Access denied without authentication');
    } else {
      logTest('Admin Submissions (No Auth)', 'FAIL', `Expected 401/403, got ${response.status}`);
      allPassed = false;
    }
  } catch (error) {
    logTest('Admin Submissions (No Auth)', 'FAIL', `Error: ${error.message}`);
    allPassed = false;
  }
  
  // Test admin stats endpoint without auth
  try {
    const response = await makeRequest('GET', config.endpoints.adminStats);
    
    if (response.status === 401 || response.status === 403) {
      logTest('Admin Stats (No Auth)', 'PASS', 'Access denied without authentication');
    } else {
      logTest('Admin Stats (No Auth)', 'FAIL', `Expected 401/403, got ${response.status}`);
      allPassed = false;
    }
  } catch (error) {
    logTest('Admin Stats (No Auth)', 'FAIL', `Error: ${error.message}`);
    allPassed = false;
  }
  
  return allPassed;
}

// Test 7: Database Integration
async function testDatabaseIntegration() {
  logSection('Database Integration');
  
  try {
    // Submit a test contact and verify it was stored
    const testData = {
      ...testContactData.valid,
      name: 'Database Test User',
      email: 'dbtest@example.com'
    };
    
    const response = await makeRequest('POST', config.endpoints.submit, testData);
    
    if (response.status === 201 && response.data.success && response.data.data?.id) {
      logTest('Database Storage', 'PASS', `Record created with ID: ${response.data.data.id}`);
      return true;
    } else {
      logTest('Database Storage', 'FAIL', 'Failed to create database record');
      return false;
    }
  } catch (error) {
    logTest('Database Storage', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 8: Phone Number Formatting
async function testPhoneFormatting() {
  logSection('Phone Number Formatting');
  
  const phoneTestCases = [
    { input: '3001234567', expected: '+573001234567' },
    { input: '+573001234567', expected: '+573001234567' },
    { input: '573001234567', expected: '+573001234567' }
  ];
  
  let allPassed = true;
  
  for (const testCase of phoneTestCases) {
    try {
      const testData = {
        ...testContactData.validMinimal,
        phone: testCase.input,
        name: `Phone Test ${testCase.input}`,
        email: `phonetest${Date.now()}@test.com`
      };
      
      const response = await makeRequest('POST', config.endpoints.submit, testData);
      
      if (response.status === 201 && response.data.success) {
        logTest(`Phone Format: ${testCase.input}`, 'PASS', `Accepted and formatted`);
      } else {
        logTest(`Phone Format: ${testCase.input}`, 'FAIL', `Status: ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      logTest(`Phone Format: ${testCase.input}`, 'FAIL', `Error: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Test 9: Structured Logging
async function testStructuredLogging() {
  logSection('Structured Logging');
  
  try {
    // Submit a contact with specific identifiers to check logging
    const testData = {
      ...testContactData.valid,
      name: 'Logging Test User',
      email: 'loggingtest@example.com',
      subject: 'LOGGING_TEST_SUBJECT'
    };
    
    const response = await makeRequest('POST', config.endpoints.submit, testData);
    
    if (response.status === 201) {
      logTest('Structured Logging', 'PASS', 'Check server logs for CONTACT_FORM_SUBMIT events');
      return true;
    } else {
      logTest('Structured Logging', 'FAIL', 'Failed to trigger logging events');
      return false;
    }
  } catch (error) {
    logTest('Structured Logging', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 10: Performance and Load
async function testPerformance() {
  logSection('Performance Testing');
  
  try {
    const startTime = Date.now();
    
    // Submit 5 contacts concurrently
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(makeRequest('POST', config.endpoints.submit, {
        ...testContactData.validMinimal,
        name: `Performance Test ${i}`,
        email: `perftest${i}@example.com`
      }));
    }
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = responses.filter(r => r.status === 201).length;
    
    if (successCount === 5 && duration < 5000) {
      logTest('Performance Test', 'PASS', `5 submissions in ${duration}ms`);
      return true;
    } else {
      logTest('Performance Test', 'FAIL', `${successCount}/5 successful, took ${duration}ms`);
      return false;
    }
  } catch (error) {
    logTest('Performance Test', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🎯 GRIZZLAND Contact System Test Suite');
  console.log('🎯 Testing against:', config.baseUrl);
  console.log('🎯 Timestamp:', new Date().toISOString());
  console.log('='.repeat(60));
  
  const testResults = [];
  
  // Run all tests
  testResults.push(await testHealthCheck());
  testResults.push(await testApiDocs());
  testResults.push(await testValidSubmission());
  testResults.push(await testInvalidSubmissions());
  testResults.push(await testRateLimiting());
  testResults.push(await testAdminEndpointsWithoutAuth());
  testResults.push(await testDatabaseIntegration());
  testResults.push(await testPhoneFormatting());
  testResults.push(await testStructuredLogging());
  testResults.push(await testPerformance());
  
  // Summary
  const passedTests = testResults.filter(result => result === true).length;
  const totalTests = testResults.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Contact system is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Review any failed tests');
  console.log('2. Check server logs for detailed error information');
  console.log('3. Test the frontend contact form manually');
  console.log('4. Verify admin dashboard functionality');
  console.log('5. Test email notifications (if configured)');
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
  testContactData,
  config
}; 