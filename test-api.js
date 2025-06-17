const http = require('http');

// Test function
function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
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

// Run tests
async function runTests() {
  console.log('🧪 Testing GRIZZLAND Backend API\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthRes = await testEndpoint('/health');
    console.log(`   Status: ${healthRes.statusCode}`);
    console.log(`   Response: ${healthRes.body}\n`);

    // Test 2: API docs
    console.log('2. Testing API docs...');
    const docsRes = await testEndpoint('/api/docs');
    console.log(`   Status: ${docsRes.statusCode}`);
    if (docsRes.statusCode === 200) {
      const docs = JSON.parse(docsRes.body);
      console.log(`   Message: ${docs.message}`);
    }
    console.log();

    // Test 3: Products list
    console.log('3. Testing products endpoint...');
    const productsRes = await testEndpoint('/api/v1/products');
    console.log(`   Status: ${productsRes.statusCode}`);
    if (productsRes.statusCode === 200) {
      const products = JSON.parse(productsRes.body);
      console.log(`   Products found: ${products.data?.length || 0}`);
      if (products.data?.length > 0) {
        console.log(`   First product: ${products.data[0].name}`);
      }
    }
    console.log();

    // Test 4: Featured products
    console.log('4. Testing featured products...');
    const featuredRes = await testEndpoint('/api/v1/products/featured');
    console.log(`   Status: ${featuredRes.statusCode}`);
    if (featuredRes.statusCode === 200) {
      const featured = JSON.parse(featuredRes.body);
      console.log(`   Featured products: ${featured.data?.length || 0}`);
    }
    console.log();

    console.log('✅ Backend API tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests(); 