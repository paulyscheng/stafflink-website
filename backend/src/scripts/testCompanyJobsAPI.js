const fetch = require('node-fetch');

async function testCompanyJobsAPI() {
  console.log('🔍 测试企业端工作记录 API...\n');

  try {
    // 1. 先登录获取 token
    console.log('1. 登录企业账号...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '13900139000',
        code: '123456',
        userType: 'company'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`登录失败: ${error.error}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ 登录成功');
    console.log('- Company ID:', loginData.user.id);
    console.log('- Company Name:', loginData.user.company_name);
    console.log('');

    // 2. 测试获取已完成的工作记录
    console.log('2. 获取已完成的工作记录...');
    const completedJobsResponse = await fetch('http://localhost:3000/api/jobs/company/jobs?status=completed', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!completedJobsResponse.ok) {
      const error = await completedJobsResponse.json();
      throw new Error(`获取工作记录失败: ${error.error}`);
    }

    const completedJobsData = await completedJobsResponse.json();
    console.log('✅ 成功获取已完成的工作记录');
    console.log(`- 总数: ${completedJobsData.data?.length || 0}`);
    
    if (completedJobsData.data && completedJobsData.data.length > 0) {
      console.log('\n📋 待确认工作详情:');
      completedJobsData.data.forEach((job, index) => {
        console.log(`\n  [${index + 1}] 工作ID: ${job.id}`);
        console.log(`      工人: ${job.worker_name || '未知'}`);
        console.log(`      项目: ${job.project_name || '未知'}`);
        console.log(`      状态: ${job.status}`);
        console.log(`      完成时间: ${job.complete_time || '未设置'}`);
        console.log(`      工作照片: ${job.work_photos ? JSON.parse(JSON.stringify(job.work_photos)).length + '张' : '无'}`);
        console.log(`      完成说明: ${job.completion_notes ? '有' : '无'}`);
      });
    }

    // 3. 测试获取所有工作记录
    console.log('\n3. 获取所有工作记录...');
    const allJobsResponse = await fetch('http://localhost:3000/api/jobs/company/jobs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (allJobsResponse.ok) {
      const allJobsData = await allJobsResponse.json();
      console.log('✅ 成功获取所有工作记录');
      console.log(`- 总数: ${allJobsData.data?.length || 0}`);
      
      // 统计各状态
      if (allJobsData.data && allJobsData.data.length > 0) {
        const statusCount = {};
        allJobsData.data.forEach(job => {
          statusCount[job.status] = (statusCount[job.status] || 0) + 1;
        });
        console.log('\n📊 状态分布:');
        Object.entries(statusCount).forEach(([status, count]) => {
          console.log(`- ${status}: ${count}`);
        });
      }
    }

    console.log('\n✅ API 测试成功！企业端可以正常获取工作记录。');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testCompanyJobsAPI();