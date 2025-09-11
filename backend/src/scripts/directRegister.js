require('dotenv').config();
const db = require('../config/database');

async function directRegister() {
  const testPhone = '13900139003';
  
  try {
    console.log('Direct registration test...\n');
    
    // 1. First insert a verification code
    console.log('1. Inserting verification code...');
    const insertCodeQuery = `
      INSERT INTO verification_codes 
      (phone, code, user_type, purpose, expires_at, is_used)
      VALUES ($1, '123456', 'company', 'register', NOW() + INTERVAL '5 minutes', false)
      RETURNING *
    `;
    const codeResult = await db.query(insertCodeQuery, [testPhone]);
    console.log('Code inserted:', codeResult.rows[0].id);
    
    // 2. Check if company exists
    console.log('\n2. Checking if company exists...');
    const checkQuery = 'SELECT id FROM companies WHERE phone = $1';
    const checkResult = await db.query(checkQuery, [testPhone]);
    console.log('Company exists:', checkResult.rows.length > 0);
    
    // 3. Create company
    console.log('\n3. Creating company...');
    const createQuery = `
      INSERT INTO companies (company_name, contact_person, phone, email, address, industry)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, company_name, phone, industry
    `;
    const values = [
      'Test Company',
      'Test Person',
      testPhone,
      'test@example.com',
      'Test Address',
      'construction'
    ];
    
    const createResult = await db.query(createQuery, values);
    console.log('Company created:', createResult.rows[0]);
    
    // 4. Clean up
    console.log('\n4. Cleaning up...');
    await db.query('DELETE FROM companies WHERE phone = $1', [testPhone]);
    await db.query('DELETE FROM verification_codes WHERE phone = $1', [testPhone]);
    console.log('Cleanup complete.');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Details:', error);
  } finally {
    // Close connection
    await db.shutdown();
  }
}

directRegister();