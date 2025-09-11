const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function updateCompanyRatings() {
  try {
    console.log('🔍 更新企业评分默认值...\n');
    
    // 1. 查询当前没有评分的企业
    console.log('1️⃣ 查找评分为NULL的企业...');
    const nullRatingCompanies = await db.query(
      "SELECT id, company_name, rating FROM companies WHERE rating IS NULL"
    );
    console.log(`找到 ${nullRatingCompanies.rows.length} 个评分为NULL的企业`);
    
    // 2. 将NULL评分更新为0
    if (nullRatingCompanies.rows.length > 0) {
      console.log('\n2️⃣ 将NULL评分更新为0...');
      const updateResult = await db.query(
        "UPDATE companies SET rating = 0 WHERE rating IS NULL"
      );
      console.log(`✅ 更新了 ${updateResult.rowCount} 个企业的评分为0`);
    }
    
    // 3. 显示所有企业的评分状态
    console.log('\n3️⃣ 所有企业的评分状态:');
    const allCompanies = await db.query(
      "SELECT id, company_name, rating FROM companies ORDER BY created_at DESC LIMIT 10"
    );
    
    allCompanies.rows.forEach(company => {
      console.log(`   ${company.company_name}: ${company.rating || '0'} 分`);
    });
    
    console.log('\n✅ 评分更新完成！');
    console.log('说明：新注册企业的评分默认为0，当有工人评价后才会显示评分');
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

updateCompanyRatings();