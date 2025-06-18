const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3003';

async function testPromoEndpoints() {
  console.log('🧪 Testing Promo Code Endpoints...');
  
  try {
    // Test promo validation
    const validation = await axios.post(`${BASE_URL}/api/v1/promo/validate`, {
      code: 'WELCOME15',
      subtotal: 50000
    });
    
    console.log('✅ Promo validation endpoint working');
    console.log('Response:', validation.data);
  } catch (error) {
    console.log('❌ Promo validation failed:', error.response?.data || error.message);
  }
}

async function testAdminAlerts() {
  console.log('🧪 Testing Admin Alerts...');
  
  try {
    // Test alerts endpoint (should fail without auth)
    const alerts = await axios.get(`${BASE_URL}/api/v1/admin/alerts`);
    console.log('⚠️ Admin alerts accessible without auth (security issue)');
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('✅ Admin alerts properly protected');
    } else {
      console.log('❌ Unexpected error:', error.response?.data || error.message);
    }
  }
}

async function testServerHealth() {
  console.log('🧪 Testing Server Health...');
  
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server health check passed');
    console.log('Features:', health.data.features);
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
  }
}

async function main() {
  console.log(`
🚀 GRIZZLAND Backend - Quick Test Suite
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target: ${BASE_URL}
  `);

  await testServerHealth();
  await testPromoEndpoints();
  await testAdminAlerts();
  
  console.log('\n✅ Test suite completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testPromoEndpoints, testAdminAlerts, testServerHealth }; 