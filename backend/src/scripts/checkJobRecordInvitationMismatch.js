const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function checkMismatch() {
  try {
    console.log('🔍 检查 "Aug 23 11:55" 项目的数据不匹配问题\n');
    
    // 1. 查找这个项目
    const projectResult = await pool.query(`
      SELECT id, project_name, created_at
      FROM projects
      WHERE project_name = 'Aug 23 11:55'
    `);
    
    if (projectResult.rows.length > 0) {
      const project = projectResult.rows[0];
      console.log('📋 项目信息:');
      console.log(`  ID: ${project.id}`);
      console.log(`  名称: ${project.project_name}`);
      console.log(`  创建时间: ${new Date(project.created_at).toLocaleString('zh-CN')}\n`);
      
      // 2. 查找相关的邀请
      console.log('📨 相关邀请:');
      const invitations = await pool.query(`
        SELECT 
          i.id,
          i.status,
          w.name as worker_name,
          i.created_at
        FROM invitations i
        LEFT JOIN workers w ON i.worker_id = w.id
        WHERE i.project_id = $1
      `, [project.id]);
      
      console.table(invitations.rows.map(inv => ({
        邀请ID: inv.id,
        状态: inv.status,
        工人: inv.worker_name,
        创建时间: new Date(inv.created_at).toLocaleString('zh-CN')
      })));
      
      // 3. 查找相关的工作记录
      console.log('\n💼 相关工作记录:');
      const jobRecords = await pool.query(`
        SELECT 
          jr.id,
          jr.invitation_id,
          jr.status,
          w.name as worker_name,
          jr.created_at
        FROM job_records jr
        LEFT JOIN workers w ON jr.worker_id = w.id
        WHERE jr.project_id = $1
      `, [project.id]);
      
      console.table(jobRecords.rows.map(jr => ({
        工作记录ID: jr.id.slice(0, 8) + '...',
        邀请ID: jr.invitation_id ? jr.invitation_id.slice(0, 8) + '...' : 'NULL',
        状态: jr.status,
        工人: jr.worker_name,
        创建时间: new Date(jr.created_at).toLocaleString('zh-CN')
      })));
      
      // 4. 检查周师傅的具体数据
      console.log('\n👷 周师傅的工作记录:');
      const zhouJobs = await pool.query(`
        SELECT 
          jr.id,
          jr.invitation_id,
          jr.project_id,
          p.project_name,
          jr.status
        FROM job_records jr
        LEFT JOIN workers w ON jr.worker_id = w.id
        LEFT JOIN projects p ON jr.project_id = p.id
        WHERE w.name = '周师傅'
        ORDER BY jr.created_at DESC
      `);
      
      console.table(zhouJobs.rows.map(job => ({
        工作ID: job.id.slice(0, 8) + '...',
        邀请ID: job.invitation_id ? job.invitation_id.slice(0, 8) + '...' : 'NULL',
        项目: job.project_name,
        状态: job.status
      })));
      
    } else {
      console.log('❌ 未找到 "Aug 23 11:55" 项目');
    }
    
    // 5. 查找错误的邀请ID
    console.log('\n🔍 查找错误的邀请ID: 24fe9d2e-efc5-46ba-b669-7ca23719249c');
    const wrongId = await pool.query(
      "SELECT * FROM invitations WHERE id = '24fe9d2e-efc5-46ba-b669-7ca23719249c'"
    );
    console.log(`  结果: ${wrongId.rows.length > 0 ? '存在' : '不存在'}`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkMismatch();