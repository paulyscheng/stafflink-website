const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function findCleaningStaffJob() {
  try {
    console.log('🔍 Searching for Cleaning staff job with ¥400/hour wage...\n');

    // First, find all projects named "Cleaning staff"
    const projectQuery = `
      SELECT 
        p.id,
        p.project_name,
        p.title,
        p.description,
        p.project_address,
        p.payment_type,
        p.daily_wage,
        p.original_wage,
        p.wage_unit,
        p.budget_range,
        p.start_date,
        p.created_at,
        c.company_name
      FROM projects p
      LEFT JOIN companies c ON p.company_id = c.id
      WHERE p.title = 'Cleaning staff' 
         OR p.project_name = 'Cleaning staff' 
         OR p.description = 'Cleaning staff'
      ORDER BY p.created_at DESC
    `;

    const projectResult = await pool.query(projectQuery);
    
    console.log(`📋 Found ${projectResult.rows.length} project(s) named "Cleaning staff"\n`);
    
    projectResult.rows.forEach((project, index) => {
      console.log(`[${index + 1}] Project: ${project.id}`);
      console.log(`   Name/Title: ${project.project_name || project.title}`);
      console.log(`   Description: ${project.description}`);
      console.log(`   Address: ${project.project_address}`);
      console.log(`   Company: ${project.company_name}`);
      console.log(`   Payment Type: ${project.payment_type}`);
      console.log(`   Daily Wage: ¥${project.daily_wage || 'N/A'}`);
      console.log(`   Original Wage: ¥${project.original_wage || 'N/A'}`);
      console.log(`   Wage Unit: ${project.wage_unit || 'N/A'}`);
      console.log(`   Budget Range: ${project.budget_range || 'N/A'}`);
      console.log(`   Start Date: ${project.start_date ? new Date(project.start_date).toLocaleDateString('zh-CN') : 'N/A'}`);
      console.log(`   Created: ${new Date(project.created_at).toLocaleString('zh-CN')}`);
      
      // Calculate hourly rate
      if (project.payment_type === 'hourly') {
        console.log(`   💰 Hourly Rate: ¥${project.original_wage || project.daily_wage / 8}/hour`);
      } else if (project.payment_type === 'daily') {
        console.log(`   💰 Hourly Rate (calculated): ¥${(project.daily_wage / 8).toFixed(2)}/hour`);
      }
      console.log('');
    });

    // Now find job records related to these projects
    console.log('\n🔍 Finding job records for Cleaning staff projects...\n');
    
    const jobRecordQuery = `
      SELECT 
        jr.id as job_record_id,
        jr.status,
        jr.wage_amount,
        jr.created_at as job_created_at,
        
        -- Worker info
        w.name as worker_name,
        
        -- Project info
        p.id as project_id,
        p.project_name,
        p.title,
        p.payment_type,
        p.daily_wage,
        p.original_wage,
        p.wage_unit,
        
        -- Invitation info
        i.id as invitation_id,
        i.wage_amount as invitation_wage,
        i.original_wage as invitation_original_wage,
        i.wage_unit as invitation_wage_unit,
        
        -- Calculate what might be shown as hourly rate
        CASE 
          WHEN p.payment_type = 'hourly' THEN 
            COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
          WHEN p.payment_type = 'daily' THEN 
            p.daily_wage / 8.0
          ELSE 
            COALESCE(jr.wage_amount, i.wage_amount, p.daily_wage) / 8.0
        END as calculated_hourly
        
      FROM job_records jr
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN workers w ON jr.worker_id = w.id
      LEFT JOIN invitations i ON jr.invitation_id = i.id
      WHERE p.title = 'Cleaning staff' 
         OR p.project_name = 'Cleaning staff' 
         OR p.description = 'Cleaning staff'
      ORDER BY jr.created_at DESC
    `;
    
    const jobResult = await pool.query(jobRecordQuery);
    
    console.log(`📊 Found ${jobResult.rows.length} job record(s) for Cleaning staff\n`);
    
    jobResult.rows.forEach((job, index) => {
      console.log(`[${index + 1}] Job Record: ${job.job_record_id}`);
      console.log(`   Worker: ${job.worker_name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Project: ${job.project_name || job.title}`);
      console.log(`   Payment Type: ${job.payment_type}`);
      console.log(`   Project Daily Wage: ¥${job.daily_wage || 'N/A'}`);
      console.log(`   Project Original Wage: ¥${job.original_wage || 'N/A'} per ${job.wage_unit || 'unit'}`);
      console.log(`   Invitation Wage: ¥${job.invitation_wage || 'N/A'}`);
      console.log(`   Invitation Original Wage: ¥${job.invitation_original_wage || 'N/A'}`);
      console.log(`   Job Record Wage: ¥${job.wage_amount || 'N/A'}`);
      console.log(`   Calculated Hourly: ¥${parseFloat(job.calculated_hourly).toFixed(2)}/hour`);
      console.log(`   Created: ${new Date(job.job_created_at).toLocaleString('zh-CN')}`);
      console.log('');
    });

    // Check if there's a wage display issue
    console.log('\n🔍 Checking for potential wage display issues...\n');
    
    // Check if daily wage might be displayed as hourly
    projectResult.rows.forEach(project => {
      if (project.daily_wage == 400) {
        console.log(`⚠️  WARNING: Project ${project.id} has daily wage of ¥400`);
        console.log(`   This might be displayed as ¥400/hour in the UI`);
        console.log(`   Actual hourly rate should be: ¥${(400/8).toFixed(2)}/hour`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Execute the query
findCleaningStaffJob();