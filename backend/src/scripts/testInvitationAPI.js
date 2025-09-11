const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const jwt = require('jsonwebtoken');

async function testInvitationAPI() {
  try {
    const workerId = 'e033b471-175f-4552-842c-9d25b906df7e'; // 周师傅的ID
    const phone = '13800138008';
    
    // 生成测试token
    const token = jwt.sign(
      { 
        id: workerId,
        phone: phone,
        name: '周师傅',
        type: 'worker'  // Changed from userType to type
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    console.log('🔍 测试邀请API...\n');
    console.log('Worker ID:', workerId);
    console.log('Token:', token.substring(0, 50) + '...\n');
    
    // 测试API
    const apiUrl = `http://localhost:3000/api/invitations/worker`;
    console.log('API URL:', apiUrl);
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response Status:', response.status);
      console.log('Response Status Text:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error Response:', errorText);
        return;
      }
      
      const data = await response.json();
      console.log(`\n✅ API返回 ${data.length} 个邀请`);
      
      if (data.length > 0) {
        console.log('\n邀请列表:');
        data.forEach((inv, index) => {
          console.log(`\n邀请 ${index + 1}:`);
          console.log('  ID:', inv.id);
          console.log('  项目名称:', inv.project_name);
          console.log('  公司名称:', inv.company_name);
          console.log('  工资:', `¥${inv.wage_amount}`);
          console.log('  状态:', inv.status);
          console.log('  创建时间:', inv.created_at);
        });
      }
      
    } catch (fetchError) {
      console.error('❌ API调用失败:', fetchError.message);
      console.log('\n请确保后端服务器正在运行:');
      console.log('cd backend && npm run dev');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    process.exit();
  }
}

testInvitationAPI();