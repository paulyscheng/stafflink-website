const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function cleanSmsCodeTable() {
  try {
    console.log('🧹 清理验证码表...');
    
    // 删除企业测试账号的所有验证码记录
    const result = await db.query(
      `DELETE FROM sms_codes WHERE phone = $1`,
      ['13900139000']
    );
    
    console.log(`✅ 已清理 ${result.rowCount} 条验证码记录`);
    
    // 显示剩余记录数
    const countResult = await db.query('SELECT COUNT(*) FROM sms_codes');
    console.log(`📊 剩余验证码记录: ${countResult.rows[0].count} 条`);
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    process.exit();
  }
}

cleanSmsCodeTable();