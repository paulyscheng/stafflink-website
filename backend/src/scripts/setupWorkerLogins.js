const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function setupWorkerLogins() {
  try {
    console.log('🔐 设置工人登录信息\n');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
    // 获取所有工人
    const workersQuery = `
      SELECT id, name, phone, status
      FROM workers
      ORDER BY name
    `;
    
    const result = await db.query(workersQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ 没有找到工人数据');
      return;
    }
    
    console.log('📱 工人登录信息（开发测试用）\n');
    console.log('登录方式：手机号 + 验证码\n');
    console.log('───────────────────────────────────────────────────────────────────────\n');
    
    // 为每个工人创建模拟的验证码
    const verificationCodes = {};
    
    for (let i = 0; i < result.rows.length; i++) {
      const worker = result.rows[i];
      // 生成简单的验证码（真实环境应该是随机的）
      const code = `12345${i + 1}`.slice(-6); // 123451, 123452, etc.
      verificationCodes[worker.phone] = code;
      
      // 插入或更新验证码到数据库（用于测试）
      const insertCodeQuery = `
        INSERT INTO sms_codes (phone, code, purpose, expires_at, used)
        VALUES ($1, $2, 'login', NOW() + INTERVAL '30 minutes', false)
        ON CONFLICT (phone) WHERE purpose = 'login' AND used = false
        DO UPDATE SET 
          code = $2,
          expires_at = NOW() + INTERVAL '30 minutes',
          created_at = NOW()
      `;
      
      try {
        await db.query(insertCodeQuery, [worker.phone, code]);
      } catch (err) {
        // 忽略错误，表可能不存在或有约束
      }
      
      const statusIcon = worker.status === 'online' ? '🟢' : 
                        worker.status === 'busy' ? '🟡' : '⚫';
      
      console.log(`${i + 1}. ${worker.name} ${statusIcon}`);
      console.log(`   📱 手机号: ${worker.phone}`);
      console.log(`   🔑 验证码: ${code}`);
      console.log(`   💡 测试提示: 在工人端APP登录界面输入此手机号和验证码即可登录`);
      console.log();
    }
    
    console.log('───────────────────────────────────────────────────────────────────────\n');
    
    console.log('📝 使用说明：\n');
    console.log('1. 打开工人端APP');
    console.log('2. 在登录界面输入上面列出的手机号');
    console.log('3. 点击"获取验证码"');
    console.log('4. 输入对应的验证码');
    console.log('5. 点击"登录"即可进入工人端\n');
    
    console.log('⚠️  注意事项：');
    console.log('   - 这些是测试用的固定验证码，仅用于开发环境');
    console.log('   - 生产环境会使用真实的短信验证码');
    console.log('   - 验证码30分钟内有效');
    console.log('   - 每个工人使用自己的手机号登录，看到的是自己的邀请和工作记录\n');
    
    // 创建一个简化的登录信息表
    console.log('📋 快速登录表（保存此信息用于测试）：\n');
    console.log('┌─────────────┬──────────────┬──────────┬────────┐');
    console.log('│ 工人姓名     │ 手机号        │ 验证码    │ 状态   │');
    console.log('├─────────────┼──────────────┼──────────┼────────┤');
    
    for (let i = 0; i < result.rows.length; i++) {
      const worker = result.rows[i];
      const code = verificationCodes[worker.phone];
      const status = worker.status === 'online' ? '在线' : 
                    worker.status === 'busy' ? '忙碌' : '离线';
      
      // 格式化输出
      const name = worker.name.padEnd(10, ' ');
      const phone = worker.phone.padEnd(12, ' ');
      const codeStr = code.padEnd(8, ' ');
      const statusStr = status.padEnd(6, ' ');
      
      console.log(`│ ${name} │ ${phone} │ ${codeStr} │ ${statusStr} │`);
    }
    
    console.log('└─────────────┴──────────────┴──────────┴────────┘\n');
    
    // 输出JSON格式，方便复制使用
    console.log('📄 JSON格式（方便程序使用）：\n');
    const loginInfo = result.rows.map((worker, index) => ({
      name: worker.name,
      phone: worker.phone,
      code: verificationCodes[worker.phone],
      status: worker.status
    }));
    
    console.log(JSON.stringify(loginInfo, null, 2));
    
  } catch (error) {
    console.error('❌ 设置登录信息失败:', error);
  } finally {
    process.exit();
  }
}

setupWorkerLogins();