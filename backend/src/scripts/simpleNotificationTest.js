const http = require('http');

// 测试登录并获取通知
function testLogin() {
  const data = JSON.stringify({
    phone: '13900139000',
    code: '123456',
    userType: 'company'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('登录响应:', responseData);
      
      try {
        const result = JSON.parse(responseData);
        if (result.token) {
          console.log('✅ 登录成功，token:', result.token.substring(0, 20) + '...');
          testNotifications(result.token);
        } else {
          console.log('❌ 登录失败');
        }
      } catch (e) {
        console.error('解析响应失败:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('请求失败:', error);
  });

  req.write(data);
  req.end();
}

// 测试获取通知
function testNotifications(token) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/notifications',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        if (result.success) {
          console.log('✅ 获取通知成功');
          console.log('通知数量:', result.data.length);
          if (result.data.length > 0) {
            console.log('第一条通知:');
            console.log('  - 标题:', result.data[0].title);
            console.log('  - 内容:', result.data[0].message);
            console.log('  - 类型:', result.data[0].type);
            console.log('  - 已读:', result.data[0].is_read);
          }
          
          // 测试未读数量
          testUnreadCount(token);
        } else {
          console.log('❌ 获取通知失败:', result.error);
        }
      } catch (e) {
        console.error('解析响应失败:', e.message);
        console.log('原始响应:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('请求失败:', error);
  });

  req.end();
}

// 测试未读数量
function testUnreadCount(token) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/notifications/unread-count',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };

  const req = http.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(responseData);
        if (result.success) {
          console.log('✅ 获取未读数量成功');
          console.log('未读通知数量:', result.data.unread_count);
        } else {
          console.log('❌ 获取未读数量失败:', result.error);
        }
      } catch (e) {
        console.error('解析响应失败:', e.message);
      }
    });
  });

  req.on('error', (error) => {
    console.error('请求失败:', error);
  });

  req.end();
}

// 开始测试
console.log('🚀 开始测试通知系统...\n');
testLogin();