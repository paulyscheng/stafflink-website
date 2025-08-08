const fetch = require('node-fetch');

async function testCompanyLogin() {
  console.log('🏢 测试企业登录...\n');
  
  const phone = '13900139000';
  const code = '123456';
  
  try {
    // 1. 先发送验证码
    console.log('1️⃣ 发送验证码...');
    const codeResponse = await fetch('http://localhost:3000/api/auth/send-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, purpose: 'login' })
    });
    
    if (codeResponse.ok) {
      const codeData = await codeResponse.json();
      console.log('✅ 验证码发送成功');
      if (codeData.code) {
        console.log(`   开发环境验证码: ${codeData.code}`);
      }
    } else {
      const error = await codeResponse.text();
      console.log(`❌ 发送验证码失败: ${error}`);
    }
    
    console.log('');
    
    // 2. 登录
    console.log('2️⃣ 企业登录...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone,
        code,
        userType: 'company'
      })
    });
    
    console.log(`   状态码: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✅ 登录成功！');
      console.log(`   Token: ${data.token ? data.token.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`   企业ID: ${data.user?.id}`);
      console.log(`   企业名: ${data.user?.name}`);
      console.log(`   联系人: ${data.user?.contact_person}`);
      
      return data.token;
    } else {
      const error = await loginResponse.text();
      console.log(`❌ 登录失败: ${error}`);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
    return null;
  }
}

// 测试登录后获取项目
async function testGetProjects(token) {
  if (!token) {
    console.log('\n⚠️  没有token，跳过项目获取测试');
    return;
  }
  
  console.log('\n3️⃣ 获取企业项目...');
  
  try {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 获取成功，共 ${data.projects?.length || 0} 个项目`);
      
      if (data.projects && data.projects.length > 0) {
        data.projects.slice(0, 3).forEach((project, index) => {
          console.log(`\n   项目 ${index + 1}:`);
          console.log(`     名称: ${project.project_name}`);
          console.log(`     地址: ${project.project_address}`);
          console.log(`     状态: ${project.status}`);
          console.log(`     创建时间: ${new Date(project.created_at).toLocaleDateString()}`);
        });
      }
    } else {
      const error = await response.text();
      console.log(`❌ 获取项目失败: ${error}`);
    }
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
  }
}

// 执行测试
testCompanyLogin().then(token => {
  testGetProjects(token);
});