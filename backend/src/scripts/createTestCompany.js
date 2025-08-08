const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function createTestCompany() {
  try {
    console.log('🏢 创建测试企业账号...\n');
    
    // 检查是否已存在测试企业
    const existingCompany = await db.query(
      `SELECT * FROM companies WHERE phone = $1`,
      ['13900139000']
    );
    
    if (existingCompany.rows.length > 0) {
      console.log('✅ 测试企业已存在:');
      console.log(`   公司名: ${existingCompany.rows[0].company_name}`);
      console.log(`   电话: ${existingCompany.rows[0].phone}`);
      console.log(`   ID: ${existingCompany.rows[0].id}`);
      console.log('\n📱 登录信息:');
      console.log('   手机号: 13900139000');
      console.log('   验证码: 123456');
      return;
    }
    
    // 创建新的测试企业
    const result = await db.query(`
      INSERT INTO companies (
        company_name, 
        contact_person, 
        phone, 
        email, 
        address,
        rating,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      '蓝领科技有限公司',
      '张总',
      '13900139000',
      'test@bluecollar.com',
      '北京市朝阳区建国路88号',
      4.8,
      'active'
    ]);
    
    const company = result.rows[0];
    
    console.log('✅ 测试企业创建成功！');
    console.log(`   公司名: ${company.company_name}`);
    console.log(`   联系人: ${company.contact_person}`);
    console.log(`   电话: ${company.phone}`);
    console.log(`   邮箱: ${company.email}`);
    console.log(`   地址: ${company.address}`);
    console.log(`   ID: ${company.id}`);
    console.log('\n📱 登录信息:');
    console.log('   手机号: 13900139000');
    console.log('   验证码: 123456');
    console.log('\n💡 提示: 在authController.js中已配置测试验证码');
    
  } catch (error) {
    console.error('❌ 创建测试企业失败:', error);
  } finally {
    process.exit();
  }
}

createTestCompany();