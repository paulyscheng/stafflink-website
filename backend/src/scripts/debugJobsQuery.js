const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'gz-postgres-peldbckv.sql.tencentcdb.com',
  port: process.env.DB_PORT || 23309,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'staffLink',
  password: process.env.DB_PASSWORD || 'SkzgEBg-23YbBpc',
  ssl: {
    rejectUnauthorized: false
  }
});

async function debugQuery() {
  try {
    const companyId = '3f5a4bfa-3116-4185-9284-99673c18c276';
    
    // Test the exact query being used
    console.log('🔍 Testing query with IN clause for completed, confirmed, paid:\n');
    
    const query = `
      SELECT 
        jr.*,
        w.name as worker_name,
        w.phone as worker_phone,
        p.project_name,
        p.project_address,
        i.wage_offer,
        i.wage_type
      FROM job_records jr
      LEFT JOIN workers w ON jr.worker_id = w.id
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN invitations i ON jr.invitation_id = i.id
      WHERE jr.company_id = $1
      AND jr.status IN ('completed', 'confirmed', 'paid')
      ORDER BY jr.created_at DESC
      LIMIT 20 OFFSET 0
    `;
    
    const result = await pool.query(query, [companyId]);
    
    console.log(`📊 Found ${result.rows.length} job(s)\n`);
    
    result.rows.forEach((job, index) => {
      console.log(`[${index + 1}] Job ID: ${job.id}`);
      console.log(`   Worker: ${job.worker_name}`);
      console.log(`   Project: ${job.project_name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Complete Time: ${job.complete_time}`);
      console.log(`   Confirm Time: ${job.confirm_time}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugQuery();