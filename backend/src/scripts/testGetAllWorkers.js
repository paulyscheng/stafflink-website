const fetch = require('node-fetch');

async function testGetAllWorkers() {
  console.log('👷 测试获取所有工人...\n');
  
  try {
    // 先使用模拟token（企业用户）
    const token = 'mock-token-company-123';
    
    const response = await fetch('http://localhost:3000/api/workers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`状态码: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`\n✅ 获取成功，共 ${data.total} 个工人:\n`);
      
      data.workers.forEach((worker, index) => {
        console.log(`${index + 1}. ${worker.name}`);
        console.log(`   电话: ${worker.phone}`);
        console.log(`   状态: ${worker.status}`);
        console.log(`   评分: ${worker.rating}`);
        console.log(`   经验: ${worker.experience}`);
        console.log(`   完成项目: ${worker.completedProjects}`);
        console.log('');
      });
    } else {
      const error = await response.text();
      console.log(`❌ 获取失败: ${error}`);
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }
}

testGetAllWorkers().catch(console.error);