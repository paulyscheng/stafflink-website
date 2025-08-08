const axios = require('axios');

async function testWorkersAPI() {
  try {
    console.log('🔍 测试工人API返回数据...\n');
    
    // 使用测试企业账号
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
    
    console.log('📊 工人数据结构示例：');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const firstWorker = workersResponse.data.workers[0];
    console.log('第一个工人数据:');
    console.log(JSON.stringify(firstWorker, null, 2));
    
    console.log('\n\n📋 所有工人技能分布：');
    console.log('───────────────────────────────────────────────────────────────');
    
    workersResponse.data.workers.forEach((worker, index) => {
      console.log(`\n${index + 1}. ${worker.name}`);
      console.log(`   地址: ${worker.address || '未设置'}`);
      console.log(`   技能: ${worker.skills.join(', ') || '无'}`);
      console.log(`   时薪: ¥${worker.wageOffer || 80}/小时`);
    });
    
    console.log('\n\n✅ API返回数据完整性检查：');
    console.log('───────────────────────────────────────────────────────────────');
    
    const hasSkills = workersResponse.data.workers.every(w => w.skills && w.skills.length > 0);
    const hasAddress = workersResponse.data.workers.every(w => w.address);
    const hasWageOffer = workersResponse.data.workers.every(w => w.wageOffer);
    
    console.log(`   技能数据: ${hasSkills ? '✅ 完整' : '❌ 缺失'}`);
    console.log(`   地址数据: ${hasAddress ? '✅ 完整' : '❌ 缺失'}`);
    console.log(`   时薪数据: ${hasWageOffer ? '✅ 完整' : '❌ 缺失'}`);
    
  } catch (error) {
    console.error('❌ 错误:', error.response?.data || error.message);
  }
}

testWorkersAPI();