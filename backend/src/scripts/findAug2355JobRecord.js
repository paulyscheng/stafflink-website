const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function findAug2355JobRecord() {
  try {
    console.log('🔍 Searching for job record created on Aug 23 at 55 minutes past the hour...\n');

    // Query to find job records created on Aug 23 at XX:55
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
        jr.updated_at,
        
        -- Worker information
        w.id as worker_id,
        w.name as worker_name,
        w.phone as worker_phone,
        
        -- Company information
        c.id as company_id,
        c.company_name,
        c.phone as company_phone,
        
        -- Project information
        p.id as project_id,
        p.project_name,
        p.project_address,
        p.payment_type as project_payment_type,
        p.daily_wage as project_daily_wage,
        p.original_wage as project_original_wage,
        p.wage_unit as project_wage_unit,
        p.required_workers,
        
        -- Invitation wage information
        i.id as invitation_id,
        i.wage_amount as invitation_wage_amount,
        i.original_wage as invitation_original_wage,
        i.wage_unit as invitation_wage_unit,
        i.status as invitation_status,
        
        -- Calculate hourly wage based on payment type
        CASE 
          WHEN p.payment_type = 'hourly' THEN 
            COALESCE(i.original_wage, p.original_wage, p.daily_wage / 8.0)
          WHEN p.payment_type = 'daily' THEN 
            COALESCE(p.daily_wage, i.wage_amount, jr.wage_amount) / 8.0
          WHEN p.payment_type = 'fixed' THEN
            COALESCE(p.original_wage, i.wage_amount, jr.wage_amount) / 
            GREATEST(EXTRACT(EPOCH FROM (jr.end_date - jr.start_date)) / 3600, 8)
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
      WHERE 
        -- Filter for Aug 23 and minute = 55
        EXTRACT(MONTH FROM jr.created_at) = 8
        AND EXTRACT(DAY FROM jr.created_at) = 23
        AND EXTRACT(MINUTE FROM jr.created_at) = 55
      ORDER BY jr.created_at DESC
    `;

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ No job record found created on Aug 23 at XX:55\n');
      
      // Let's check recent job records to help identify the correct one
      console.log('📋 Recent job records for reference:\n');
      const recentQuery = `
        SELECT 
          id,
          created_at,
          TO_CHAR(created_at, 'Mon DD HH24:MI') as formatted_time,
          status,
          worker_id,
          company_id,
          project_id
        FROM job_records
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const recentResult = await pool.query(recentQuery);
      console.table(recentResult.rows);
      
    } else {
      console.log(`✅ Found ${result.rows.length} job record(s) created on Aug 23 at XX:55\n`);

      // Display complete job record information
      result.rows.forEach((job, index) => {
        console.log(`${'='.repeat(60)}`);
        console.log(`📄 JOB RECORD DETAILS [${index + 1}/${result.rows.length}]`);
        console.log(`${'='.repeat(60)}\n`);
        
        console.log(`🆔 基本信息 (Basic Info):`);
        console.log(`   工单ID (Job ID): ${job.job_record_id}`);
        console.log(`   状态 (Status): ${job.status}`);
        console.log(`   创建时间 (Created): ${new Date(job.created_at).toLocaleString('zh-CN')}`);
        console.log(`   更新时间 (Updated): ${new Date(job.updated_at).toLocaleString('zh-CN')}`);
        
        console.log(`\n👷 工人信息 (Worker Info):`);
        console.log(`   工人ID (Worker ID): ${job.worker_id}`);
        console.log(`   姓名 (Name): ${job.worker_name}`);
        console.log(`   电话 (Phone): ${job.worker_phone}`);
        
        console.log(`\n🏢 企业信息 (Company Info):`);
        console.log(`   企业ID (Company ID): ${job.company_id}`);
        console.log(`   企业名称 (Name): ${job.company_name}`);
        console.log(`   联系电话 (Phone): ${job.company_phone}`);
        
        console.log(`\n📋 项目信息 (Project Info):`);
        console.log(`   项目ID (Project ID): ${job.project_id}`);
        console.log(`   项目名称 (Name): ${job.project_name}`);
        console.log(`   工作地址 (Address): ${job.project_address}`);
        console.log(`   需要人数 (Required Workers): ${job.required_workers}`);
        
        console.log(`\n💰 工资信息 (Wage Information):`);
        console.log(`   支付类型 (Payment Type): ${job.project_payment_type || 'N/A'}`);
        console.log(`   工资显示 (Wage Display): ${job.wage_display}`);
        console.log(`   计算时薪 (Calculated Hourly Rate): ¥${job.calculated_hourly_wage ? parseFloat(job.calculated_hourly_wage).toFixed(2) : 'N/A'}/小时`);
        
        if (job.project_payment_type === 'daily') {
          console.log(`   日薪 (Daily Wage): ¥${job.project_daily_wage || job.invitation_wage_amount || 'N/A'}/天`);
        } else if (job.project_payment_type === 'fixed') {
          console.log(`   总价 (Fixed Price): ¥${job.project_original_wage || job.invitation_wage_amount || 'N/A'}`);
        }
        
        console.log(`\n📅 工作时间 (Work Schedule):`);
        console.log(`   开始日期 (Start Date): ${job.start_date ? new Date(job.start_date).toLocaleDateString('zh-CN') : '待定'}`);
        console.log(`   结束日期 (End Date): ${job.end_date ? new Date(job.end_date).toLocaleDateString('zh-CN') : '待定'}`);
        
        if (job.actual_hours) {
          console.log(`   实际工时 (Actual Hours): ${job.actual_hours} 小时`);
          const estimatedPayment = parseFloat(job.calculated_hourly_wage) * parseFloat(job.actual_hours);
          console.log(`   预计收入 (Estimated Payment): ¥${estimatedPayment.toFixed(2)}`);
        }
        
        console.log(`\n✅ 确认状态 (Confirmation Status):`);
        console.log(`   工人确认 (Worker Confirmed): ${job.worker_confirmed ? '已确认' : '未确认'}`);
        console.log(`   企业确认 (Company Confirmed): ${job.company_confirmed ? '已确认' : '未确认'}`);
        console.log(`   支付状态 (Payment Status): ${job.payment_status || '待支付'}`);
        
        if (job.job_wage_amount) {
          console.log(`   最终工资 (Final Wage): ¥${job.job_wage_amount}`);
        }
        
        console.log(`\n${'='.repeat(60)}\n`);
      });
    }

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
findAug2355JobRecord();