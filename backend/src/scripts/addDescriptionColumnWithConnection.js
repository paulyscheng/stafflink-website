const db = require('../config/database');
const logger = require('../utils/logger');

async function addDescriptionColumn() {
  try {
    console.log('🔧 正在添加description列到companies表...\n');
    
    // 确保数据库连接正常
    const testResult = await db.testConnection();
    if (!testResult) {
      console.error('❌ 无法连接到数据库，请检查配置');
      return;
    }
    
    // 首先检查列是否已经存在
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'description';
    `;
    
    try {
      const checkResult = await db.query(checkQuery);
      
      if (checkResult.rows.length > 0) {
        console.log('ℹ️  companies表中已存在description列');
        return;
      }
      
      // 添加description列
      const alterQuery = `
        ALTER TABLE companies 
        ADD COLUMN description TEXT;
      `;
      
      await db.query(alterQuery);
      console.log('✅ 成功添加description列到companies表');
      
      // 显示更新后的表结构
      const structureQuery = `
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'companies' 
        ORDER BY ordinal_position
        LIMIT 20;
      `;
      
      const structureResult = await db.query(structureQuery);
      
      console.log('\n📋 companies表结构（前20列）:');
      structureResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? '可空' : '非空'})`);
      });
      
      // 测试插入和查询
      console.log('\n🧪 测试description字段...');
      
      const testQuery = `
        UPDATE companies 
        SET description = '这是一个测试描述' 
        WHERE id = (SELECT id FROM companies LIMIT 1)
        RETURNING company_name, description;
      `;
      
      const testResult = await db.query(testQuery);
      if (testResult.rows.length > 0) {
        console.log('✅ description字段测试成功:', testResult.rows[0]);
      }
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  description列已存在');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ 添加description列时出错:', error.message);
    logger.error('Add description column error:', error);
  } finally {
    process.exit(0);
  }
}

// 运行脚本
console.log('📋 添加description列到companies表');
console.log('================================\n');
console.log('此脚本将：');
console.log('1. 检查companies表中是否已有description列');
console.log('2. 如果没有，添加TEXT类型的description列');
console.log('3. 显示更新后的表结构');
console.log('4. 进行简单的测试\n');
console.log('继续执行...\n');

addDescriptionColumn();