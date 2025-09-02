const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function findSpecificJobRecord() {
  try {
    console.log('🔍 Searching for your specific job record...\n');

    // First, let's see all recent job records with their timestamps
    const recentQuery = `
      SELECT 
        jr.id as job_record_id,
        jr.created_at,
        TO_CHAR(jr.created_at AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI:SS') as beijing_time,
        TO_CHAR(jr.created_at, 'Mon DD HH24:MI') as formatted_time,
        jr.status,
        
        -- Worker info
        w.name as worker_name,
        
        -- Company info
        c.company_name,
        
        -- Project info
        p.project_name,
        p.payment_type,
        p.daily_wage,
        p.original_wage,
        
        -- Calculate hourly wage
        CASE 
          WHEN p.payment_type = 'hourly' THEN 
            COALESCE(p.original_wage, p.daily_wage / 8.0)
          ELSE 
            COALESCE(p.daily_wage / 8.0)
        END as hourly_rate
        
      FROM job_records jr
      LEFT JOIN workers w ON jr.worker_id = w.id
      LEFT JOIN companies c ON jr.company_id = c.id
      LEFT JOIN projects p ON jr.project_id = p.id
      WHERE jr.created_at >= CURRENT_DATE - INTERVAL '2 days'
      ORDER BY jr.created_at DESC
    `;

    const result = await pool.query(recentQuery);
    
    console.log(`📊 Found ${result.rows.length} job records from the last 2 days:\n`);
    
    // Display in a more readable format
    result.rows.forEach((job, index) => {
      console.log(`[${index + 1}] Job ID: ${job.job_record_id.slice(0, 8)}...`);
      console.log(`    Created: ${job.beijing_time} (Beijing Time)`);
      console.log(`    Worker: ${job.worker_name}`);
      console.log(`    Company: ${job.company_name}`);
      console.log(`    Project: ${job.project_name}`);
      console.log(`    Payment Type: ${job.payment_type}`);
      console.log(`    Hourly Rate: ¥${parseFloat(job.hourly_rate).toFixed(2)}/hour`);
      if (job.payment_type === 'daily') {
        console.log(`    Daily Wage: ¥${job.daily_wage}/day`);
      }
      console.log(`    Status: ${job.status}`);
      console.log('');
    });

    // Now let's find the most recent job record and show its complete details
    if (result.rows.length > 0) {
      console.log('\n📄 MOST RECENT JOB RECORD COMPLETE DETAILS:');
      console.log('=' .repeat(60));
      
      const detailQuery = `
        SELECT 
          jr.*,
          
          -- Worker information
          w.name as worker_name,
          w.phone as worker_phone,
          
          -- Company information
          c.company_name,
          c.phone as company_phone,
          
          -- Project information
          p.project_name,
          p.project_address,
          p.payment_type,
          p.daily_wage,
          p.original_wage,
          p.wage_unit,
          p.required_workers,
          
          -- Invitation info
          i.wage_amount as invitation_wage_amount,
          i.original_wage as invitation_original_wage,
          
          -- Calculate hourly wage
          CASE 
            WHEN p.payment_type = 'hourly' THEN 
              COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
            WHEN p.payment_type = 'daily' THEN 
              COALESCE(p.daily_wage, i.wage_amount) / 8.0
            ELSE 
              COALESCE(p.daily_wage, i.wage_amount) / 8.0
          END as calculated_hourly_wage
          
        FROM job_records jr
        LEFT JOIN workers w ON jr.worker_id = w.id
        LEFT JOIN companies c ON jr.company_id = c.id
        LEFT JOIN projects p ON jr.project_id = p.id
        LEFT JOIN invitations i ON jr.invitation_id = i.id
        WHERE jr.id = $1
      `;
      
      const detailResult = await pool.query(detailQuery, [result.rows[0].job_record_id]);
      const job = detailResult.rows[0];
      
      console.log('\n💰 WAGE INFORMATION:');
      console.log(`   Payment Type: ${job.payment_type}`);
      console.log(`   Hourly Rate: ¥${parseFloat(job.calculated_hourly_wage).toFixed(2)}/hour`);
      
      if (job.payment_type === 'daily') {
        console.log(`   Daily Wage: ¥${job.daily_wage}/day`);
      } else if (job.payment_type === 'hourly') {
        console.log(`   Original Hourly Rate: ¥${job.original_wage}/hour`);
      }
      
      console.log('\n📋 COMPLETE JOB DETAILS:');
      console.log(`   Job Record ID: ${job.id}`);
      console.log(`   Worker: ${job.worker_name} (${job.worker_phone})`);
      console.log(`   Company: ${job.company_name} (${job.company_phone})`);
      console.log(`   Project: ${job.project_name}`);
      console.log(`   Address: ${job.project_address}`);
      console.log(`   Required Workers: ${job.required_workers}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Start Date: ${job.start_date ? new Date(job.start_date).toLocaleDateString('zh-CN') : 'TBD'}`);
      console.log(`   End Date: ${job.end_date ? new Date(job.end_date).toLocaleDateString('zh-CN') : 'TBD'}`);
      console.log(`   Created: ${new Date(job.created_at).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Execute the query
findSpecificJobRecord();