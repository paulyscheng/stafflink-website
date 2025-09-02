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

async function checkStatus() {
  try {
    console.log('📊 检查工作确认状态...\n');

    const result = await pool.query(`
      SELECT 
        jr.id,
        jr.status,
        jr.complete_time,
        jr.confirm_time,
        jr.quality_rating,
        jr.confirmation_notes,
        jr.payment_amount,
        jr.payment_status,
        w.name as worker_name,
        c.company_name,
        p.project_name
      FROM job_records jr
      LEFT JOIN workers w ON jr.worker_id = w.id
      LEFT JOIN companies c ON jr.company_id = c.id
      LEFT JOIN projects p ON jr.project_id = p.id
      WHERE jr.company_id = '3f5a4bfa-3116-4185-9284-99673c18c276'
      ORDER BY jr.updated_at DESC
    `);

    console.log('🏢 蓝领科技有限公司的工作记录:\n');
    
    result.rows.forEach((job, index) => {
      console.log(`[${index + 1}] ${job.project_name} - ${job.worker_name}`);
      console.log(`   状态: ${job.status}`);
      console.log(`   完成时间: ${job.complete_time ? new Date(job.complete_time).toLocaleString('zh-CN') : '未完成'}`);
      console.log(`   确认时间: ${job.confirm_time ? new Date(job.confirm_time).toLocaleString('zh-CN') : '未确认'}`);
      console.log(`   质量评分: ${job.quality_rating || '未评分'}`);
      console.log(`   确认说明: ${job.confirmation_notes || '无'}`);
      console.log(`   支付金额: ¥${job.payment_amount || 0}`);
      console.log(`   支付状态: ${job.payment_status || '未支付'}`);
      console.log('');
    });

    // 统计
    const stats = {
      total: result.rows.length,
      completed: result.rows.filter(r => r.status === 'completed').length,
      confirmed: result.rows.filter(r => r.status === 'confirmed').length,
      paid: result.rows.filter(r => r.status === 'paid').length
    };

    console.log('📈 状态统计:');
    console.log(`   总计: ${stats.total}`);
    console.log(`   待确认 (completed): ${stats.completed}`);
    console.log(`   已确认 (confirmed): ${stats.confirmed}`);
    console.log(`   已支付 (paid): ${stats.paid}`);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkStatus();