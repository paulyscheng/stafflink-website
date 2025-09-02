const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

// 测试账号
const testCompany = {
  phone: '13900139000',
  smsCode: '123456'
};

const testWorker = {
  phone: '13800138001',
  smsCode: '123456'
};

async function testNotificationSystem() {
  try {
    console.log('🚀 开始测试通知系统...\n');

    // 1. 企业登录
    console.log('1️⃣ 企业登录...');
    const companyLogin = await axios.post(`${API_URL}/auth/company/login`, testCompany);
    const companyToken = companyLogin.data.token;
    console.log('✅ 企业登录成功');

    // 2. 工人登录
    console.log('\n2️⃣ 工人登录...');
    const workerLogin = await axios.post(`${API_URL}/auth/worker/login`, testWorker);
    const workerToken = workerLogin.data.token;
    console.log('✅ 工人登录成功');

    // 3. 测试获取企业通知列表
    console.log('\n3️⃣ 获取企业通知列表...');
    const companyNotifications = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${companyToken}` }
    });
    console.log(`✅ 获取到 ${companyNotifications.data.data.length} 条企业通知`);
    if (companyNotifications.data.data.length > 0) {
      console.log('第一条通知:', {
        title: companyNotifications.data.data[0].title,
        message: companyNotifications.data.data[0].message,
        type: companyNotifications.data.data[0].type,
        is_read: companyNotifications.data.data[0].is_read
      });
    }

    // 4. 测试获取工人通知列表
    console.log('\n4️⃣ 获取工人通知列表...');
    const workerNotifications = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log(`✅ 获取到 ${workerNotifications.data.data.length} 条工人通知`);
    if (workerNotifications.data.data.length > 0) {
      console.log('第一条通知:', {
        title: workerNotifications.data.data[0].title,
        message: workerNotifications.data.data[0].message,
        type: workerNotifications.data.data[0].type,
        is_read: workerNotifications.data.data[0].is_read
      });
    }

    // 5. 测试获取未读数量
    console.log('\n5️⃣ 获取未读通知数量...');
    const unreadCount = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    console.log(`✅ 工人有 ${unreadCount.data.data.unread_count} 条未读通知`);

    // 6. 测试标记已读
    if (workerNotifications.data.data.length > 0 && !workerNotifications.data.data[0].is_read) {
      console.log('\n6️⃣ 标记第一条通知为已读...');
      const notificationId = workerNotifications.data.data[0].id;
      await axios.put(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      console.log('✅ 标记已读成功');

      // 再次获取未读数量
      const newUnreadCount = await axios.get(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${workerToken}` }
      });
      console.log(`现在有 ${newUnreadCount.data.data.unread_count} 条未读通知`);
    }

    // 7. 测试筛选功能
    console.log('\n7️⃣ 测试筛选功能...');
    const filteredNotifications = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${workerToken}` },
      params: {
        is_read: false,
        limit: 5
      }
    });
    console.log(`✅ 获取到 ${filteredNotifications.data.data.length} 条未读通知（限制5条）`);

    // 8. 测试分页
    console.log('\n8️⃣ 测试分页功能...');
    const pagedNotifications = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${workerToken}` },
      params: {
        page: 1,
        limit: 2
      }
    });
    console.log('分页信息:', pagedNotifications.data.pagination);

    console.log('\n✅ 通知系统测试完成！所有功能正常工作。');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.response?.data || error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误详情:', error.response.data);
    }
  }
}

// 运行测试
testNotificationSystem();