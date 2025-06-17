import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  supabase: {
    url: process.env.SUPABASE_URL || 'https://lilwbdgmyfhtowlzmlhy.supabase.co',
    anonKey: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHdiZGdteWZodG93bHptbGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3NzA1MzYsImV4cCI6MjA2NTM0NjUzNn0.cDzS3nOsATJWdeFqFbGmThm0tUSVpXZLbj2BPZoXTsE',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpbHdiZGdteWZodG93bHptbGh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTc3MDUzNiwiZXhwIjoyMDY1MzQ2NTM2fQ.UZeFPMa8OYYxf9xJwwpAqM7VBF_9j8LRWpF9P9JZZaU'
  },
  
  payment: {
    bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    bankName: process.env.BANK_NAME || 'Banco de Bogotá',
    bankAccountType: process.env.BANK_ACCOUNT_TYPE || 'Ahorros',
    nequiPhone: process.env.NEQUI_PHONE || '+57 300 123 4567'
  },
  
  shipping: {
    defaultFee: parseInt(process.env.DEFAULT_SHIPPING_FEE || '15000')
  },
  
  security: {
    jwtSecret: process.env.JWT_SECRET || 'grizzland_super_secret_key_2024',
    apiRateLimit: parseInt(process.env.API_RATE_LIMIT || '100'),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '10000')
  }
}; 