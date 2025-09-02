const fetch = require('node-fetch');

async function testJobDetailAPI() {
  console.log('🔍 测试工作详情 API...\n');

  try {
    // 1. 先登录获取 token
    console.log('1. 登录李师傅账号...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '13800138002',
        code: '123456',
        userType: 'worker'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`登录失败: ${error.error}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ 登录成功');
    console.log('- Worker ID:', loginData.user.id);
    console.log('- Worker Name:', loginData.user.name);
    console.log('');

    // 2. 获取工作记录列表
    console.log('2. 获取工作记录列表...');
    const jobsResponse = await fetch('http://localhost:3000/api/jobs/worker/jobs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!jobsResponse.ok) {
      const error = await jobsResponse.json();
      throw new Error(`获取工作记录失败: ${error.error}`);
    }

    const jobsData = await jobsResponse.json();
    console.log(`✅ 成功获取 ${jobsData.data.length} 条工作记录`);
    
    if (jobsData.data.length > 0) {
      const firstJob = jobsData.data[0];
      console.log('\n3. 测试获取工作详情...');
      console.log('- Job ID:', firstJob.id);
      
      // 3. 获取工作详情
      const detailResponse = await fetch(`http://localhost:3000/api/jobs/detail/${firstJob.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!detailResponse.ok) {
        const error = await detailResponse.json();
        throw new Error(`获取工作详情失败: ${error.error}`);
      }

      const detailData = await detailResponse.json();
      console.log('✅ 成功获取工作详情');
      console.log('\n📋 工作详情:');
      console.log('- 项目名称:', detailData.data.project_name);
      console.log('- 公司名称:', detailData.data.company_name);
      console.log('- 工作状态:', detailData.data.status);
      console.log('- 工作地址:', detailData.data.project_address);
      console.log('- 工资:', `¥${detailData.data.wage_offer || detailData.data.payment_amount || 0}`);
      console.log('- 工人姓名:', detailData.data.worker_name);
      console.log('- 工人电话:', detailData.data.worker_phone);
      
      console.log('\n✅ API 测试成功！');
    } else {
      console.log('\n⚠️ 没有工作记录可用于测试详情 API');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testJobDetailAPI();