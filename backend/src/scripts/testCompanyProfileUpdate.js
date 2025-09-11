const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// 测试公司的登录信息
const testCompany = {
  phone: '13900139000',
  code: '192701'
};

// 更新的数据
const updateData = {
  company_name: '测试建筑有限公司-更新',
  contact_person: '张经理-更新',
  position: '项目总监',
  address: '北京市朝阳区测试路123号-更新',
  phone: '13900139000',
  email: 'test@company.com',
  industry: '建筑业',
  company_size: '50-100人'
};

async function testUpdateProfile() {
  try {
    console.log('1. 登录获取 token...');
    // 登录
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      phone: testCompany.phone,
      code: testCompany.code,
      userType: 'company'
    });

    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.error);
    }

    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到 token');

    // 设置请求头
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('\n2. 获取当前公司信息...');
    // 获取当前信息
    const profileResponse = await axios.get(`${API_BASE_URL}/companies/profile`, config);
    console.log('当前公司信息:', profileResponse.data.data);

    console.log('\n3. 更新公司信息...');
    console.log('更新数据:', updateData);
    
    // 更新信息
    const updateResponse = await axios.put(`${API_BASE_URL}/companies/profile`, updateData, config);
    
    if (updateResponse.data.success) {
      console.log('✅ 更新成功!');
      console.log('更新后的数据:', updateResponse.data.data);
    } else {
      console.log('❌ 更新失败:', updateResponse.data.error);
    }

    console.log('\n4. 再次获取公司信息验证更新...');
    // 验证更新
    const verifyResponse = await axios.get(`${API_BASE_URL}/companies/profile`, config);
    console.log('验证后的公司信息:', verifyResponse.data.data);

  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
console.log('=== 测试公司资料更新 API ===\n');
testUpdateProfile();