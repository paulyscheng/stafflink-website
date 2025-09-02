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

async function checkData() {
  try {
    console.log('🔍 检查邀请和工作记录数据...\n');

    // 1. 获取测试工人账号 (李师傅)
    const workerResult = await pool.query(`
      SELECT id, name, phone 
      FROM workers 
      WHERE phone = '13800138002'
    `);
    
    if (workerResult.rows.length === 0) {
      console.log('❌ 未找到测试工人账号（李师傅 13800138002）');
      return;
    }
    
    const worker = workerResult.rows[0];
    console.log('👷 工人信息:', worker);
    console.log('');

    // 2. 检查待处理的邀请
    const pendingInvitations = await pool.query(`
      SELECT 
        i.id,
        i.status,
        i.created_at,
        p.project_name,
        c.company_name
      FROM invitations i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE i.worker_id = $1 AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `, [worker.id]);

    console.log(`📬 待处理邀请数量: ${pendingInvitations.rows.length}`);
    if (pendingInvitations.rows.length > 0) {
      console.table(pendingInvitations.rows);
    }
    console.log('');

    // 3. 检查已接受的邀请
    const acceptedInvitations = await pool.query(`
      SELECT 
        i.id,
        i.status,
        i.created_at,
        p.project_name,
        c.company_name
      FROM invitations i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE i.worker_id = $1 AND i.status = 'accepted'
      ORDER BY i.created_at DESC
    `, [worker.id]);

    console.log(`✅ 已接受邀请数量: ${acceptedInvitations.rows.length}`);
    if (acceptedInvitations.rows.length > 0) {
      console.table(acceptedInvitations.rows);
    }
    console.log('');

    // 4. 检查工作记录
    const jobRecords = await pool.query(`
      SELECT 
        jr.id,
        jr.status,
        jr.created_at,
        jr.invitation_id,
        p.project_name,
        c.company_name
      FROM job_records jr
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN companies c ON jr.company_id = c.id
      WHERE jr.worker_id = $1
      ORDER BY jr.created_at DESC
    `, [worker.id]);

    console.log(`💼 工作记录数量: ${jobRecords.rows.length}`);
    if (jobRecords.rows.length > 0) {
      console.table(jobRecords.rows);
    }
    console.log('');

    // 5. 检查数据一致性
    console.log('🔍 数据一致性检查:');
    
    // 检查是否有已接受的邀请没有对应的job_record
    const missingJobRecords = await pool.query(`
      SELECT 
        i.id as invitation_id,
        i.status,
        p.project_name
      FROM invitations i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN job_records jr ON jr.invitation_id = i.id
      WHERE i.worker_id = $1 
      AND i.status = 'accepted'
      AND jr.id IS NULL
    `, [worker.id]);

    if (missingJobRecords.rows.length > 0) {
      console.log('⚠️ 发现已接受的邀请没有对应的工作记录:');
      console.table(missingJobRecords.rows);
    } else {
      console.log('✅ 所有已接受的邀请都有对应的工作记录');
    }

    // 检查是否有job_record没有对应的邀请
    const orphanJobRecords = await pool.query(`
      SELECT 
        jr.id as job_record_id,
        jr.invitation_id,
        jr.status,
        p.project_name
      FROM job_records jr
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN invitations i ON jr.invitation_id = i.id
      WHERE jr.worker_id = $1 
      AND i.id IS NULL
      AND jr.invitation_id IS NOT NULL
    `, [worker.id]);

    if (orphanJobRecords.rows.length > 0) {
      console.log('⚠️ 发现工作记录引用了不存在的邀请:');
      console.table(orphanJobRecords.rows);
    } else {
      console.log('✅ 所有工作记录的邀请引用都有效');
    }

    console.log('\n📊 数据汇总:');
    console.log(`- 待处理邀请: ${pendingInvitations.rows.length}`);
    console.log(`- 已接受邀请: ${acceptedInvitations.rows.length}`);
    console.log(`- 工作记录: ${jobRecords.rows.length}`);
    console.log(`- 数据一致性问题: ${missingJobRecords.rows.length + orphanJobRecords.rows.length}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();