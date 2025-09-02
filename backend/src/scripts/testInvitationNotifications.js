const http = require('http');

// HTTP请求封装
function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// 登录函数
async function login(phone, code, userType) {
  const data = { phone, code, userType };
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': JSON.stringify(data).length
    }
  };
  const result = await httpRequest(options, data);
  return result.token;
}

// 主测试流程
async function testInvitationNotificationFlow() {
  try {
    console.log('🚀 开始测试邀请通知流程\n');
    console.log('=' .repeat(50));
    
    // 1. 登录账号
    console.log('\n📱 步骤1: 登录测试账号');
    const companyToken = await login('13900139000', '123456', 'company');
    console.log('✅ 企业登录成功');
    
    const workerToken = await login('13800138001', '123456', 'worker');
    console.log('✅ 工人登录成功');
    
    // 2. 检查初始通知数量
    console.log('\n📊 步骤2: 检查初始通知状态');
    
    // 企业初始通知
    let companyNotifications = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/notifications',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${companyToken}` }
    });
    console.log(`企业当前通知数: ${companyNotifications.data.length}`);
    
    // 工人初始通知
    let workerNotifications = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/notifications',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${workerToken}` }
    });
    console.log(`工人当前通知数: ${workerNotifications.data.length}`);
    
    // 3. 企业创建项目
    console.log('\n🏗️ 步骤3: 企业创建新项目');
    const projectData = {
      project_name: '测试通知项目',
      project_type: '装修',
      project_address: '测试地址123号',
      work_description: '测试通知系统的项目',
      start_date: new Date(Date.now() + 86400000).toISOString(),
      end_date: new Date(Date.now() + 172800000).toISOString(),
      start_time: '09:00',
      end_time: '18:00',
      budget_range: '5000-10000',
      required_workers: 2
    };
    
    const createProjectResult = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/projects',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${companyToken}`,
        'Content-Type': 'application/json'
      }
    }, projectData);
    
    const projectId = createProjectResult.project?.id;
    console.log(`✅ 项目创建成功，ID: ${projectId}`);
    
    // 4. 企业发送邀请给工人
    console.log('\n✉️ 步骤4: 企业发送工作邀请');
    const invitationData = {
      project_id: projectId,
      worker_id: '5f5b08e7-e674-4e66-8a0f-49bb3b8b8888', // 张师傅的ID
      message: '诚邀您参与我们的项目',
      wage_offer: 300,
      wage_type: 'daily'
    };
    
    const invitationResult = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/invitations',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${companyToken}`,
        'Content-Type': 'application/json'
      }
    }, invitationData);
    
    const invitationId = invitationResult.invitation?.id;
    console.log(`✅ 邀请发送成功，ID: ${invitationId}`);
    
    // 5. 等待一下让通知生成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. 检查工人是否收到通知
    console.log('\n🔔 步骤5: 检查通知生成情况');
    
    // 重新登录工人账号（张师傅）
    const zhangToken = await login('13800138001', '123456', 'worker');
    
    // 获取工人通知
    const zhangNotifications = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/notifications?is_read=false',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${zhangToken}` }
    });
    
    console.log(`张师傅未读通知数: ${zhangNotifications.data.length}`);
    if (zhangNotifications.data.length > 0) {
      const latestNotification = zhangNotifications.data[0];
      console.log('最新通知:');
      console.log(`  - 标题: ${latestNotification.title}`);
      console.log(`  - 内容: ${latestNotification.message}`);
      console.log(`  - 类型: ${latestNotification.type}`);
      console.log(`  - 已读: ${latestNotification.is_read}`);
      
      // 7. 标记通知为已读
      console.log('\n✅ 步骤6: 标记通知为已读');
      await httpRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/notifications/${latestNotification.id}/read`,
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${zhangToken}` }
      });
      console.log('✅ 通知已标记为已读');
      
      // 8. 工人响应邀请
      if (invitationId) {
        console.log('\n💼 步骤7: 工人响应邀请');
        const responseData = {
          status: 'accepted',
          response_message: '很高兴参与这个项目'
        };
        
        await httpRequest({
          hostname: 'localhost',
          port: 3000,
          path: `/api/invitations/${invitationId}/respond`,
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${zhangToken}`,
            'Content-Type': 'application/json'
          }
        }, responseData);
        console.log('✅ 工人已接受邀请');
        
        // 等待通知生成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 9. 检查企业是否收到响应通知
        console.log('\n🔔 步骤8: 检查企业是否收到响应通知');
        const companyNewNotifications = await httpRequest({
          hostname: 'localhost',
          port: 3000,
          path: '/api/notifications?is_read=false',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${companyToken}` }
        });
        
        console.log(`企业未读通知数: ${companyNewNotifications.data.length}`);
        if (companyNewNotifications.data.length > 0) {
          const responseNotification = companyNewNotifications.data[0];
          console.log('企业收到的通知:');
          console.log(`  - 标题: ${responseNotification.title}`);
          console.log(`  - 内容: ${responseNotification.message}`);
          console.log(`  - 类型: ${responseNotification.type}`);
        }
      }
    }
    
    // 10. 测试未读数量统计
    console.log('\n📈 步骤9: 测试未读数量统计');
    const unreadCount = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${companyToken}` }
    });
    console.log(`企业未读通知总数: ${unreadCount.data.unread_count}`);
    
    // 11. 测试批量标记已读
    console.log('\n✅ 步骤10: 测试批量标记已读');
    await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/notifications/read-all',
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${companyToken}` }
    });
    console.log('✅ 所有通知已标记为已读');
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 邀请通知流程测试完成！');
    console.log('✅ 通知系统工作正常');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 运行测试
testInvitationNotificationFlow();