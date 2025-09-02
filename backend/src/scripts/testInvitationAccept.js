const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function testInvitationAccept() {
  console.log('🧪 测试邀请接受流程...\n');

  try {
    // 1. 显示job_records表的正确字段
    console.log('📋 job_records表结构:');
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'job_records'
      ORDER BY ordinal_position
    `);
    
    console.table(tableInfo.rows.map(col => ({
      字段名: col.column_name,
      数据类型: col.data_type,
      可为空: col.is_nullable
    })));

    // 2. 验证正确的INSERT语句
    console.log('\n✅ 正确的job_records插入语句:');
    console.log(`
    INSERT INTO job_records (
      id,
      invitation_id,
      project_id,
      worker_id,
      company_id,
      start_date,      -- NOT work_date
      status,          -- 应该是 'active'
      wage_amount,     -- NOT payment_amount
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    `);

    // 3. 常见错误提醒
    console.log('\n⚠️  常见错误:');
    console.log('  ❌ work_date → ✅ start_date');
    console.log('  ❌ payment_amount → ✅ wage_amount');
    console.log('  ❌ payment_type → 不需要此字段');
    console.log('  ❌ status = "accepted" → ✅ status = "active"');
    console.log('  ❌ wage_offer → ✅ wage_amount');

    // 4. 查看最近创建的job_records
    console.log('\n📊 最近创建的job_records:');
    const recentJobs = await pool.query(`
      SELECT 
        jr.id,
        jr.status,
        jr.start_date,
        jr.wage_amount,
        jr.created_at,
        w.name as worker_name,
        p.project_name
      FROM job_records jr
      LEFT JOIN workers w ON jr.worker_id = w.id
      LEFT JOIN projects p ON jr.project_id = p.id
      ORDER BY jr.created_at DESC
      LIMIT 5
    `);
    
    if (recentJobs.rows.length > 0) {
      console.table(recentJobs.rows.map(job => ({
        ID: job.id.slice(0, 8) + '...',
        状态: job.status,
        开始日期: job.start_date ? new Date(job.start_date).toLocaleDateString('zh-CN') : 'N/A',
        工资金额: job.wage_amount ? `¥${job.wage_amount}` : 'N/A',
        工人: job.worker_name,
        项目: job.project_name,
        创建时间: new Date(job.created_at).toLocaleString('zh-CN')
      })));
    } else {
      console.log('  暂无记录');
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

testInvitationAccept();