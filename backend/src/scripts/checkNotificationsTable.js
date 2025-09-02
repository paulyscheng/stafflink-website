const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function checkNotificationsTable() {
  try {
    console.log('🔍 检查 notifications 表结构...\n');

    // 获取表结构
    const query = `
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `;

    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ notifications 表不存在！');
      return;
    }

    console.log('✅ notifications 表字段:');
    console.table(result.rows.map(col => ({
      字段名: col.column_name,
      数据类型: col.data_type,
      最大长度: col.character_maximum_length || '-',
      可为空: col.is_nullable,
      默认值: col.column_default || '无'
    })));

    // 显示示例数据
    const sampleData = await pool.query('SELECT * FROM notifications LIMIT 2');
    if (sampleData.rows.length > 0) {
      console.log('\n📊 示例数据:');
      console.log(JSON.stringify(sampleData.rows[0], null, 2));
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkNotificationsTable();