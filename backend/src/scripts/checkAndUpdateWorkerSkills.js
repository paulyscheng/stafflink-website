const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function checkAndUpdateWorkerSkills() {
  try {
    console.log('🔍 检查工人技能分配...\n');
    
    // 1. 获取所有工人及其技能
    const workersWithSkills = await db.query(`
      SELECT 
        w.id, 
        w.name, 
        w.phone,
        w.experience_years,
        w.status,
        array_agg(s.name ORDER BY s.name) as skills,
        array_agg(s.id ORDER BY s.name) as skill_ids
      FROM workers w
      LEFT JOIN worker_skills ws ON w.id = ws.worker_id
      LEFT JOIN skills s ON ws.skill_id = s.id
      GROUP BY w.id, w.name, w.phone, w.experience_years, w.status
      ORDER BY w.id
    `);

    console.log('当前工人技能分配：');
    console.log('═══════════════════════════════════════════════════════════════');
    
    workersWithSkills.rows.forEach(worker => {
      const skills = worker.skills[0] ? worker.skills.filter(s => s !== null) : [];
      console.log(`👷 ${worker.name} (${worker.phone})`);
      console.log(`   经验: ${worker.experience_years}年 | 状态: ${worker.status}`);
      console.log(`   技能: ${skills.length > 0 ? skills.join(', ') : '❌ 无技能'}`);
      console.log('---');
    });

    // 2. 获取所有可用技能
    const allSkills = await db.query('SELECT id, name, category FROM skills ORDER BY category, name');
    
    console.log('\n\n📋 所有可用技能：');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const skillsByCategory = {};
    allSkills.rows.forEach(skill => {
      if (!skillsByCategory[skill.category]) {
        skillsByCategory[skill.category] = [];
      }
      skillsByCategory[skill.category].push(skill);
    });

    Object.keys(skillsByCategory).forEach(category => {
      console.log(`\n【${category}】`);
      skillsByCategory[category].forEach(skill => {
        console.log(`   - ${skill.name} (ID: ${skill.id})`);
      });
    });

    // 3. 重新分配技能，让工人有更多样化的技能
    console.log('\n\n🔧 开始重新分配技能，使其更加多样化...\n');

    // 获取工人的实际 UUID
    const workers = workersWithSkills.rows;
    
    // 定义技能分配方案（使用实际的工人名称映射）
    const skillAssignments = [
      { name: '张师傅', skills: ['电工', '管道安装', '家电维修'], address: '北京市朝阳区建国路88号' },
      { name: '李师傅', skills: ['木工', '吊顶安装', '防水'], address: '北京市海淀区中关村大街1号' },
      { name: '王师傅', skills: ['泥瓦工', '贴砖', '刷漆'], address: '北京市东城区王府井大街255号' },
      { name: '赵师傅', skills: ['司机', '装卸工', '仓库管理员'], address: '北京市西城区西单北大街110号' },
      { name: '刘师傅', skills: ['焊工', '钢筋工', '架子工'], address: '北京市丰台区丰台路63号' },
      { name: '陈阿姨', skills: ['家政服务', '清洁工', '收银员'], address: '北京市石景山区石景山路68号' },
      { name: '孙师傅', skills: ['厨师', '烧烤师', '厨房助手'], address: '北京市通州区新华大街1号' },
      { name: '周师傅', skills: ['装配工', '质检员', '操作员'], address: '北京市顺义区府前街6号' },
      { name: '吴师傅', skills: ['园艺工', '清洁工', '保安'], address: '北京市昌平区政府街1号' },
      { name: '郑阿姨', skills: ['服务员', '传菜员', '洗碗工'], address: '北京市大兴区兴政街15号' },
    ];

    // 清除现有技能分配
    await db.query('DELETE FROM worker_skills');
    console.log('✅ 已清除旧的技能分配');

    // 分配新技能
    for (const assignment of skillAssignments) {
      // 找到对应的工人
      const worker = workers.find(w => w.name === assignment.name);
      
      if (!worker) {
        console.log(`⚠️ 未找到工人: ${assignment.name}`);
        continue;
      }
      
      console.log(`\n👷 为 ${assignment.name} 分配技能...`);
      
      // 更新工人地址
      if (assignment.address) {
        await db.query(
          'UPDATE workers SET address = $1 WHERE id = $2',
          [assignment.address, worker.id]
        );
        console.log(`   ✅ 更新地址: ${assignment.address}`);
      }
      
      for (const skillName of assignment.skills) {
        // 查找技能ID
        const skillResult = await db.query(
          'SELECT id FROM skills WHERE name = $1',
          [skillName]
        );
        
        if (skillResult.rows.length > 0) {
          const skillId = skillResult.rows[0].id;
          
          // 分配技能给工人（使用实际的 UUID）
          await db.query(
            'INSERT INTO worker_skills (worker_id, skill_id, proficiency_level) VALUES ($1, $2, $3)',
            [worker.id, skillId, Math.floor(Math.random() * 3) + 3] // 熟练度 3-5
          );
          
          console.log(`   ✅ 已分配: ${skillName}`);
        } else {
          console.log(`   ⚠️ 未找到技能: ${skillName}`);
        }
      }
    }

    // 4. 验证新的技能分配
    console.log('\n\n✨ 更新后的工人技能分配：');
    console.log('═══════════════════════════════════════════════════════════════');
    
    const updatedWorkers = await db.query(`
      SELECT 
        w.id, 
        w.name, 
        w.phone,
        w.experience_years,
        array_agg(s.name ORDER BY s.name) as skills,
        array_agg(ws.proficiency_level ORDER BY s.name) as proficiency_levels
      FROM workers w
      LEFT JOIN worker_skills ws ON w.id = ws.worker_id
      LEFT JOIN skills s ON ws.skill_id = s.id
      GROUP BY w.id, w.name, w.phone, w.experience_years
      ORDER BY w.id
    `);

    updatedWorkers.rows.forEach(worker => {
      const skills = worker.skills[0] ? worker.skills.filter(s => s !== null) : [];
      const levels = worker.proficiency_levels[0] ? worker.proficiency_levels.filter(l => l !== null) : [];
      
      console.log(`\n👷 ${worker.name} (${worker.phone})`);
      console.log(`   经验: ${worker.experience_years}年`);
      
      if (skills.length > 0) {
        console.log('   技能：');
        skills.forEach((skill, index) => {
          const stars = '⭐'.repeat(levels[index] || 3);
          console.log(`     - ${skill} ${stars}`);
        });
      } else {
        console.log('   技能: 无');
      }
    });

    // 5. 统计
    const stats = await db.query(`
      SELECT 
        COUNT(DISTINCT worker_id) as workers_with_skills,
        COUNT(*) as total_assignments,
        AVG(proficiency_level) as avg_proficiency
      FROM worker_skills
    `);

    console.log('\n\n📊 统计信息：');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`总工人数: 10`);
    console.log(`有技能的工人: ${stats.rows[0].workers_with_skills}`);
    console.log(`技能分配总数: ${stats.rows[0].total_assignments}`);
    console.log(`平均熟练度: ${parseFloat(stats.rows[0].avg_proficiency).toFixed(1)} ⭐`);

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    process.exit();
  }
}

// 运行脚本
checkAndUpdateWorkerSkills();