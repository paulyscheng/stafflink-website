const fetch = require('node-fetch');

async function testAcceptInvitation() {
  console.log('📮 测试接受邀请...\n');
  
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
  const token = loginData.token;
  console.log('✅ 登录成功\n');
  
  // 获取邀请列表
  console.log('2️⃣ 获取邀请列表...');
  const invitationsResponse = await fetch('http://localhost:3000/api/invitations/worker', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const invitations = await invitationsResponse.json();
  
  if (!invitations || invitations.length === 0) {
    console.log('❌ 没有邀请');
    return;
  }
  
  console.log(`✅ 找到 ${invitations.length} 个邀请\n`);
  
  // 接受第一个邀请
  const firstInvitation = invitations[0];
  console.log('3️⃣ 接受第一个邀请...');
  console.log(`   项目: ${firstInvitation.project_name}`);
  console.log(`   公司: ${firstInvitation.company_name}\n`);
  
  const acceptResponse = await fetch(`http://localhost:3000/api/invitations/${firstInvitation.id}/respond`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'accepted',
      response_message: '我很感兴趣，可以准时到达完成工作。'
    })
  });
  
  if (acceptResponse.ok) {
    const result = await acceptResponse.json();
    console.log('✅ 成功接受邀请！');
    console.log(`   邀请ID: ${result.invitation.id}`);
    console.log(`   新状态: ${result.invitation.status}`);
    console.log(`   回复留言: ${result.invitation.response_message}`);
  } else {
    const error = await acceptResponse.text();
    console.log(`❌ 接受邀请失败: ${error}`);
  }
}

testAcceptInvitation().catch(console.error);