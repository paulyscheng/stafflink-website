const http = require('http');

// Test update company profile without proxy
async function testUpdateCompanyProfile() {
  console.log('🔄 Testing company profile update...\n');
  
  const updateData = JSON.stringify({
    company_name: '蓝领优选科技有限公司',
    contact_person: '张总',
    position: 'CEO',
    address: '上海市浦东新区陆家嘴金融中心',
    phone: '13900139000',
    email: 'ceo@bluecollar.com',
    industry: '建筑装修',
    company_size: '100-500'
    // description: '专业的建筑工人派遣服务平台，致力于为建筑行业提供高质量的人力资源解决方案。'
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/companies/profile',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updateData),
      'Authorization': 'Bearer test-token-for-development'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response status:', res.statusCode);
        console.log('Response headers:', res.headers);
        
        if (data) {
          try {
            const parsed = JSON.parse(data);
            console.log('Response body:', JSON.stringify(parsed, null, 2));
            
            if (parsed.success) {
              console.log('✅ Profile updated successfully');
              testGetProfile();
            } else {
              console.error('❌ Failed:', parsed.error);
            }
          } catch (e) {
            console.log('Raw response:', data);
          }
        } else {
          console.log('Empty response');
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });
    
    req.write(updateData);
    req.end();
  });
}

// Test get profile
async function testGetProfile() {
  console.log('\n📥 Fetching updated profile...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/companies/profile',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer test-token-for-development'
    }
  };
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            console.log('✅ Profile fetched successfully:');
            console.log(JSON.stringify(parsed.data, null, 2));
          } else {
            console.error('❌ Failed:', parsed.error);
          }
        } catch (e) {
          console.log('Raw response:', data);
        }
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
  
  req.end();
}

// Run the test
testUpdateCompanyProfile().catch(console.error);