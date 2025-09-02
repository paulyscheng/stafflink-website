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

async function createNotificationsTable() {
  try {
    // 先删除旧表（如果存在）
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE');
    console.log('🗑️  旧通知表已删除');
    
    // 创建通知表
    const createTableQuery = `
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        
        -- 接收者信息
        user_id INTEGER NOT NULL,
        user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('worker', 'company')),
        
        -- 发送者信息（可选）
        sender_id INTEGER,
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
        
        -- 元数据（存储额外信息）
        metadata JSONB DEFAULT '{}',
        
        -- 时间戳
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTableQuery);
    console.log('✅ 通知表创建成功');

    // 创建索引以提高查询性能
    const indexes = [
      // 接收者索引 - 用于查询某个用户的所有通知
      `CREATE INDEX IF NOT EXISTS idx_notifications_receiver 
       ON notifications(user_id, user_type)`,
      
      // 未读通知索引 - 用于快速获取未读通知
      `CREATE INDEX IF NOT EXISTS idx_notifications_unread 
       ON notifications(user_id, user_type, is_read) 
       WHERE is_read = false`,
      
      // 时间排序索引 - 用于按时间排序
      `CREATE INDEX IF NOT EXISTS idx_notifications_created 
       ON notifications(created_at DESC)`,
      
      // 类型索引 - 用于按类型筛选
      `CREATE INDEX IF NOT EXISTS idx_notifications_type 
       ON notifications(type)`,
      
      // 项目关联索引
      `CREATE INDEX IF NOT EXISTS idx_notifications_project 
       ON notifications(project_id) 
       WHERE project_id IS NOT NULL`,
      
      // 邀请关联索引
      `CREATE INDEX IF NOT EXISTS idx_notifications_invitation 
       ON notifications(invitation_id) 
       WHERE invitation_id IS NOT NULL`
    ];

    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    console.log('✅ 索引创建成功');

    // 创建更新时间触发器
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

    // 查询表结构
    const tableInfo = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 通知表结构：');
    console.table(tableInfo.rows);

    // 插入测试数据（不依赖外键）
    const testNotifications = [
      {
        receiver_id: 1,
        receiver_type: 'company',
        sender_id: 1,
        sender_type: 'worker',
        type: 'invitation_accepted',
        title: '工人已确认',
        message: '张师傅已确认参与"办公室装修"项目',
        metadata: { workerName: '张师傅', projectName: '办公室装修' }
      },
      {
        receiver_id: 1,
        receiver_type: 'worker',
        sender_id: 1,
        sender_type: 'company',
        type: 'invitation_received',
        title: '新工作机会',
        message: '建筑有限公司邀请您参与"厨房改造"项目',
        metadata: { companyName: '建筑有限公司', projectName: '厨房改造' }
      },
      {
        receiver_id: 2,
        receiver_type: 'worker',
        sender_id: 1,
        sender_type: 'company',
        type: 'project_started',
        title: '工作即将开始',
        message: '"水电维修"项目将在1小时后开始',
        metadata: { projectName: '水电维修', startTime: new Date(Date.now() + 3600000).toISOString() }
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
      console.log(`✅ 测试通知创建成功: ${result.rows[0].title}`);
    }

    console.log('\n🎉 通知系统数据表初始化完成！');

  } catch (error) {
    console.error('❌ 创建通知表失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 执行创建
createNotificationsTable().catch(console.error);