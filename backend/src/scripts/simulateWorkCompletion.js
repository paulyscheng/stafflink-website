const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
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

async function simulateWorkCompletion() {
  try {
    console.log('🔧 模拟工作完成流程...\n');

    // 1. 获取李师傅的已接受工作
    const jobResult = await pool.query(`
      SELECT 
        jr.*,
        w.name as worker_name,
        c.company_name
      FROM job_records jr
      LEFT JOIN workers w ON jr.worker_id = w.id
      LEFT JOIN companies c ON jr.company_id = c.id
      WHERE jr.worker_id = '410202c6-d5f1-456d-b0be-365d6189569a'
      AND jr.status = 'accepted'
      LIMIT 1
    `);

    if (jobResult.rows.length === 0) {
      console.log('❌ 李师傅没有已接受的工作');
      return;
    }

    const job = jobResult.rows[0];
    console.log('📋 找到工作记录:');
    console.log('- ID:', job.id);
    console.log('- 工人:', job.worker_name);
    console.log('- 公司:', job.company_name);
    console.log('- 当前状态:', job.status);

    // 2. 模拟签到（arrived）
    console.log('\n⏰ 模拟工人签到...');
    await pool.query(`
      UPDATE job_records
      SET 
        status = 'arrived',
        arrival_time = NOW() - INTERVAL '2 hours',
        arrival_location = $1,
        updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify({ latitude: 31.2304, longitude: 121.4737 }), job.id]);
    console.log('✅ 工人已签到');

    // 3. 模拟开始工作（working）
    console.log('\n🔨 模拟开始工作...');
    await pool.query(`
      UPDATE job_records
      SET 
        status = 'working',
        start_work_time = NOW() - INTERVAL '90 minutes',
        updated_at = NOW()
      WHERE id = $1
    `, [job.id]);
    console.log('✅ 工人开始工作');

    // 4. 模拟完成工作（completed）
    console.log('\n✨ 模拟完成工作...');
    
    // 创建模拟的工作照片数据
    const workPhotos = [
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500',
      'https://images.unsplash.com/photo-1581092160607-ee22c0b89162?w=500',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500'
    ];

    await pool.query(`
      UPDATE job_records
      SET 
        status = 'completed',
        complete_time = NOW(),
        completion_notes = '工作已按要求完成。清洁了所有指定区域，包括地面、墙面和窗户。垃圾已清理并分类处理。',
        work_photos = $1,
        updated_at = NOW()
      WHERE id = $2
    `, [JSON.stringify(workPhotos), job.id]);
    console.log('✅ 工作已完成');
    console.log('- 完成说明已添加');
    console.log('- 工作照片已上传（3张）');

    // 5. 查看最终状态
    const finalResult = await pool.query(`
      SELECT 
        id,
        status,
        arrival_time,
        start_work_time,
        complete_time,
        completion_notes,
        work_photos
      FROM job_records
      WHERE id = $1
    `, [job.id]);

    console.log('\n📊 最终工作记录状态:');
    const final = finalResult.rows[0];
    console.log('- 状态:', final.status);
    console.log('- 签到时间:', final.arrival_time);
    console.log('- 开始时间:', final.start_work_time);
    console.log('- 完成时间:', final.complete_time);
    console.log('- 照片数量:', final.work_photos ? JSON.parse(JSON.stringify(final.work_photos)).length : 0);

    // 计算工作时长
    if (final.start_work_time && final.complete_time) {
      const duration = new Date(final.complete_time) - new Date(final.start_work_time);
      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      console.log('- 工作时长:', `${hours}小时${minutes}分钟`);
    }

    console.log('\n🎉 工作完成流程模拟成功！');
    console.log('现在企业端可以看到并确认这个已完成的工作了。');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

simulateWorkCompletion();