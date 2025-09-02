const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function testJobRecordsAPI() {
  try {
    console.log('🔍 Testing Job Records API Query Structure...\n');

    // Get a sample worker ID
    const worker = await pool.query("SELECT id, name FROM workers LIMIT 1");
    if (worker.rows.length === 0) {
      console.log('❌ No workers found');
      return;
    }

    const workerId = worker.rows[0].id;
    console.log(`Testing with worker: ${worker.rows[0].name} (${workerId})\n`);

    // Corrected API query based on actual schema
    console.log('📊 Corrected API Query for getWorkerJobs:\n');
    
    const query = `
      SELECT 
        jr.*,
        -- Project information
        p.project_name,
        p.project_address,
        p.start_date as project_start_date,
        p.end_date as project_end_date,
        p.start_time,
        p.end_time,
        p.work_description,
        p.required_workers,
        p.estimated_duration,
        p.payment_type,
        p.daily_wage,
        p.original_wage as project_original_wage,
        p.wage_unit as project_wage_unit,
        
        -- Company information
        c.company_name,
        c.phone as company_phone,
        
        -- Invitation wage information (if available)
        i.wage_amount as invitation_wage_amount,
        i.original_wage as invitation_original_wage,
        i.wage_unit as invitation_wage_unit,
        
        -- Calculate hourly wage for display
        CASE 
          WHEN p.payment_type = 'hourly' THEN 
            COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
          ELSE 
            COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount) / 8.0
        END as hourly_rate,
        
        -- Wage display format for UI
        CASE 
          WHEN p.payment_type = 'hourly' THEN 
            COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)::text || '元/小时'
          WHEN p.payment_type = 'daily' THEN 
            COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount)::text || '元/天'
          WHEN p.payment_type = 'fixed' THEN 
            COALESCE(p.original_wage, i.wage_amount, jr.wage_amount)::text || '元(总价)'
          ELSE 
            COALESCE(jr.wage_amount, p.daily_wage)::text || '元'
        END as wage_display
        
      FROM job_records jr
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN companies c ON jr.company_id = c.id
      LEFT JOIN invitations i ON jr.invitation_id = i.id
      WHERE jr.worker_id = $1
      AND jr.status NOT IN ('rejected', 'cancelled')
      ORDER BY jr.created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [workerId]);

    console.log(`Found ${result.rows.length} job record(s) for worker\n`);

    // Display results
    result.rows.forEach((job, index) => {
      console.log(`[${index + 1}] Job Record`);
      console.log(`   Project: ${job.project_name}`);
      console.log(`   Company: ${job.company_name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Payment Type: ${job.payment_type}`);
      console.log(`   Wage Display: ${job.wage_display}`);
      console.log(`   Hourly Rate: ¥${job.hourly_rate ? parseFloat(job.hourly_rate).toFixed(2) : 'N/A'}/hour`);
      
      if (job.actual_hours) {
        console.log(`   Actual Hours: ${job.actual_hours}`);
        console.log(`   Wage Amount: ¥${job.wage_amount || 'N/A'}`);
      }
      console.log('');
    });

    // Show the corrected controller code
    console.log('\n📝 Suggested jobController.js Update:\n');
    console.log(`
// In getWorkerJobs function, update the query to:
const getWorkerJobs = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    let query = \`
      SELECT 
        jr.*,
        p.project_name,
        p.project_address,
        p.start_date as project_start_date,
        p.end_date as project_end_date,
        p.start_time,
        p.end_time,
        p.work_description,
        p.required_workers,
        p.estimated_duration,
        p.payment_type,
        p.daily_wage,
        p.original_wage,
        p.wage_unit,
        c.company_name,
        c.phone as company_phone,
        i.wage_amount as invitation_wage,
        i.original_wage as invitation_original_wage,
        i.wage_unit as invitation_wage_unit,
        -- Calculate hourly rate
        CASE 
          WHEN p.payment_type = 'hourly' THEN 
            COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
          ELSE 
            COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount) / 8.0
        END as hourly_rate
      FROM job_records jr
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN companies c ON jr.company_id = c.id
      LEFT JOIN invitations i ON jr.invitation_id = i.id
      WHERE jr.worker_id = $1
      AND jr.status NOT IN ('rejected', 'cancelled')
    \`;
    
    // ... rest of the function
  }
};
`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Execute
testJobRecordsAPI();