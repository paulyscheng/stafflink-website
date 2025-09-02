const fetch = require('node-fetch');

async function testAPIConnection() {
  const urls = [
    'http://localhost:3000/api/auth/send-code',
    'http://192.168.0.216:3000/api/auth/send-code'
  ];

  for (const url of urls) {
    console.log(`\nTesting connection to: ${url}`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '13800138001' }),
        timeout: 5000
      });
      
      console.log(`Status: ${response.status}`);
      const data = await response.json();
      console.log(`Response:`, data);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

testAPIConnection();