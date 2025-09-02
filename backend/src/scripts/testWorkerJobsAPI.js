const fetch = require('node-fetch');

async function testWorkerJobsAPI() {
  console.log('🔍 测试工人工作记录 API...\n');

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

    // 2. 测试获取工作记录
    console.log('2. 获取工作记录...');
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
    console.log('✅ 成功获取工作记录');
    console.log(`- 总数: ${jobsData.data.length}`);
    
    if (jobsData.data.length > 0) {
      console.log('\n📋 工作记录详情:');
      jobsData.data.forEach((job, index) => {
        console.log(`\n  [${index + 1}] ${job.project_name || '未知项目'}`);
        console.log(`      状态: ${job.status}`);
        console.log(`      地址: ${job.project_address || '未设置'}`);
        console.log(`      工资: ¥${job.wage_amount || job.wage_amount || 0} (${job.wage_unit || job.payment_type || '未知'})`);
        console.log(`      日期: ${job.start_date || job.start_date || '未设置'}`);
      });
    }

    // 3. 测试获取待处理邀请
    console.log('\n3. 获取待处理邀请...');
    const invitationsResponse = await fetch('http://localhost:3000/api/invitations/worker?status=pending', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!invitationsResponse.ok) {
      const error = await invitationsResponse.json();
      throw new Error(`获取邀请失败: ${error.error}`);
    }

    const invitationsData = await invitationsResponse.json();
    console.log('✅ 成功获取待处理邀请');
    console.log(`- 总数: ${invitationsData.length}`);

    if (invitationsData.length > 0) {
      console.log('\n📬 待处理邀请详情:');
      invitationsData.forEach((invitation, index) => {
        console.log(`\n  [${index + 1}] ${invitation.projectName}`);
        console.log(`      公司: ${invitation.companyName}`);
        console.log(`      地址: ${invitation.projectAddress}`);
        console.log(`      工资: ¥${invitation.wageOffer} (${invitation.wageType})`);
      });
    }

    console.log('\n\n📊 数据汇总:');
    console.log(`- 工作记录数: ${jobsData.data.length}`);
    console.log(`- 待处理邀请: ${invitationsData.length}`);
    console.log('\n✅ API 测试成功！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testWorkerJobsAPI();