const fetch = require('node-fetch');

async function testLogin() {
  console.log('🔐 测试工人登录...\n');
  
  const testAccounts = [
    { name: '张师傅', phone: '13800138001', code: '123455' },
    { name: '李师傅', phone: '13800138002', code: '123456' },
  ];
  
  for (const account of testAccounts) {
    console.log(`📱 测试登录: ${account.name} (${account.phone})`);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: account.phone,
          code: account.code,
          userType: 'worker'
        })
      });
      
      console.log(`   状态码: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ 登录成功`);
        console.log(`   Token: ${data.token ? data.token.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`   用户ID: ${data.user?.id}`);
        console.log(`   用户名: ${data.user?.name}`);
      } else {
        const text = await response.text();
        console.log(`   ❌ 登录失败: ${text}`);
      }
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
    }
    
    console.log();
  }
}

testLogin().catch(console.error);