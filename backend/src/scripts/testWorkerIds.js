require('dotenv').config({ path: '.env.local' });
const db = require('../config/database');

async function testWorkerIds() {
  try {
    // Get first 5 workers to see their ID format
    const result = await db.query(`
      SELECT id, name, phone 
      FROM workers 
      LIMIT 5
    `);
    
    console.log('Sample Worker IDs:');
    result.rows.forEach(worker => {
      console.log(`- ID: ${worker.id} (type: ${typeof worker.id}), Name: ${worker.name}, Phone: ${worker.phone}`);
    });
    
    // Check if any workers have numeric IDs (which would be wrong)
    const numericCheck = await db.query(`
      SELECT COUNT(*) as count 
      FROM workers 
      WHERE id::text ~ '^[0-9]+$'
    `);
    
    console.log(`\nWorkers with numeric-looking IDs: ${numericCheck.rows[0].count}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testWorkerIds();