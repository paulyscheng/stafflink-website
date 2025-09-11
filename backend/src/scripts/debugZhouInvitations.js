const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');
const jwt = require('jsonwebtoken');

async function debugZhouInvitations() {
  try {
    console.log('🔍 调试周师傅邀请问题...\n');
    
    const phone = '13800138008';
    const code = '123456';
    
    // 1. 模拟登录流程
    console.log('1️⃣ 模拟登录流程...');
    console.log(`手机号: ${phone}`);
    console.log(`验证码: ${code}\n`);
    
    // 查找工人
    const workerResult = await db.query('SELECT * FROM workers WHERE phone = $1', [phone]);
    if (workerResult.rows.length === 0) {
      console.log('❌ 未找到周师傅账号');
      return;
    }
    
    const worker = workerResult.rows[0];
    console.log('✅ 找到工人账号:');
    console.log(`   ID: ${worker.id}`);
    console.log(`   姓名: ${worker.name}`);
    console.log(`   状态: ${worker.status}\n`);
    
    // 2. 生成JWT token (正确的格式)
    console.log('2️⃣ 生成JWT Token...');
    const token = jwt.sign(
      { 
        id: worker.id,
        type: 'worker'  // 注意：是type而不是userType
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    console.log('Token生成成功\n');
    
    // 3. 构建登录响应
    console.log('3️⃣ 登录响应数据:');
    const loginResponse = {
      success: true,
      token: token,
      user: {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        age: worker.age,
        gender: worker.gender,
        address: worker.address,
        rating: worker.rating,
        experience_years: worker.experience_years,
        completed_jobs: worker.completed_jobs,
        total_jobs: worker.total_jobs,
        status: worker.status,
        type: 'worker'
      }
    };
    console.log(JSON.stringify(loginResponse, null, 2));
    
    // 4. 查询邀请（模拟API调用）
    console.log('\n4️⃣ 查询工人邀请（模拟/api/invitations/worker）...');
    const invitationsQuery = `
      SELECT 
        i.*,
        c.company_name,
        c.contact_person,
        c.phone as company_phone,
        c.rating as company_rating,
        p.project_name,
        p.project_address,
        p.project_type,
        p.start_date,
        p.end_date,
        p.start_time,
        p.end_time,
        p.budget_range,
        p.work_description
      FROM invitations i
      JOIN companies c ON i.company_id = c.id
      JOIN projects p ON i.project_id = p.id
      WHERE i.worker_id = $1
      AND i.status = 'pending'
      ORDER BY i.invited_at DESC
    `;
    
    const invitationsResult = await db.query(invitationsQuery, [worker.id]);
    console.log(`✅ 找到 ${invitationsResult.rows.length} 个待处理邀请\n`);
    
    if (invitationsResult.rows.length > 0) {
      console.log('邀请详情:');
      invitationsResult.rows.forEach((inv, index) => {
        console.log(`\n邀请 ${index + 1}:`);
        console.log(`  ID: ${inv.id}`);
        console.log(`  项目: ${inv.project_name}`);
        console.log(`  公司: ${inv.company_name}`);
        console.log(`  地址: ${inv.project_address}`);
        console.log(`  工资: ¥${inv.wage_amount} (${inv.wage_unit || 'hour'})`);
        console.log(`  开始时间: ${inv.start_date} ${inv.start_time}`);
        console.log(`  邀请时间: ${new Date(inv.invited_at).toLocaleString('zh-CN')}`);
      });
    }
    
    // 5. 检查Worker App配置
    console.log('\n\n5️⃣ Worker App 配置检查:');
    console.log('API URL应该是: http://192.168.0.216:3000/api');
    console.log('确保后端服务在运行: cd backend && npm run dev');
    
    // 6. 测试步骤
    console.log('\n\n📱 在Worker App中测试步骤:');
    console.log('1. 确保后端服务正在运行');
    console.log('2. 在Worker App登录页面输入:');
    console.log(`   手机号: ${phone}`);
    console.log('   验证码: 123456');
    console.log('3. 登录后应该能在"工作邀请"页面看到邀请列表');
    console.log('4. 如果看不到邀请，检查:');
    console.log('   - 网络连接是否正常');
    console.log('   - API地址是否正确（在config.js中）');
    console.log('   - 查看App的console日志是否有错误');
    
    // 7. 常见问题
    console.log('\n\n⚠️  常见问题:');
    console.log('1. 如果提示"未登录"：');
    console.log('   - 确保登录成功并保存了token');
    console.log('   - 检查AsyncStorage中是否有authToken');
    console.log('\n2. 如果邀请列表为空：');
    console.log('   - 检查API响应是否正常');
    console.log('   - 查看是否有pending状态的邀请');
    console.log('\n3. 如果网络错误：');
    console.log('   - 确保手机和电脑在同一网络');
    console.log('   - 检查防火墙设置');
    console.log('   - 尝试使用电脑的实际IP地址');
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

debugZhouInvitations();