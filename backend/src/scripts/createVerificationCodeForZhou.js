const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function createVerificationCode() {
  try {
    console.log('🔍 为周师傅创建验证码...\n');
    
    const phone = '13800138008';
    const code = '123456';
    const userType = 'worker';
    
    // 先清除旧的验证码
    console.log('1️⃣ 清除旧的验证码...');
    await db.query(
      'UPDATE verification_codes SET is_used = true WHERE phone = $1',
      [phone]
    );
    console.log('✅ 已清除旧验证码');
    
    // 创建新的验证码
    console.log('\n2️⃣ 创建新验证码...');
    const result = await db.query(`
      INSERT INTO verification_codes (
        phone, code, user_type, purpose, expires_at, created_at, is_used
      ) VALUES (
        $1, $2, $3, $4, NOW() + INTERVAL '30 minutes', NOW(), false
      ) RETURNING *
    `, [phone, code, userType, 'login']);
    
    const newCode = result.rows[0];
    console.log('✅ 验证码创建成功');
    console.log(`   手机号: ${phone}`);
    console.log(`   验证码: ${code}`);
    console.log(`   类型: ${userType}`);
    console.log(`   用途: login`);
    console.log(`   过期时间: ${newCode.expires_at}`);
    
    console.log('\n📱 现在可以使用以下信息在工人端登录:');
    console.log(`   手机号: ${phone}`);
    console.log(`   验证码: ${code}`);
    
  } catch (error) {
    console.error('❌ 创建验证码失败:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

createVerificationCode();