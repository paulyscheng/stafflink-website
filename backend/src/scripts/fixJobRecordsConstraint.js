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

async function fixConstraint() {
  try {
    console.log('🔧 修复job_records表的外键约束...\n');

    // 1. 删除错误的外键约束
    console.log('1. 删除错误的外键约束...');
    try {
      await pool.query(`
        ALTER TABLE job_records 
        DROP CONSTRAINT IF EXISTS job_records_invitation_id_fkey
      `);
      console.log('✅ 已删除旧约束');
    } catch (error) {
      console.log('⚠️ 旧约束可能不存在:', error.message);
    }

    // 2. 添加正确的外键约束（引用invitations表）
    console.log('\n2. 添加正确的外键约束...');
    try {
      await pool.query(`
        ALTER TABLE job_records 
        ADD CONSTRAINT job_records_invitation_id_fkey 
        FOREIGN KEY (invitation_id) 
        REFERENCES invitations(id) 
        ON DELETE CASCADE
      `);
      console.log('✅ 已添加新约束');
    } catch (error) {
      console.log('⚠️ 添加约束失败:', error.message);
    }

    // 3. 验证约束
    console.log('\n3. 验证新约束...');
    const constraints = await pool.query(`
      SELECT 
        conname AS constraint_name,
        confrelid::regclass AS references_table,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'job_records'::regclass
      AND conname = 'job_records_invitation_id_fkey'
    `);

    if (constraints.rows.length > 0) {
      console.log('✅ 新约束已创建:');
      console.table(constraints.rows);
    } else {
      console.log('⚠️ 未找到新约束');
    }

    // 4. 检查invitations表是否存在
    console.log('\n4. 验证invitations表...');
    const invitationsTable = await pool.query(`
      SELECT COUNT(*) as count FROM invitations
    `);
    console.log(`✅ invitations表存在，包含 ${invitationsTable.rows[0].count} 条记录`);

    console.log('\n🎉 外键约束修复完成！');
    console.log('现在job_records.invitation_id正确引用invitations.id了');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

fixConstraint();