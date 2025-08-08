const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function testDatabase() {
  console.log('🔍 测试数据库连接...\n');
  
  try {
    // 1. 测试基本连接
    console.log('1️⃣ 测试基本连接...');
    const timeResult = await db.query('SELECT NOW() as current_time');
    console.log('✅ 数据库连接成功！');
    console.log(`   当前时间: ${timeResult.rows[0].current_time}\n`);
    
    // 2. 检查表是否存在
    console.log('2️⃣ 检查数据库表...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    const tablesResult = await db.query(tablesQuery);
    console.log(`✅ 找到 ${tablesResult.rows.length} 个表:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');
    
    // 3. 检查数据统计
    console.log('3️⃣ 数据统计:');
    
    // 统计工人数量
    const workersCount = await db.query('SELECT COUNT(*) as count FROM workers');
    console.log(`   工人总数: ${workersCount.rows[0].count}`);
    
    // 统计企业数量
    const companiesCount = await db.query('SELECT COUNT(*) as count FROM companies');
    console.log(`   企业总数: ${companiesCount.rows[0].count}`);
    
    // 统计项目数量
    const projectsCount = await db.query('SELECT COUNT(*) as count FROM projects');
    console.log(`   项目总数: ${projectsCount.rows[0].count}`);
    
    // 统计邀请数量
    const invitationsCount = await db.query('SELECT COUNT(*) as count FROM invitations');
    console.log(`   邀请总数: ${invitationsCount.rows[0].count}`);
    console.log('');
    
    // 4. 测试写入操作
    console.log('4️⃣ 测试写入操作...');
    const testQuery = `
      INSERT INTO test_table (test_field) 
      VALUES ('test_' || NOW()::text) 
      RETURNING *
    `;
    
    // 先创建测试表（如果不存在）
    await db.query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        test_field TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    const writeResult = await db.query(testQuery);
    console.log('✅ 写入测试成功！');
    console.log(`   测试记录ID: ${writeResult.rows[0].id}`);
    
    // 清理测试数据
    await db.query('DELETE FROM test_table WHERE id = $1', [writeResult.rows[0].id]);
    console.log('   测试数据已清理\n');
    
    console.log('🎉 数据库完全正常！所有测试通过！');
    
  } catch (error) {
    console.error('❌ 数据库测试失败！');
    console.error('错误详情:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n可能的原因:');
      console.error('1. 数据库服务器已关闭');
      console.error('2. 网络连接问题');
      console.error('3. 防火墙阻止连接');
    } else if (error.code === '28P01') {
      console.error('\n认证失败，请检查用户名和密码');
    } else if (error.code === '3D000') {
      console.error('\n数据库不存在');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('\n连接超时，可能是:');
      console.error('1. 数据库服务器地址错误');
      console.error('2. 数据库服务已到期或被关闭');
      console.error('3. 网络问题');
    }
    
    console.error('\n当前数据库配置:');
    console.error(`Host: ${process.env.DB_HOST}`);
    console.error(`Port: ${process.env.DB_PORT}`);
    console.error(`Database: ${process.env.DB_NAME}`);
    console.error(`User: ${process.env.DB_USER}`);
  } finally {
    process.exit();
  }
}

testDatabase();