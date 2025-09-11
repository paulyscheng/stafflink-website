const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testVerificationFlow() {
  const client = await pool.connect();
  
  try {
    console.log('=== Testing Verification Code Flow ===\n');
    
    const testPhone = '13900139999';
    const testCode = '999999';
    
    // Clean up any existing codes
    await client.query('DELETE FROM verification_codes WHERE phone = $1', [testPhone]);
    
    // 1. Insert a verification code using NOW() + INTERVAL
    console.log('1. Inserting verification code...');
    const insertResult = await client.query(`
      INSERT INTO verification_codes 
      (phone, code, user_type, purpose, expires_at, is_used, created_at)
      VALUES ($1, $2, 'company', 'register', NOW() + INTERVAL '5 minutes', false, NOW())
      RETURNING id, created_at, expires_at, expires_at > NOW() as is_valid
    `, [testPhone, testCode]);
    
    const insertedCode = insertResult.rows[0];
    console.log('Code inserted:');
    console.log('  ID:', insertedCode.id);
    console.log('  Created at:', insertedCode.created_at);
    console.log('  Expires at:', insertedCode.expires_at);
    console.log('  Is valid now?:', insertedCode.is_valid);
    
    // 2. Try to find the code (simulating verification)
    console.log('\n2. Verifying code...');
    const verifyResult = await client.query(`
      SELECT * FROM verification_codes 
      WHERE phone = $1 AND code = $2 AND purpose IN ('login', 'register')
      AND expires_at > NOW() AND is_used = false
      ORDER BY created_at DESC LIMIT 1
    `, [testPhone, testCode]);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Code verification successful!');
      console.log('  Found code ID:', verifyResult.rows[0].id);
    } else {
      console.log('❌ Code verification failed - no matching code found');
    }
    
    // 3. Check expiration timing
    console.log('\n3. Checking expiration timing...');
    const timingResult = await client.query(`
      SELECT 
        NOW() as current_time,
        expires_at,
        expires_at - NOW() as time_remaining,
        EXTRACT(EPOCH FROM (expires_at - NOW()))/60 as minutes_remaining
      FROM verification_codes 
      WHERE id = $1
    `, [insertedCode.id]);
    
    const timing = timingResult.rows[0];
    console.log('Current time:', timing.current_time);
    console.log('Expires at:', timing.expires_at);
    console.log('Time remaining:', timing.time_remaining);
    console.log('Minutes remaining:', timing.minutes_remaining);
    
    // Clean up
    await client.query('DELETE FROM verification_codes WHERE phone = $1', [testPhone]);
    console.log('\n✅ Test completed and cleaned up');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testVerificationFlow();