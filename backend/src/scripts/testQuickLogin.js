/**
 * 测试一键登录API
 * 用于测试极光一键登录功能是否正常
 */

const axios = require('axios');
require('dotenv').config();

// 禁用HTTP代理
delete process.env.http_proxy;
delete process.env.https_proxy;
delete process.env.HTTP_PROXY;
delete process.env.HTTPS_PROXY;

const API_URL = process.env.API_URL || 'http://localhost:3000';

// 模拟的loginToken（实际应从客户端SDK获取）
const mockLoginToken = 'mock_login_token_for_testing';

async function testQuickLogin(userType = 'worker') {
  console.log(`\n测试${userType === 'worker' ? '工人端' : '企业端'}一键登录...\n`);

  try {
    const response = await axios.post(`${API_URL}/api/auth/quick-login`, {
      loginToken: mockLoginToken,
      userType: userType
    });

    console.log('✅ 一键登录成功！');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data.token) {
      console.log('\n获取到的Token:', response.data.data.token.substring(0, 50) + '...');
      console.log('用户信息:', response.data.data.user);
      
      // 测试使用token获取用户信息
      await testGetMe(response.data.data.token);
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ 一键登录失败！');
      console.error('错误状态:', error.response.status);
      console.error('错误信息:', error.response.data);
      
      if (error.response.data.fallbackToSms) {
        console.log('\n提示: API建议降级到短信验证码登录');
      }
    } else {
      console.error('❌ 请求失败:', error.message);
    }
  }
}

async function testGetMe(token) {
  console.log('\n测试使用token获取用户信息...');
  
  try {
    const response = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取用户信息成功！');
    console.log('用户数据:', response.data.data);
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error.response?.data || error.message);
  }
}

// 测试极光服务配置状态
function checkJiguangConfig() {
  console.log('检查极光认证配置...\n');
  
  const appKey = process.env.JIGUANG_APP_KEY;
  const masterSecret = process.env.JIGUANG_MASTER_SECRET;
  
  if (!appKey || !masterSecret) {
    console.log('⚠️  警告: 极光认证未配置！');
    console.log('请在.env文件中设置以下环境变量:');
    console.log('- JIGUANG_APP_KEY');
    console.log('- JIGUANG_MASTER_SECRET');
    console.log('\n当前API将使用模拟模式，不会真正验证loginToken');
  } else {
    console.log('✅ 极光认证已配置');
    console.log(`AppKey: ${appKey.substring(0, 6)}...`);
  }
}

// 主函数
async function main() {
  console.log('=== StaffLink 一键登录API测试 ===\n');
  
  // 检查配置
  checkJiguangConfig();
  
  // 测试工人端登录
  await testQuickLogin('worker');
  
  // 测试企业端登录
  await testQuickLogin('company');
  
  console.log('\n=== 测试完成 ===\n');
  
  console.log('注意事项:');
  console.log('1. 本测试脚本使用模拟的loginToken');
  console.log('2. 实际使用时，loginToken应从极光SDK获取');
  console.log('3. 需要配置真实的极光认证凭证才能验证真实的loginToken');
  console.log('4. 前端需要集成极光SDK来获取loginToken');
}

// 运行测试
main().catch(console.error);