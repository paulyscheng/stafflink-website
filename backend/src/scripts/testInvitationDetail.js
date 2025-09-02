const fetch = require('node-fetch');

async function testInvitationDetail() {
  try {
    // First, login to get a token
    console.log('Logging in as Zhang...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '13800138001',
        code: '378634',
        userType: 'worker'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData.success ? 'Success' : loginData.error);
    
    if (!loginData.token) {
      console.log('No token received');
      return;
    }
    
    // Get invitations list first
    console.log('\nFetching invitations...');
    const invResponse = await fetch('http://localhost:3000/api/invitations/worker?status=pending', {
      headers: { 
        'Authorization': `Bearer ${loginData.token}`
      }
    });
    
    const invitations = await invResponse.json();
    console.log('Found invitations:', Array.isArray(invitations) ? invitations.length : 'Not an array');
    
    if (Array.isArray(invitations) && invitations.length > 0) {
      const firstInvId = invitations[0].id;
      console.log('\nTesting invitation detail for ID:', firstInvId);
      
      // Now test the detail endpoint
      const detailResponse = await fetch(`http://localhost:3000/api/invitations/${firstInvId}`, {
        headers: { 
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      console.log('Detail response status:', detailResponse.status);
      const detailData = await detailResponse.json();
      
      if (detailResponse.status === 200) {
        console.log('Detail data keys:', Object.keys(detailData));
        console.log('Project name:', detailData.project_name);
        console.log('Company name:', detailData.company_name);
      } else {
        console.log('Error response:', detailData);
      }
    } else {
      console.log('No pending invitations found');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testInvitationDetail();