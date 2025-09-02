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

async function createTestJobRecords() {
  try {
    console.log('🔧 创建测试工作记录...\n');

    // 获取张师傅的信息
    const worker = await pool.query(
      "SELECT id, name FROM workers WHERE phone = '13800138001'"
    );
    
    if (worker.rows.length === 0) {
      console.log('❌ 未找到张师傅账号');
      return;
    }
    
    const workerId = worker.rows[0].id;
    const workerName = worker.rows[0].name;
    console.log(`找到工人: ${workerName} (ID: ${workerId})`);

    // 获取企业信息
    const company = await pool.query('SELECT id, company_name FROM companies LIMIT 1');
    if (company.rows.length === 0) {
      console.log('❌ 未找到企业账号');
      return;
    }
    
    const companyId = company.rows[0].id;
    const companyName = company.rows[0].company_name;
    console.log(`找到企业: ${companyName} (ID: ${companyId})`);

    // 获取项目信息
    const projects = await pool.query(
      'SELECT id, project_name, start_date FROM projects WHERE company_id = $1 LIMIT 3',
      [companyId]
    );

    if (projects.rows.length === 0) {
      console.log('❌ 未找到项目');
      return;
    }

    // 创建不同状态的工作记录
    const jobRecords = [
      {
        id: uuidv4(),
        project_id: projects.rows[0].id,
        worker_id: workerId,
        company_id: companyId,
        work_date: new Date(),
        status: 'accepted',
        payment_amount: 350,
        payment_type: 'daily',
        payment_status: 'pending'
      },
      {
        id: uuidv4(),
        project_id: projects.rows[1] ? projects.rows[1].id : projects.rows[0].id,
        worker_id: workerId,
        company_id: companyId,
        work_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 昨天
        status: 'arrived',
        arrival_time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2小时前
        arrival_location: JSON.stringify({
          latitude: 22.5431,
          longitude: 114.0579,
          accuracy: 15
        }),
        payment_amount: 400,
        payment_type: 'daily',
        payment_status: 'pending'
      },
      {
        id: uuidv4(),
        project_id: projects.rows[2] ? projects.rows[2].id : projects.rows[0].id,
        worker_id: workerId,
        company_id: companyId,
        work_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 前天
        status: 'working',
        arrival_time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5小时前
        start_work_time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4小时前
        arrival_location: JSON.stringify({
          latitude: 22.5431,
          longitude: 114.0579,
          accuracy: 10
        }),
        payment_amount: 60,
        payment_type: 'hourly',
        payment_status: 'pending'
      }
    ];

    // 插入工作记录
    let successCount = 0;
    for (const record of jobRecords) {
      try {
        const insertQuery = `
          INSERT INTO job_records (
            id, project_id, worker_id, company_id,
            start_date, status, wage_amount, payment_type,
            payment_status, arrival_time, start_work_time, arrival_location,
            created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            arrival_time = EXCLUDED.arrival_time,
            start_work_time = EXCLUDED.start_work_time,
            arrival_location = EXCLUDED.arrival_location
          RETURNING id, status;
        `;
        
        const values = [
          record.id,
          record.project_id,
          record.worker_id,
          record.company_id,
          record.start_date,
          record.status,
          record.wage_amount,
          record.payment_type,
          record.payment_status,
          record.arrival_time || null,
          record.start_work_time || null,
          record.arrival_location || null
        ];
        
        const result = await pool.query(insertQuery, values);
        
        // 获取项目名称
        const project = projects.rows.find(p => p.id === record.project_id);
        console.log(`✅ 创建工作记录: ${project?.project_name || '项目'} - 状态: ${record.status}`);
        successCount++;
      } catch (error) {
        console.error(`❌ 创建工作记录失败:`, error.message);
      }
    }

    // 统计结果
    const stats = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM job_records
      WHERE worker_id = $1
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'accepted' THEN 1
          WHEN 'arrived' THEN 2
          WHEN 'working' THEN 3
          WHEN 'completed' THEN 4
          WHEN 'confirmed' THEN 5
          ELSE 6
        END
    `, [workerId]);
    
    console.log('\n📊 工作记录统计:');
    console.table(stats.rows.map(row => ({
      状态: row.status,
      数量: row.count
    })));

    console.log('\n🎉 测试工作记录创建完成！');
    console.log('📱 现在可以用 13800138001 / 123456 登录测试工作管理功能了');
    console.log('\n功能测试流程:');
    console.log('1. 点击状态为"accepted"的工作 → 可以签到');
    console.log('2. 点击状态为"arrived"的工作 → 可以开始工作');
    console.log('3. 点击状态为"working"的工作 → 可以完成工作');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

// 执行
createTestJobRecords();