const axios = require('axios');

async function testWorkerSkills() {
  try {
    console.log('🔍 测试工人技能API...\n');
    
    // 登录获取token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      phone: '13900139000',
      code: '123456',
      userType: 'company'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功\n');
    
    // 获取工人列表
    const workersResponse = await axios.get('http://localhost:3000/api/workers', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 工人技能数据：');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    workersResponse.data.workers.forEach((worker, index) => {
      console.log(`${index + 1}. ${worker.name}`);
      console.log(`   技能: ${worker.skills ? worker.skills.join(', ') : '无'}`);
      console.log(`   技能详情:`, worker.skillDetails || '无');
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ 错误:', error.response?.data || error.message);
  }
}

testWorkerSkills();