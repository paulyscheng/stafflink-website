const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🔍 测试企业端获取已完成工作API...\n');
    
    // 使用测试企业账号获取token
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '13900139000',
        code: '123456',
        userType: 'company'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log('✅ 登录成功，获取token\n');
    
    // 获取已完成的工作
    const jobsResponse = await fetch('http://localhost:3000/api/jobs/company/jobs?status=completed', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const jobsData = await jobsResponse.json();
    
    console.log('📋 API返回数据:');
    console.log(JSON.stringify(jobsData, null, 2));
    
    if (jobsData.success && jobsData.data) {
      console.log('\n📊 数据统计:');
      console.log(`总数: ${jobsData.data.length}`);
      
      const completed = jobsData.data.filter(j => j.status === 'completed');
      const confirmed = jobsData.data.filter(j => j.status === 'confirmed');
      const paid = jobsData.data.filter(j => j.status === 'paid');
      
      console.log(`待确认 (completed): ${completed.length}`);
      console.log(`已确认 (confirmed): ${confirmed.length}`);
      console.log(`已支付 (paid): ${paid.length}`);
      
      console.log('\n详细状态:');
      jobsData.data.forEach((job, index) => {
        console.log(`[${index + 1}] ${job.worker_name} - ${job.project_name}: ${job.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

testAPI();