const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function testTimeZone() {
  const client = await pool.connect();
  
  try {
    console.log('Testing timezone settings...\n');
    
    // 1. Check database timezone
    const tzResult = await client.query('SHOW timezone');
    console.log('Database timezone:', tzResult.rows[0].timezone);
    
    // 2. Check current database time
    const nowResult = await client.query('SELECT NOW() as db_now, CURRENT_TIMESTAMP as db_current');
    console.log('Database NOW():', nowResult.rows[0].db_now);
    console.log('Database CURRENT_TIMESTAMP:', nowResult.rows[0].db_current);
    
    // 3. Check local Node.js time
    console.log('\nNode.js time:', new Date());
    console.log('Node.js ISO:', new Date().toISOString());
    
    // 4. Test time comparison
    const testQuery = `
      SELECT 
        NOW() as db_now,
        NOW() + INTERVAL '5 minutes' as expires_in_5min,
        $1::timestamp as js_time,
        $1::timestamp > NOW() as js_time_is_future
    `;
    const futureTime = new Date(Date.now() + 5 * 60 * 1000);
    const testResult = await client.query(testQuery, [futureTime]);
    
    console.log('\nTime comparison test:');
    console.log('DB NOW:', testResult.rows[0].db_now);
    console.log('DB +5min:', testResult.rows[0].expires_in_5min);
    console.log('JS time:', testResult.rows[0].js_time);
    console.log('JS time is future?:', testResult.rows[0].js_time_is_future);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testTimeZone();