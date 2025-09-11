const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000/api';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testFullRegistration() {
  const testPhone = '13900139099';
  
  try {
    console.log('=== Testing Full Registration Process ===\n');
    
    // Step 1: Send verification code
    console.log('1. Sending verification code...');
    try {
      const sendCodeResponse = await axios.post(`${API_BASE_URL}/auth/send-code`, {
        phone: testPhone,
        userType: 'company',
        purpose: 'register'
      });
      console.log('Code sent successfully:', sendCodeResponse.data);
    } catch (error) {
      console.error('Send code error:', error.response?.data || error.message);
    }
    
    // Step 2: Check verification codes in database
    console.log('\n2. Checking verification codes in database...');
    const client = await pool.connect();
    const codeCheck = await client.query(
      `SELECT * FROM verification_codes 
       WHERE phone = $1 AND is_used = false 
       ORDER BY created_at DESC LIMIT 1`,
      [testPhone]
    );
    console.log('Codes found:', codeCheck.rows.length);
    if (codeCheck.rows.length > 0) {
      console.log('Latest code:', {
        code: codeCheck.rows[0].code,
        purpose: codeCheck.rows[0].purpose,
        user_type: codeCheck.rows[0].user_type,
        expires_at: codeCheck.rows[0].expires_at
      });
    }
    
    // Step 3: Attempt registration
    console.log('\n3. Attempting registration...');
    const registerData = {
      phone: testPhone,
      code: '123456',
      userType: 'company',
      name: 'Test Company',
      contactPerson: 'Test Person',
      email: 'test@example.com',
      address: 'Test Address',
      industry: 'construction'
    };
    
    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
      console.log('Registration successful:', registerResponse.data);
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      if (error.response?.data?.details) {
        console.error('Validation details:', error.response.data.details);
      }
    }
    
    // Cleanup
    await client.query('DELETE FROM companies WHERE phone = $1', [testPhone]);
    await client.query('DELETE FROM verification_codes WHERE phone = $1', [testPhone]);
    client.release();
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await pool.end();
  }
}

// Check if axios is installed
try {
  require.resolve('axios');
  testFullRegistration();
} catch(e) {
  console.log('Installing axios...');
  const { execSync } = require('child_process');
  execSync('npm install axios', { stdio: 'inherit' });
  console.log('Please run this script again.');
}