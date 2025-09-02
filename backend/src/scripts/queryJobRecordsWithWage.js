const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function queryJobRecordsWithWage() {
  try {
    console.log('🔍 Querying job records with hourly wage information...\n');

    // Query to get job records with wage information from invitations and projects
    const query = `
      SELECT 
        jr.id as job_record_id,
        jr.status,
        jr.start_date,
        jr.end_date,
        jr.actual_hours,
        jr.wage_amount as job_wage_amount,
        jr.payment_status,
        jr.worker_confirmed,
        jr.company_confirmed,
        jr.created_at,
        
        -- Worker information
        w.name as worker_name,
        w.phone as worker_phone,
        
        -- Company information
        c.company_name,
        c.phone as company_phone,
        
        -- Project information
        p.project_name,
        p.project_address,
        p.payment_type as project_payment_type,
        p.daily_wage as project_daily_wage,
        p.original_wage as project_original_wage,
        p.wage_unit as project_wage_unit,
        
        -- Invitation wage information
        i.wage_amount as invitation_wage_amount,
        i.original_wage as invitation_original_wage,
        i.wage_unit as invitation_wage_unit,
        
        -- Calculate hourly wage based on available data
        CASE 
          WHEN p.payment_type = 'hourly' THEN 
            COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
          WHEN p.payment_type = 'daily' THEN 
            COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount) / 8.0
          ELSE 
            COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount) / 8.0
        END as calculated_hourly_wage,
        
        -- Wage display format
        CASE 
          WHEN p.payment_type = 'hourly' THEN 
            COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)::text || '元/小时'
          WHEN p.payment_type = 'daily' THEN 
            COALESCE(p.daily_wage, i.wage_amount)::text || '元/天'
          WHEN p.payment_type = 'fixed' THEN 
            COALESCE(p.original_wage, i.wage_amount)::text || '元(总价)'
          ELSE 
            COALESCE(jr.wage_amount, p.daily_wage)::text || '元'
        END as wage_display
        
      FROM job_records jr
      LEFT JOIN workers w ON jr.worker_id = w.id
      LEFT JOIN companies c ON jr.company_id = c.id
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN invitations i ON jr.invitation_id = i.id
      ORDER BY jr.created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query);
    
    console.log(`📊 Found ${result.rows.length} job record(s)\n`);

    // Display job records with wage information
    result.rows.forEach((job, index) => {
      console.log(`[${index + 1}] Job Record: ${job.job_record_id}`);
      console.log(`   Worker: ${job.worker_name} (${job.worker_phone})`);
      console.log(`   Company: ${job.company_name}`);
      console.log(`   Project: ${job.project_name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Start Date: ${job.start_date ? new Date(job.start_date).toLocaleDateString() : 'N/A'}`);
      console.log(`   End Date: ${job.end_date ? new Date(job.end_date).toLocaleDateString() : 'N/A'}`);
      
      // Wage information
      console.log(`   Wage Display: ${job.wage_display}`);
      console.log(`   Calculated Hourly Rate: ¥${job.calculated_hourly_wage ? parseFloat(job.calculated_hourly_wage).toFixed(2) : 'N/A'}/hour`);
      console.log(`   Payment Type: ${job.project_payment_type || 'N/A'}`);
      
      // Actual work hours and payment
      if (job.actual_hours) {
        console.log(`   Actual Hours Worked: ${job.actual_hours} hours`);
        const estimatedPayment = parseFloat(job.calculated_hourly_wage) * parseFloat(job.actual_hours);
        console.log(`   Estimated Payment: ¥${estimatedPayment.toFixed(2)}`);
      }
      
      if (job.job_wage_amount) {
        console.log(`   Final Wage Amount: ¥${job.job_wage_amount}`);
        console.log(`   Payment Status: ${job.payment_status}`);
      }
      
      console.log(`   Worker Confirmed: ${job.worker_confirmed}`);
      console.log(`   Company Confirmed: ${job.company_confirmed}`);
      
      console.log('');
    });

    // Summary statistics
    console.log('\n📈 Wage Statistics Summary:');
    
    const wageStats = await pool.query(`
      SELECT 
        p.payment_type as wage_type,
        COUNT(*) as job_count,
        AVG(
          CASE 
            WHEN p.payment_type = 'hourly' THEN 
              COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
            ELSE 
              COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount) / 8.0
          END
        ) as avg_hourly_rate,
        MIN(
          CASE 
            WHEN p.payment_type = 'hourly' THEN 
              COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
            ELSE 
              COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount) / 8.0
          END
        ) as min_hourly_rate,
        MAX(
          CASE 
            WHEN p.payment_type = 'hourly' THEN 
              COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
            ELSE 
              COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount) / 8.0
          END
        ) as max_hourly_rate
      FROM job_records jr
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN invitations i ON jr.invitation_id = i.id
      GROUP BY p.payment_type
    `);

    console.table(wageStats.rows.map(row => ({
      'Wage Type': row.wage_type || 'Unknown',
      'Job Count': row.job_count,
      'Avg Hourly Rate': row.avg_hourly_rate ? `¥${parseFloat(row.avg_hourly_rate).toFixed(2)}` : 'N/A',
      'Min Hourly Rate': row.min_hourly_rate ? `¥${parseFloat(row.min_hourly_rate).toFixed(2)}` : 'N/A',
      'Max Hourly Rate': row.max_hourly_rate ? `¥${parseFloat(row.max_hourly_rate).toFixed(2)}` : 'N/A'
    })));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.detail) {
      console.error('   Detail:', error.detail);
    }
  } finally {
    await pool.end();
  }
}

// Execute the query
queryJobRecordsWithWage();