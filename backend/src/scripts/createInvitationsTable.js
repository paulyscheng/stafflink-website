const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function createInvitationsTable() {
  try {
    // 读取SQL文件
    const sqlPath = path.join(__dirname, '../../../database/create_invitations_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📋 正在连接腾讯云数据库...');
    console.log('🏗️  创建invitations表...');
    
    // 执行SQL
    await db.query(sql);
    
    console.log('✅ invitations表创建成功！');
    
    // 验证表是否创建成功
    const checkTable = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'invitations'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 表结构：');
    console.table(checkTable.rows);
    
    // 检查索引
    const checkIndexes = await db.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'invitations';
    `);
    
    console.log('\n🔍 索引：');
    checkIndexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
    });
    
  } catch (error) {
    console.error('❌ 创建表失败:', error.message);
    console.error(error);
  } finally {
    process.exit();
  }
}

createInvitationsTable();