const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test update company profile
async function testUpdateCompanyProfile() {
  try {
    console.log('🔄 Testing company profile update...\n');
    
    // Use test token for development
    const token = 'test-token-for-development';
    
    // Test data
    const updateData = {
      company_name: '蓝领优选科技有限公司',
      contact_person: '张总',
      position: 'CEO',
      address: '上海市浦东新区陆家嘴金融中心',
      phone: '13900139000',
      email: 'ceo@bluecollar.com',
      industry: '建筑装修',
      company_size: '100-500',
      description: '专业的建筑工人派遣服务平台，致力于为建筑行业提供高质量的人力资源解决方案。'
    };
    
    // Update profile
    console.log('📤 Updating company profile...');
    const updateResponse = await axios.put(
      `${API_BASE_URL}/companies/profile`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (updateResponse.data.success) {
      console.log('✅ Profile updated successfully:');
      console.log(JSON.stringify(updateResponse.data.data, null, 2));
    } else {
      console.error('❌ Failed to update profile:', updateResponse.data);
    }
    
    // Get updated profile
    console.log('\n📥 Fetching updated profile...');
    const getResponse = await axios.get(
      `${API_BASE_URL}/companies/profile`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (getResponse.data.success) {
      console.log('✅ Profile fetched successfully:');
      console.log(JSON.stringify(getResponse.data.data, null, 2));
    } else {
      console.error('❌ Failed to fetch profile:', getResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testUpdateCompanyProfile();