const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function listWorkers() {
  try {
    console.log('📋 查询数据库中的工人列表...\n');
    
    // 查询所有工人
    const workersQuery = `
      SELECT 
        w.id,
        w.name,
        w.phone,
        w.age,
        w.gender,
        w.address,
        w.rating,
        w.total_jobs,
        w.completed_jobs,
        w.status,
        w.experience_years,
        w.created_at,
        COUNT(ws.skill_id) as skill_count
      FROM workers w
      LEFT JOIN worker_skills ws ON w.id = ws.worker_id
      GROUP BY w.id
      ORDER BY w.created_at DESC
    `;
    
    const result = await db.query(workersQuery);
    
    if (result.rows.length === 0) {
      console.log('❌ 数据库中没有工人数据\n');
      console.log('📝 需要先添加一些工人数据...');
      return;
    }
    
    console.log(`✅ 找到 ${result.rows.length} 个工人:\n`);
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
    for (const worker of result.rows) {
      console.log(`👷 工人信息`);
      console.log(`   ID: ${worker.id}`);
      console.log(`   姓名: ${worker.name}`);
      console.log(`   电话: ${worker.phone}`);
      console.log(`   年龄: ${worker.age || '未填写'}`);
      console.log(`   性别: ${worker.gender === 'male' ? '男' : worker.gender === 'female' ? '女' : '未填写'}`);
      console.log(`   地址: ${worker.address || '未填写'}`);
      console.log(`   评分: ${worker.rating || 0} ⭐`);
      console.log(`   经验: ${worker.experience_years || 0} 年`);
      console.log(`   完成工作: ${worker.completed_jobs || 0}/${worker.total_jobs || 0}`);
      console.log(`   状态: ${worker.status === 'online' ? '🟢 在线' : worker.status === 'busy' ? '🟡 忙碌' : '⚫ 离线'}`);
      console.log(`   技能数量: ${worker.skill_count}`);
      
      // 查询该工人的技能
      if (worker.skill_count > 0) {
        const skillsQuery = `
          SELECT s.name, s.category, ws.proficiency_level
          FROM worker_skills ws
          JOIN skills s ON ws.skill_id = s.id
          WHERE ws.worker_id = $1
          ORDER BY ws.proficiency_level DESC
          LIMIT 5
        `;
        const skillsResult = await db.query(skillsQuery, [worker.id]);
        
        if (skillsResult.rows.length > 0) {
          const skills = skillsResult.rows.map(s => 
            `${s.name}(${s.proficiency_level}级)`
          ).join(', ');
          console.log(`   主要技能: ${skills}`);
        }
      }
      
      console.log(`   注册时间: ${new Date(worker.created_at).toLocaleString('zh-CN')}`);
      console.log('───────────────────────────────────────────────────────────────────────\n');
    }
    
    // 统计信息
    console.log('📊 统计信息:');
    const onlineCount = result.rows.filter(w => w.status === 'online').length;
    const offlineCount = result.rows.filter(w => w.status === 'offline').length;
    const busyCount = result.rows.filter(w => w.status === 'busy').length;
    
    console.log(`   在线工人: ${onlineCount}`);
    console.log(`   离线工人: ${offlineCount}`);
    console.log(`   忙碌工人: ${busyCount}`);
    
    const avgRating = result.rows.reduce((sum, w) => sum + (parseFloat(w.rating) || 0), 0) / result.rows.length;
    console.log(`   平均评分: ${avgRating.toFixed(1)} ⭐`);
    
    const totalCompletedJobs = result.rows.reduce((sum, w) => sum + (parseInt(w.completed_jobs) || 0), 0);
    console.log(`   总完成工作数: ${totalCompletedJobs}`);
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    process.exit();
  }
}

listWorkers();