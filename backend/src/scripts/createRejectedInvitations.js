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

async function createRejectedInvitations() {
  try {
    console.log('🔍 创建被拒绝的测试邀请...\n');

    // 获取测试数据
    const workerResult = await pool.query(`
      SELECT id FROM workers WHERE phone = '13800138002'
    `);
    const worker = workerResult.rows[0];

    const companyResult = await pool.query(`
      SELECT id FROM companies LIMIT 1
    `);
    const company = companyResult.rows[0];

    const projectsResult = await pool.query(`
      SELECT id, project_name FROM projects LIMIT 3
    `);
    const projects = projectsResult.rows;

    // 创建被拒绝的邀请
    const rejectedInvitations = [
      {
        id: uuidv4(),
        project_id: projects[0].id,
        project_name: projects[0].project_name,
        status: 'rejected',
        wage_offer: 60,
        wage_type: 'hourly',
        message: '需要电工进行线路维修'
      },
      {
        id: uuidv4(),
        project_id: projects[1] ? projects[1].id : projects[0].id,
        project_name: projects[1] ? projects[1].project_name : projects[0].project_name,
        status: 'rejected',
        wage_offer: 400,
        wage_type: 'daily',
        message: '商场清洁工作'
      }
    ];

    for (const inv of rejectedInvitations) {
      await pool.query(`
        INSERT INTO invitations (
          id, project_id, worker_id, company_id,
          status, wage_amount, wage_unit, message,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
        )
      `, [
        inv.id,
        inv.project_id,
        worker.id,
        company.id,
        inv.status,
        inv.wage_amount,
        inv.wage_unit,
        inv.message
      ]);
      
      console.log(`✅ 创建被拒绝的邀请: ${inv.project_name}`);
    }

    // 查看所有邀请
    const allInvitations = await pool.query(`
      SELECT 
        i.status,
        COUNT(*) as count
      FROM invitations i
      WHERE i.worker_id = $1
      GROUP BY i.status
    `, [worker.id]);

    console.log('\n📊 邀请统计:');
    console.table(allInvitations.rows);

  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

createRejectedInvitations();