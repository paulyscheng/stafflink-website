const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function viewWorkerSkills() {
  try {
    console.log('\n🏢 StaffLink 工人技能分布报告');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 获取所有工人及其技能
    const workersWithSkills = await db.query(`
      SELECT 
        w.id, 
        w.name, 
        w.phone,
        w.experience_years,
        w.status,
        array_agg(s.name ORDER BY s.name) as skills,
        array_agg(s.category ORDER BY s.name) as categories,
        array_agg(ws.proficiency_level ORDER BY s.name) as proficiency_levels
      FROM workers w
      LEFT JOIN worker_skills ws ON w.id = ws.worker_id
      LEFT JOIN skills s ON ws.skill_id = s.id
      GROUP BY w.id, w.name, w.phone, w.experience_years, w.status
      ORDER BY w.name
    `);

    console.log('👷 工人技能详情：');
    console.log('───────────────────────────────────────────────────────────────');
    
    workersWithSkills.rows.forEach((worker, index) => {
      const skills = worker.skills[0] ? worker.skills.filter(s => s !== null) : [];
      const categories = worker.categories[0] ? worker.categories.filter(c => c !== null) : [];
      const levels = worker.proficiency_levels[0] ? worker.proficiency_levels.filter(l => l !== null) : [];
      
      // 获取独特的技能类别
      const uniqueCategories = [...new Set(categories)];
      
      console.log(`\n${index + 1}. ${worker.name}`);
      console.log(`   📱 电话: ${worker.phone}`);
      console.log(`   💼 经验: ${worker.experience_years}年`);
      console.log(`   📍 状态: ${getStatusEmoji(worker.status)} ${getStatusText(worker.status)}`);
      console.log(`   🏭 技能领域: ${uniqueCategories.map(c => getCategoryName(c)).join(', ')}`);      
      if (skills.length > 0) {
        console.log('   🔧 技能列表:');
        skills.forEach((skill, idx) => {
          const stars = '⭐'.repeat(levels[idx] || 3);
          console.log(`      • ${skill} ${stars}`);
        });
      } else {
        console.log('   ❌ 暂无技能');
      }
    });

    // 统计按技能类别分组
    console.log('\n\n📊 技能类别统计：');
    console.log('───────────────────────────────────────────────────────────────');
    
    const categoryStats = await db.query(`
      SELECT 
        s.category,
        COUNT(DISTINCT ws.worker_id) as worker_count,
        COUNT(*) as skill_assignments,
        AVG(ws.proficiency_level) as avg_proficiency
      FROM worker_skills ws
      JOIN skills s ON ws.skill_id = s.id
      GROUP BY s.category
      ORDER BY worker_count DESC
    `);

    categoryStats.rows.forEach(stat => {
      console.log(`\n【${getCategoryName(stat.category)}】`);
      console.log(`   工人数: ${stat.worker_count} 人`);
      console.log(`   技能分配: ${stat.skill_assignments} 项`);
      console.log(`   平均熟练度: ${parseFloat(stat.avg_proficiency).toFixed(1)} ⭐`);
    });

    // 热门技能统计
    console.log('\n\n🔥 热门技能 TOP 10：');
    console.log('───────────────────────────────────────────────────────────────');
    
    const topSkills = await db.query(`
      SELECT 
        s.name,
        s.category,
        COUNT(ws.worker_id) as worker_count,
        AVG(ws.proficiency_level) as avg_proficiency
      FROM skills s
      JOIN worker_skills ws ON s.id = ws.skill_id
      GROUP BY s.id, s.name, s.category
      ORDER BY worker_count DESC, avg_proficiency DESC
      LIMIT 10
    `);

    topSkills.rows.forEach((skill, index) => {
      console.log(`   ${index + 1}. ${skill.name} (${getCategoryName(skill.category)})`);
      console.log(`      拥有工人: ${skill.worker_count} 人 | 平均熟练度: ${parseFloat(skill.avg_proficiency).toFixed(1)} ⭐`);
    });

    // 总体统计
    const totalStats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM workers) as total_workers,
        (SELECT COUNT(DISTINCT worker_id) FROM worker_skills) as workers_with_skills,
        (SELECT COUNT(*) FROM worker_skills) as total_skill_assignments,
        (SELECT AVG(proficiency_level) FROM worker_skills) as avg_proficiency,
        (SELECT COUNT(DISTINCT skill_id) FROM worker_skills) as unique_skills_used
    `);

    const stats = totalStats.rows[0];
    
    console.log('\n\n📈 总体统计：');
    console.log('───────────────────────────────────────────────────────────────');
    console.log(`   工人总数: ${stats.total_workers} 人`);
    console.log(`   有技能的工人: ${stats.workers_with_skills} 人`);
    console.log(`   技能覆盖率: ${((stats.workers_with_skills / stats.total_workers) * 100).toFixed(0)}%`);
    console.log(`   技能分配总数: ${stats.total_skill_assignments} 项`);
    console.log(`   人均技能数: ${(stats.total_skill_assignments / stats.workers_with_skills).toFixed(1)} 项`);
    console.log(`   使用的技能种类: ${stats.unique_skills_used} 种`);
    console.log(`   平均熟练度: ${parseFloat(stats.avg_proficiency).toFixed(1)} ⭐`);
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 错误:', error);
  } finally {
    process.exit();
  }
}

function getStatusEmoji(status) {
  const emojis = {
    'online': '🟢',
    'offline': '⚫',
    'busy': '🟡',
    'available': '🟢'
  };
  return emojis[status] || '⚪';
}

function getStatusText(status) {
  const texts = {
    'online': '在线',
    'offline': '离线',
    'busy': '忙碌',
    'available': '可用'
  };
  return texts[status] || status;
}

function getCategoryName(category) {
  const names = {
    'construction': '建筑装修',
    'manufacturing': '生产制造',
    'logistics': '物流运输',
    'food_beverage': '餐饮服务',
    'general_services': '综合服务'
  };
  return names[category] || category;
}

// 运行脚本
viewWorkerSkills();