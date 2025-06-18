// Test script para verificar autenticación admin
// Ejecutar en la consola del navegador

console.log('🔍 Testing Admin Auth System');

// Test 1: Verificar credenciales
const testCredentials = {
  email: 'admin@grizzland.com',
  password: 'Admin123!'
};

console.log('✅ Test Credentials:', testCredentials);

// Test 2: Verificar localStorage
const checkLocalStorage = () => {
  const adminToken = localStorage.getItem('admin_token');
  const adminUser = localStorage.getItem('admin_user');
  
  console.log('🗄️ LocalStorage Check:');
  console.log('- Admin Token:', adminToken ? '✅ Found' : '❌ Not found');
  console.log('- Admin User:', adminUser ? '✅ Found' : '❌ Not found');
  
  if (adminUser) {
    try {
      const user = JSON.parse(adminUser);
      console.log('- User Details:', user);
    } catch (e) {
      console.log('❌ Invalid user data in localStorage');
    }
  }
};

// Test 3: Verificar URL actual
const checkCurrentUrl = () => {
  const currentUrl = window.location.href;
  console.log('🌐 Current URL:', currentUrl);
  
  if (currentUrl.includes('admin/login')) {
    console.log('📍 You are on the login page');
  } else if (currentUrl.includes('admin/dashboard')) {
    console.log('📍 You are on the dashboard page');
  } else {
    console.log('📍 You are on another page');
  }
};

// Test 4: Simular login (solo para testing)
const simulateLogin = () => {
  console.log('🔐 Simulating admin login...');
  
  const mockUser = {
    id: 'admin-mock-001',
    email: 'admin@grizzland.com',
    user_metadata: { role: 'admin', name: 'Administrator' },
    app_metadata: { role: 'admin' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
    phone: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    role: 'authenticated',
    aud: 'authenticated'
  };
  
  localStorage.setItem('admin_token', 'mock-admin-token');
  localStorage.setItem('admin_user', JSON.stringify(mockUser));
  
  console.log('✅ Mock session created');
  console.log('🔄 Reload the page to see the effect');
};

// Test 5: Limpiar sesión
const clearSession = () => {
  console.log('🧹 Clearing admin session...');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  console.log('✅ Session cleared');
  console.log('🔄 Reload the page to see the effect');
};

// Ejecutar tests automáticamente
console.log('\n=== AUTO TESTS ===');
checkCurrentUrl();
checkLocalStorage();

// Funciones disponibles
console.log('\n=== AVAILABLE FUNCTIONS ===');
console.log('- checkLocalStorage() - Check stored session');
console.log('- checkCurrentUrl() - Check current page');
console.log('- simulateLogin() - Create mock session');
console.log('- clearSession() - Clear session');

// Instrucciones
console.log('\n=== INSTRUCTIONS ===');
console.log('1. Go to: http://localhost:3002/admin/login');
console.log('2. Use credentials: admin@grizzland.com / Admin123!');
console.log('3. Check if redirect works to dashboard');
console.log('4. If issues, run simulateLogin() and reload'); 