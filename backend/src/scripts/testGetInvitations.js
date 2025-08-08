const fetch = require('node-fetch');

async function testGetInvitations() {
  console.log('📮 测试获取工人邀请...\n');
  
  // 先登录获取token
  console.log('1️⃣ 登录张师傅账号...');
  const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: '13800138001',
      code: '123455',
      userType: 'worker'
    })
  });
  
  if (!loginResponse.ok) {
    console.log('❌ 登录失败');
    return;
  }
  
  const loginData = await loginResponse.json();
  console.log('✅ 登录成功');
  console.log(`   Token: ${loginData.token.substring(0, 50)}...`);
  console.log(`   用户: ${loginData.user.name}\n`);
  
  // 使用token获取邀请列表
  console.log('2️⃣ 获取邀请列表...');
  const invitationsResponse = await fetch('http://localhost:3000/api/invitations/worker', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${loginData.token}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`   状态码: ${invitationsResponse.status}`);
  
  if (invitationsResponse.ok) {
    const data = await invitationsResponse.json();
    const invitations = data.invitations || data;
    console.log(`✅ 获取成功，共 ${invitations.length} 个邀请:\n`);
    
    invitations.forEach((inv, index) => {
      console.log(`   邀请 ${index + 1}:`);
      console.log(`     项目: ${inv.project_name || inv.projectName}`);
      console.log(`     公司: ${inv.company_name || inv.companyName}`);
      console.log(`     地址: ${inv.project_address || inv.projectAddress}`);
      console.log(`     工资: ¥${inv.wage_offer || inv.wageOffer}/${inv.wage_type === 'hourly' ? '小时' : '天'}`);
      console.log(`     状态: ${inv.status}`);
      console.log(`     留言: ${inv.message}\n`);
    });
  } else {
    const errorText = await invitationsResponse.text();
    console.log(`❌ 获取失败: ${errorText}`);
  }
}

testGetInvitations().catch(console.error);