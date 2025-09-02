const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function fullDatabaseAudit() {
  console.log('🔍 全面数据库字段审计...\n');

  try {
    // 获取所有表
    const tablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    const tables = await pool.query(tablesQuery);
    
    const tableStructures = {};
    
    // 获取每个表的结构
    for (const table of tables.rows) {
      const tableName = table.tablename;
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `;
      
      const columns = await pool.query(columnsQuery, [tableName]);
      tableStructures[tableName] = columns.rows.map(col => col.column_name);
      
      console.log(`\n📋 ${tableName} 表字段:`);
      console.log(columns.rows.map(col => `  - ${col.column_name} (${col.data_type})`).join('\n'));
    }
    
    // 保存结果到文件
    const fs = require('fs');
    const result = {
      timestamp: new Date().toISOString(),
      tables: tableStructures
    };
    
    fs.writeFileSync(
      require('path').join(__dirname, 'database-structure.json'),
      JSON.stringify(result, null, 2)
    );
    
    console.log('\n✅ 数据库结构已保存到 database-structure.json');
    
    // 检查常见的字段命名问题
    console.log('\n⚠️  潜在的字段命名问题:');
    
    for (const [tableName, fields] of Object.entries(tableStructures)) {
      // 检查可能的错误字段名
      const suspiciousFields = fields.filter(field => 
        field.includes('_offer') || 
        field.includes('_message') && !field.includes('response_note') ||
        field.includes('work_date') ||
        field.includes('payment_amount') ||
        field.includes('payment_type') && tableName === 'job_records' ||
        field.includes('receiver_id') && tableName === 'notifications'
      );
      
      if (suspiciousFields.length > 0) {
        console.log(`\n${tableName}:`);
        suspiciousFields.forEach(field => {
          console.log(`  ⚠️  ${field}`);
        });
      }
    }
    
    return tableStructures;
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

// 执行审计
fullDatabaseAudit();