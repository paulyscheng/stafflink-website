const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function deleteProblematicJobRecord() {
  try {
    console.log('🗑️ 准备删除有问题的工单记录...\n');
    
    // 1. 查找Aug 23 11:55项目相关的所有记录
    const projectResult = await pool.query(
      "SELECT id FROM projects WHERE project_name = 'Aug 23 11:55'"
    );
    
    if (projectResult.rows.length > 0) {
      const projectId = projectResult.rows[0].id;
      console.log(`📋 找到项目: Aug 23 11:55 (ID: ${projectId})`);
      
      // 2. 删除相关的job_records
      const deleteJobRecords = await pool.query(
        'DELETE FROM job_records WHERE project_id = $1 RETURNING id, worker_id',
        [projectId]
      );
      
      console.log(`\n✅ 删除了 ${deleteJobRecords.rows.length} 条工作记录`);
      if (deleteJobRecords.rows.length > 0) {
        deleteJobRecords.rows.forEach(record => {
          console.log(`   - 工作记录: ${record.id}`);
        });
      }
      
      // 3. 删除相关的invitations
      const deleteInvitations = await pool.query(
        'DELETE FROM invitations WHERE project_id = $1 RETURNING id, worker_id',
        [projectId]
      );
      
      console.log(`\n✅ 删除了 ${deleteInvitations.rows.length} 条邀请记录`);
      if (deleteInvitations.rows.length > 0) {
        deleteInvitations.rows.forEach(inv => {
          console.log(`   - 邀请记录: ${inv.id}`);
        });
      }
      
      // 4. 删除项目本身
      const deleteProject = await pool.query(
        'DELETE FROM projects WHERE id = $1 RETURNING project_name',
        [projectId]
      );
      
      console.log(`\n✅ 删除了项目: ${deleteProject.rows[0].project_name}`);
      
    } else {
      console.log('❌ 未找到 "Aug 23 11:55" 项目');
      
      // 尝试直接删除有问题的job_record
      const problematicJobId = '24fe9d2e-efc5-46ba-b669-7ca23719249c';
      console.log(`\n🔍 尝试直接删除工作记录: ${problematicJobId}`);
      
      const directDelete = await pool.query(
        'DELETE FROM job_records WHERE id = $1 RETURNING *',
        [problematicJobId]
      );
      
      if (directDelete.rows.length > 0) {
        console.log('✅ 成功删除有问题的工作记录');
        console.log(`   项目ID: ${directDelete.rows[0].project_id}`);
        console.log(`   工人ID: ${directDelete.rows[0].worker_id}`);
      } else {
        console.log('❌ 未找到该工作记录');
      }
    }
    
    // 5. 查看周师傅剩余的工作记录
    console.log('\n📋 周师傅当前的工作记录:');
    const remainingJobs = await pool.query(`
      SELECT 
        jr.id,
        jr.status,
        p.project_name,
        jr.created_at
      FROM job_records jr
      LEFT JOIN workers w ON jr.worker_id = w.id
      LEFT JOIN projects p ON jr.project_id = p.id
      WHERE w.name = '周师傅'
      ORDER BY jr.created_at DESC
    `);
    
    if (remainingJobs.rows.length > 0) {
      console.table(remainingJobs.rows.map(job => ({
        ID: job.id.slice(0, 8) + '...',
        项目: job.project_name,
        状态: job.status,
        创建时间: new Date(job.created_at).toLocaleString('zh-CN')
      })));
    } else {
      console.log('  周师傅暂无工作记录');
    }
    
    console.log('\n✅ 清理完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

deleteProblematicJobRecord();