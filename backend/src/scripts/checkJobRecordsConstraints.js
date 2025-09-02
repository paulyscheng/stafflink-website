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

async function checkConstraints() {
  try {
    console.log('🔍 检查job_records表的约束...\n');

    // 检查外键约束
    const constraints = await pool.query(`
      SELECT 
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        confrelid::regclass AS foreign_table,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'job_records'::regclass
      AND contype = 'f'
    `);

    console.log('📋 外键约束:');
    console.table(constraints.rows);

    // 检查invitation_id列是否可以为NULL
    const columns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'job_records'
      AND column_name IN ('invitation_id', 'project_id', 'worker_id', 'company_id')
      ORDER BY ordinal_position
    `);

    console.log('\n📊 相关列信息:');
    console.table(columns.rows);

    console.log('\n💡 分析:');
    console.log('如果invitation_id有外键约束但不允许NULL，那么插入没有邀请的job_record会失败。');
    console.log('解决方案：要么移除外键约束，要么允许invitation_id为NULL。');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraints();