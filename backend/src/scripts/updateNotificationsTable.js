const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// 直接创建数据库连接
const pool = new Pool({
  host: process.env.DB_HOST || 'gz-postgres-peldbckv.sql.tencentcdb.com',
  port: process.env.DB_PORT || 23309,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'staffLink',
  password: process.env.DB_PASSWORD || 'SkzgEBg-23YbBpc',
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateNotificationsTable() {
  try {
    console.log('🔄 开始更新通知表结构...');
    
    // 先删除旧表
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
    console.log('✅ 旧表已删除');
    
    // 创建新表，使用UUID作为receiver_id和sender_id
    const createTableQuery = `
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        
        -- 接收者信息（使用UUID）
        user_id UUID NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('worker', 'company')),
        
        -- 发送者信息（使用UUID，可选）
        sender_id UUID,
        sender_type VARCHAR(20) CHECK (sender_type IN ('worker', 'company')),
        
        -- 通知内容
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        
        -- 关联数据
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL,
        job_record_id UUID REFERENCES job_records(id) ON DELETE SET NULL,
        
        -- 状态
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        
        -- 元数据
        metadata JSONB DEFAULT '{}',
        
        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(createTableQuery);
    console.log('✅ 新表创建成功');
    
    // 创建索引
    const indexes = [
      `CREATE INDEX idx_notifications_receiver ON notifications(user_id, user_type)`,
      `CREATE INDEX idx_notifications_unread ON notifications(user_id, user_type, is_read) WHERE is_read = false`,
      `CREATE INDEX idx_notifications_created ON notifications(created_at DESC)`,
      `CREATE INDEX idx_notifications_type ON notifications(type)`,
      `CREATE INDEX idx_notifications_project ON notifications(project_id) WHERE project_id IS NOT NULL`
    ];
    
    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    console.log('✅ 索引创建成功');
    
    // 创建触发器
    const triggerQuery = `
      CREATE OR REPLACE FUNCTION update_notifications_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_notifications_timestamp ON notifications;
      
      CREATE TRIGGER trigger_update_notifications_timestamp
      BEFORE UPDATE ON notifications
      FOR EACH ROW
      EXECUTE FUNCTION update_notifications_updated_at();
    `;
    
    await pool.query(triggerQuery);
    console.log('✅ 触发器创建成功');
    
    // 获取一些真实的ID用于测试数据
    const companies = await pool.query('SELECT id, company_name FROM companies LIMIT 1');
    const workers = await pool.query('SELECT id, name FROM workers LIMIT 2');
    
    if (companies.rows.length > 0 && workers.rows.length > 0) {
      const companyId = companies.rows[0].id;
      const companyName = companies.rows[0].company_name;
      const workerId1 = workers.rows[0].id;
      const workerName1 = workers.rows[0].name;
      
      // 插入测试数据
      const testNotifications = [
        {
          receiver_id: companyId,
          receiver_type: 'company',
          sender_id: workerId1,
          sender_type: 'worker',
          type: 'invitation_accepted',
          title: '工人已确认',
          message: `${workerName1}已确认参与"办公室装修"项目`,
          metadata: { workerName: workerName1, projectName: '办公室装修' }
        },
        {
          receiver_id: workerId1,
          receiver_type: 'worker',
          sender_id: companyId,
          sender_type: 'company',
          type: 'invitation_received',
          title: '新工作机会',
          message: `${companyName}邀请您参与"厨房改造"项目`,
          metadata: { companyName: companyName, projectName: '厨房改造' }
        }
      ];
      
      for (const notification of testNotifications) {
        const insertQuery = `
          INSERT INTO notifications (
            user_id, user_type, sender_id, sender_type,
            type, title, message, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;
        
        const values = [
          notification.user_id,
          notification.user_type,
          notification.sender_id,
          notification.sender_type,
          notification.type,
          notification.title,
          notification.message,
          JSON.stringify(notification.metadata)
        ];
        
        const result = await pool.query(insertQuery, values);
        console.log(`✅ 测试通知创建: ${result.rows[0].title}`);
      }
    }
    
    // 显示表结构
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 更新后的通知表结构:');
    console.table(tableInfo.rows);
    
    console.log('\n🎉 通知表更新完成！');
    
  } catch (error) {
    console.error('❌ 更新失败:', error.message);
  } finally {
    await pool.end();
  }
}

updateNotificationsTable();