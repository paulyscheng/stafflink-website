const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

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

async function updateJobRecordsTable() {
  try {
    console.log('📦 更新 job_records 表结构...\n');

    // 添加新的状态值到枚举类型
    console.log('1. 更新状态枚举类型...');
    await pool.query(`
      -- 先删除默认值约束
      ALTER TABLE job_records 
      ALTER COLUMN status DROP DEFAULT;
      
      -- 删除旧的检查约束
      ALTER TABLE job_records 
      DROP CONSTRAINT IF EXISTS job_records_status_check;
      
      -- 添加新的检查约束，包含更多状态
      ALTER TABLE job_records 
      ADD CONSTRAINT job_records_status_check 
      CHECK (status IN (
        'invited',     -- 已邀请
        'accepted',    -- 已接受
        'rejected',    -- 已拒绝
        'arrived',     -- 已到岗
        'working',     -- 工作中
        'completed',   -- 工人标记完成
        'confirmed',   -- 企业确认完成
        'cancelled',   -- 已取消
        'paid'        -- 已支付
      ));
      
      -- 设置默认值
      ALTER TABLE job_records 
      ALTER COLUMN status SET DEFAULT 'invited';
    `);
    console.log('✅ 状态枚举更新成功');

    // 添加工作追踪字段
    console.log('\n2. 添加工作追踪字段...');
    
    // 检查并添加字段
    const checkAndAddColumn = async (columnName, columnDef) => {
      const checkResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'job_records' 
        AND column_name = $1
      `, [columnName]);
      
      if (checkResult.rows.length === 0) {
        await pool.query(`ALTER TABLE job_records ADD COLUMN ${columnName} ${columnDef}`);
        console.log(`✅ 添加字段: ${columnName}`);
      } else {
        console.log(`⏭️  字段已存在: ${columnName}`);
      }
    };

    // 添加各种追踪字段
    await checkAndAddColumn('arrival_time', 'TIMESTAMP');
    await checkAndAddColumn('arrival_location', 'JSONB');
    await checkAndAddColumn('start_work_time', 'TIMESTAMP');
    await checkAndAddColumn('complete_time', 'TIMESTAMP');
    await checkAndAddColumn('confirm_time', 'TIMESTAMP');
    await checkAndAddColumn('actual_hours', 'DECIMAL(10,2)');
    await checkAndAddColumn('work_photos', 'JSONB DEFAULT \'[]\'::jsonb');
    await checkAndAddColumn('completion_notes', 'TEXT');
    await checkAndAddColumn('confirmation_notes', 'TEXT');
    await checkAndAddColumn('quality_rating', 'INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5)');

    // 创建工作照片表（用于存储照片详情）
    console.log('\n3. 创建工作照片表...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_photos (
        id SERIAL PRIMARY KEY,
        job_record_id UUID NOT NULL REFERENCES job_records(id) ON DELETE CASCADE,
        photo_url VARCHAR(500) NOT NULL,
        photo_type VARCHAR(50) DEFAULT 'progress',
        description TEXT,
        uploaded_by UUID NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('✅ 工作照片表创建成功');

    // 创建索引优化查询
    console.log('\n4. 创建索引...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_job_records_status 
      ON job_records(status);
      
      CREATE INDEX IF NOT EXISTS idx_job_records_worker_status 
      ON job_records(worker_id, status);
      
      CREATE INDEX IF NOT EXISTS idx_job_records_project_status 
      ON job_records(project_id, status);
      
      CREATE INDEX IF NOT EXISTS idx_work_photos_job_record 
      ON work_photos(job_record_id);
    `);
    console.log('✅ 索引创建成功');

    // 查看更新后的表结构
    console.log('\n5. 验证表结构...');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'job_records'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 job_records 表结构:');
    console.table(columns.rows.map(col => ({
      字段名: col.column_name,
      类型: col.data_type,
      可空: col.is_nullable,
      默认值: col.column_default ? col.column_default.substring(0, 30) : null
    })));

    // 统计现有数据
    const stats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM job_records
      GROUP BY status
      ORDER BY count DESC
    `);
    
    if (stats.rows.length > 0) {
      console.log('\n📈 现有工作记录状态分布:');
      console.table(stats.rows);
    }

    console.log('\n🎉 job_records 表更新完成！');
    console.log('✨ 新增功能:');
    console.log('   - 完整的工作状态流转');
    console.log('   - 签到/签退时间记录');
    console.log('   - 位置信息记录');
    console.log('   - 工作照片存储');
    console.log('   - 工作质量评分');
    console.log('   - 完成确认备注');

  } catch (error) {
    console.error('❌ 更新失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    await pool.end();
  }
}

// 执行更新
updateJobRecordsTable();