const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

async function cleanupCodes() {
  const client = await pool.connect();
  
  try {
    console.log('Cleaning up verification codes...\n');
    
    // Delete all test phone numbers' codes
    const testPhones = [
      '13900139000', '13900139001', '13900139002', '13900139003',
      '13900139004', '13900139005', '13900139006', '13900139007',
      '13900139008', '13900139009'
    ];
    
    const deleteQuery = `
      DELETE FROM verification_codes 
      WHERE phone = ANY($1::varchar[])
      RETURNING phone, code, created_at
    `;
    
    const result = await client.query(deleteQuery, [testPhones]);
    console.log(`Deleted ${result.rowCount} verification codes`);
    
    if (result.rows.length > 0) {
      console.log('\nDeleted codes:');
      result.rows.forEach(row => {
        console.log(`- Phone: ${row.phone}, Code: ${row.code}, Created: ${row.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupCodes();