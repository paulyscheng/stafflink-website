const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testCompanyRegistration() {
  const client = await pool.connect();
  
  try {
    console.log('Testing company registration...\n');
    
    // Test data
    const testData = {
      name: 'Test Company',
      contactPerson: 'Test Person',
      phone: '13900139099',
      email: 'test@example.com',
      address: 'Test Address',
      industry: 'construction'
    };
    
    // First, check if verification code exists for this phone
    console.log('1. Checking verification codes...');
    const codeQuery = `
      SELECT * FROM verification_codes 
      WHERE phone = $1 AND code = '123456' 
      AND expires_at > NOW() AND is_used = false
      ORDER BY created_at DESC LIMIT 1
    `;
    const codeResult = await client.query(codeQuery, [testData.phone]);
    console.log('Verification codes found:', codeResult.rows.length);
    
    // Insert a test verification code if none exists
    if (codeResult.rows.length === 0) {
      console.log('Inserting test verification code...');
      const insertCodeQuery = `
        INSERT INTO verification_codes 
        (phone, code, user_type, purpose, expires_at, is_used)
        VALUES ($1, '123456', 'company', 'register', NOW() + INTERVAL '5 minutes', false)
      `;
      await client.query(insertCodeQuery, [testData.phone]);
      console.log('Test code inserted.');
    }
    
    // Try to insert company
    console.log('\n2. Attempting to insert company...');
    const createUserQuery = `
      INSERT INTO companies (company_name, contact_person, phone, email, address, industry)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const userData = [
      testData.name,
      testData.contactPerson,
      testData.phone,
      testData.email,
      testData.address,
      testData.industry
    ];
    
    console.log('Query:', createUserQuery);
    console.log('Parameters:', userData);
    
    const result = await client.query(createUserQuery, userData);
    console.log('\nSuccess! Company created:', result.rows[0]);
    
    // Clean up - delete the test company
    await client.query('DELETE FROM companies WHERE phone = $1', [testData.phone]);
    console.log('\nTest data cleaned up.');
    
  } catch (error) {
    console.error('\nError during registration:', error.message);
    console.error('Error details:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testCompanyRegistration();