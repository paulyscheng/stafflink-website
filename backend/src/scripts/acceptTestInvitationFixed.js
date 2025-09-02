const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
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

async function acceptInvitation() {
  try {
    console.log('✅ 接受一个测试邀请...\n');

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

    // 2. 获取一个待处理的邀请
    const invitationResult = await pool.query(`
      SELECT 
        i.*,
        p.project_name,
        c.company_name
      FROM invitations i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE i.worker_id = $1 AND i.status = 'pending'
      ORDER BY i.created_at DESC
      LIMIT 1
    `, [worker.id]);

    if (invitationResult.rows.length === 0) {
      console.log('❌ 没有待处理的邀请');
      return;
    }

    const invitation = invitationResult.rows[0];
    console.log('\n📬 准备接受邀请:');
    console.log('- 项目:', invitation.project_name);
    console.log('- 企业:', invitation.company_name);
    console.log('- 邀请ID:', invitation.id);

    // 开始事务
    await pool.query('BEGIN');

    // 3. 更新邀请状态为已接受
    await pool.query(`
      UPDATE invitations 
      SET 
        status = 'accepted',
        updated_at = NOW()
      WHERE id = $1
    `, [invitation.id]);
    console.log('\n✅ 邀请状态已更新为 accepted');

    // 4. 创建工作记录
    const jobRecordId = uuidv4();
    await pool.query(`
      INSERT INTO job_records (
        id,
        invitation_id,
        project_id,
        worker_id,
        company_id,
        status,
        wage_amount,
        payment_type,
        start_date,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 'accepted', $6, $7, $8, NOW(), NOW()
      )
    `, [
      jobRecordId,
      invitation.id,
      invitation.project_id,
      invitation.worker_id,
      invitation.company_id,
      invitation.wage_amount || 0,
      invitation.wage_unit || 'hourly',
      invitation.start_date || new Date()
    ]);
    console.log('✅ 工作记录已创建');
    console.log('- Job Record ID:', jobRecordId);

    // 提交事务
    await pool.query('COMMIT');
    console.log('\n🎉 成功接受邀请并创建工作记录！');

    // 5. 验证数据
    console.log('\n📊 验证数据:');
    
    // 检查待处理的邀请
    const pendingCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM invitations
      WHERE worker_id = $1 AND status = 'pending'
    `, [worker.id]);
    console.log('- 待处理邀请数:', pendingCount.rows[0].count);
    
    // 检查已接受的邀请
    const acceptedCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM invitations
      WHERE worker_id = $1 AND status = 'accepted'
    `, [worker.id]);
    console.log('- 已接受邀请数:', acceptedCount.rows[0].count);

    // 检查工作记录
    const jobCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM job_records
      WHERE worker_id = $1
    `, [worker.id]);
    console.log('- 工作记录数:', jobCount.rows[0].count);

    // 显示工作记录详情
    const jobs = await pool.query(`
      SELECT 
        jr.id,
        jr.status,
        p.project_name,
        c.company_name
      FROM job_records jr
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN companies c ON jr.company_id = c.id
      WHERE jr.worker_id = $1
    `, [worker.id]);
    
    console.log('\n📋 工作记录详情:');
    console.table(jobs.rows);

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

acceptInvitation();