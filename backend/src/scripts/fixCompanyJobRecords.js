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

async function fixCompanyJobRecords() {
  try {
    console.log('🔧 修复工作记录的公司关联...\n');

    // 1. 获取正确的公司ID（蓝领科技有限公司）
    const companyResult = await pool.query(`
      SELECT id, company_name 
      FROM companies 
      WHERE phone = '13900139000'
    `);
    
    if (companyResult.rows.length === 0) {
      console.log('❌ 未找到测试公司（13900139000）');
      return;
    }
    
    const company = companyResult.rows[0];
    console.log('🏢 目标公司:', company.company_name);
    console.log('- ID:', company.id);

    // 2. 更新所有已完成的工作记录到正确的公司
    const updateResult = await pool.query(`
      UPDATE job_records
      SET company_id = $1
      WHERE status IN ('completed', 'confirmed', 'paid')
      RETURNING id, status
    `, [company.id]);

    console.log(`\n✅ 已更新 ${updateResult.rows.length} 条工作记录`);

    // 3. 同样更新相关的邀请记录
    const invitationResult = await pool.query(`
      UPDATE invitations
      SET company_id = $1
      WHERE id IN (
        SELECT invitation_id 
        FROM job_records 
        WHERE company_id = $1
      )
      RETURNING id
    `, [company.id]);

    console.log(`✅ 已更新 ${invitationResult.rows.length} 条邀请记录`);

    // 4. 更新项目记录
    const projectResult = await pool.query(`
      UPDATE projects
      SET company_id = $1
      WHERE id IN (
        SELECT DISTINCT project_id 
        FROM job_records 
        WHERE company_id = $1
      )
      RETURNING id, project_name
    `, [company.id]);

    console.log(`✅ 已更新 ${projectResult.rows.length} 个项目`);
    if (projectResult.rows.length > 0) {
      console.table(projectResult.rows);
    }

    // 5. 验证结果
    const verifyResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid
      FROM job_records
      WHERE company_id = $1
    `, [company.id]);

    console.log('\n📊 更新后的统计:');
    console.log('- 总工作记录:', verifyResult.rows[0].total);
    console.log('- 待确认 (completed):', verifyResult.rows[0].completed);
    console.log('- 已确认 (confirmed):', verifyResult.rows[0].confirmed);
    console.log('- 已支付 (paid):', verifyResult.rows[0].paid);

    console.log('\n🎉 修复完成！现在企业端应该能看到待确认的工作了。');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

fixCompanyJobRecords();