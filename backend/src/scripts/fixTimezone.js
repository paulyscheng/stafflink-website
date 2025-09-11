const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function fixTimezone() {
  const client = await pool.connect();
  
  try {
    console.log('=== Checking and Fixing Timezone Issues ===\n');
    
    // 1. Check current timezone setting
    const tzResult = await client.query('SELECT current_setting(\'TIMEZONE\') as tz');
    console.log('Current database timezone:', tzResult.rows[0].tz);
    
    // 2. Check server time
    const serverTimeResult = await client.query(`
      SELECT 
        NOW() as server_now,
        NOW()::timestamptz as server_now_tz,
        NOW() AT TIME ZONE 'UTC' as server_now_utc,
        CURRENT_TIMESTAMP as current_ts,
        LOCALTIMESTAMP as local_ts
    `);
    console.log('\nServer time info:');
    console.log('NOW():', serverTimeResult.rows[0].server_now);
    console.log('NOW() with TZ:', serverTimeResult.rows[0].server_now_tz);
    console.log('NOW() at UTC:', serverTimeResult.rows[0].server_now_utc);
    console.log('CURRENT_TIMESTAMP:', serverTimeResult.rows[0].current_ts);
    console.log('LOCALTIMESTAMP:', serverTimeResult.rows[0].local_ts);
    
    // 3. Check Node.js time
    console.log('\nNode.js time info:');
    console.log('new Date():', new Date());
    console.log('Date.now():', new Date(Date.now()));
    console.log('ISO String:', new Date().toISOString());
    
    // 4. Test inserting with different time methods
    console.log('\n=== Testing Time Insertion Methods ===\n');
    
    // Method 1: Using JS Date
    const jsDate = new Date(Date.now() + 5 * 60 * 1000);
    console.log('JS Date (+5min):', jsDate);
    console.log('JS Date ISO:', jsDate.toISOString());
    
    // Method 2: Using PostgreSQL time functions
    const testResult = await client.query(`
      SELECT 
        $1::timestamptz as js_date,
        NOW() + INTERVAL '5 minutes' as pg_plus_5min,
        $1::timestamptz > NOW() as js_is_future,
        NOW() + INTERVAL '5 minutes' > NOW() as pg_is_future
    `, [jsDate]);
    
    console.log('\nComparison results:');
    console.log('JS Date in DB:', testResult.rows[0].js_date);
    console.log('PG +5min:', testResult.rows[0].pg_plus_5min);
    console.log('JS date is future?:', testResult.rows[0].js_is_future);
    console.log('PG date is future?:', testResult.rows[0].pg_is_future);
    
    // 5. Fix verification_codes table
    console.log('\n=== Fixing verification_codes table ===\n');
    
    // Check column types
    const columnResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'verification_codes' 
      AND column_name IN ('created_at', 'expires_at')
    `);
    console.log('Column types:', columnResult.rows);
    
    // Check if we need to change column types
    const needsUpdate = columnResult.rows.some(col => 
      col.data_type === 'timestamp without time zone'
    );
    
    if (needsUpdate) {
      console.log('\nUpdating column types to timestamptz...');
      
      // Convert columns to timestamptz
      await client.query(`
        ALTER TABLE verification_codes 
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC'
      `);
      
      console.log('✅ Column types updated to timestamptz');
    } else {
      console.log('\n✅ Column types are already correct (timestamptz)');
    }
    
    // 6. Test with new verification code
    console.log('\n=== Testing Verification Code Creation ===\n');
    
    const testPhone = '13900139999';
    const testCode = '999999';
    
    // Delete any existing codes for test phone
    await client.query('DELETE FROM verification_codes WHERE phone = $1', [testPhone]);
    
    // Insert using PostgreSQL time functions
    const insertResult = await client.query(`
      INSERT INTO verification_codes 
      (phone, code, user_type, purpose, expires_at, is_used, created_at)
      VALUES ($1, $2, 'company', 'test', NOW() + INTERVAL '5 minutes', false, NOW())
      RETURNING 
        created_at,
        expires_at,
        expires_at > NOW() as is_valid,
        EXTRACT(EPOCH FROM (expires_at - created_at))/60 as minutes_valid
    `, [testPhone, testCode]);
    
    console.log('Test code created:');
    console.log('Created at:', insertResult.rows[0].created_at);
    console.log('Expires at:', insertResult.rows[0].expires_at);
    console.log('Is valid?:', insertResult.rows[0].is_valid);
    console.log('Valid for minutes:', insertResult.rows[0].minutes_valid);
    
    // Clean up test
    await client.query('DELETE FROM verification_codes WHERE phone = $1', [testPhone]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTimezone();