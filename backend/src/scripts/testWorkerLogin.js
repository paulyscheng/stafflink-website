const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');
const jwt = require('jsonwebtoken');

async function testWorkerLogin() {
  try {
    const phone = '13800138008';  // 周师傅的手机号
    const code = '123456';         // 测试验证码
    
    console.log('🔍 测试工人登录流程...\n');
    console.log(`手机号: ${phone}`);
    console.log(`验证码: ${code}`);
    
    // 1. 查找工人
    console.log('\n1️⃣ 查找工人账号...');
    const workerResult = await db.query(
      'SELECT * FROM workers WHERE phone = $1',
      [phone]
    );
    
    if (workerResult.rows.length === 0) {
      console.log('❌ 未找到该手机号的工人账号');
      return;
    }
    
    const worker = workerResult.rows[0];
    console.log('✅ 找到工人:', worker.name);
    
    // 2. 验证验证码（在测试环境中，我们接受固定的验证码）
    console.log('\n2️⃣ 验证验证码...');
    const isValidCode = code === '123456' || code === '123455' || code === '123457' || code === '123458' || code === '123451';
    
    if (!isValidCode) {
      console.log('❌ 验证码错误');
      return;
    }
    console.log('✅ 验证码正确');
    
    // 3. 生成JWT token
    console.log('\n3️⃣ 生成JWT token...');
    const token = jwt.sign(
      { 
        id: worker.id,
        phone: worker.phone,
        name: worker.name,
        userType: 'worker' 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    console.log('✅ Token生成成功');
    console.log('Token:', token.substring(0, 50) + '...');
    
    // 4. 返回用户信息
    console.log('\n4️⃣ 构建登录响应...');
    const response = {
      success: true,
      message: '登录成功',
      token: token,
      user: {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        age: worker.age,
        gender: worker.gender,
        address: worker.address,
        rating: worker.rating,
        experienceYears: worker.experience_years,
        status: worker.status,
        totalJobs: worker.total_jobs,
        completedJobs: worker.completed_jobs,
        joinedDate: worker.joined_date
      }
    };
    
    console.log('✅ 登录响应构建完成');
    console.log('\n完整的登录响应:');
    console.log(JSON.stringify(response, null, 2));
    
    // 5. 测试获取邀请的API
    console.log('\n5️⃣ 模拟获取工人邀请...');
    const invitationsResult = await db.query(`
      SELECT i.*, p.project_name, p.project_address, p.project_type,
             c.company_name, c.phone as company_phone, c.rating as company_rating,
             p.start_date as project_start_date, p.description as project_description,
             p.daily_wage, p.original_wage as project_original_wage
      FROM invitations i
      JOIN projects p ON i.project_id = p.id
      JOIN companies c ON p.company_id = c.id
      WHERE i.worker_id = $1
      AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `, [worker.id]);
    
    console.log(`✅ 找到 ${invitationsResult.rows.length} 个待处理的邀请`);
    
    if (invitationsResult.rows.length > 0) {
      console.log('\n邀请列表:');
      invitationsResult.rows.forEach((inv, index) => {
        console.log(`\n邀请 ${index + 1}:`);
        console.log(`  项目: ${inv.project_name}`);
        console.log(`  公司: ${inv.company_name}`);
        console.log(`  工资: ¥${inv.wage_amount}`);
        console.log(`  状态: ${inv.status}`);
      });
    }
    
    console.log('\n✅ 登录流程测试完成');
    console.log('\n📱 在工人端App中使用以下信息登录:');
    console.log(`   手机号: ${phone}`);
    console.log('   验证码: 123456');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

testWorkerLogin();