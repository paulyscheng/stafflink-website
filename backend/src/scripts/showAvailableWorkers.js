const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function showAvailableWorkers() {
  try {
    console.log('🏢 企业创建项目时可选择的工人列表\n');
    console.log('═══════════════════════════════════════════════════════════════════════\n');
    
    // 按技能分类显示工人
    const categories = [
      { name: '建筑装修类', skills: ['电工', '木工', '水管工', '油漆工', '铺砖工', '泥瓦工', '防水工', '焊工', '钢筋工', '脚手架工'] },
      { name: '家政服务类', skills: ['保洁员', '家政服务', '钟点工', '月嫂', '育儿嫂', '护工'] },
      { name: '维修服务类', skills: ['空调维修', '家具安装', '维修工', '管道疏通', '园艺工'] },
      { name: '物流运输类', skills: ['搬运工', '装卸工', '司机'] },
      { name: '餐饮服务类', skills: ['厨师', '配菜员', '面点师'] },
      { name: '制造业类', skills: ['装配工', '普工', '质检员'] }
    ];
    
    for (const category of categories) {
      // 获取该类别下有技能的工人
      const skillsCondition = category.skills.map(s => `'${s}'`).join(',');
      const query = `
        SELECT DISTINCT
          w.id,
          w.name,
          w.phone,
          w.rating,
          w.status,
          w.experience_years,
          w.completed_jobs,
          w.total_jobs,
          w.address,
          STRING_AGG(s.name, ', ' ORDER BY ws.proficiency_level DESC) as skills
        FROM workers w
        JOIN worker_skills ws ON w.id = ws.worker_id
        JOIN skills s ON ws.skill_id = s.id
        WHERE s.name IN (${skillsCondition})
        GROUP BY w.id
        ORDER BY w.rating DESC, w.experience_years DESC
      `;
      
      const result = await db.query(query);
      
      if (result.rows.length > 0) {
        console.log(`📦 ${category.name} (${result.rows.length}人)\n`);
        
        for (const worker of result.rows) {
          const statusIcon = worker.status === 'online' ? '🟢' : worker.status === 'busy' ? '🟡' : '⚫';
          const completionRate = worker.total_jobs > 0 
            ? Math.round((worker.completed_jobs / worker.total_jobs) * 100) 
            : 0;
          
          console.log(`  ${statusIcon} ${worker.name}`);
          console.log(`     📱 电话: ${worker.phone}`);
          console.log(`     ⭐ 评分: ${worker.rating}/5.0 | 🏆 完成率: ${completionRate}%`);
          console.log(`     🛠️ 技能: ${worker.skills}`);
          console.log(`     📍 地址: ${worker.address}`);
          console.log(`     💼 经验: ${worker.experience_years}年 | 完成工作: ${worker.completed_jobs}个`);
          console.log();
        }
        console.log('───────────────────────────────────────────────────────────────────────\n');
      }
    }
    
    // 显示所有在线工人统计
    const onlineQuery = `
      SELECT COUNT(*) as count FROM workers WHERE status = 'online'
    `;
    const onlineResult = await db.query(onlineQuery);
    
    const busyQuery = `
      SELECT COUNT(*) as count FROM workers WHERE status = 'busy'
    `;
    const busyResult = await db.query(busyQuery);
    
    const totalQuery = `
      SELECT COUNT(*) as count FROM workers
    `;
    const totalResult = await db.query(totalQuery);
    
    console.log('📊 工人状态统计\n');
    console.log(`   🟢 在线可用: ${onlineResult.rows[0].count} 人`);
    console.log(`   🟡 忙碌中: ${busyResult.rows[0].count} 人`);
    console.log(`   📋 总计: ${totalResult.rows[0].count} 人\n`);
    
    console.log('💡 提示：');
    console.log('   - 🟢 表示工人在线，可立即接单');
    console.log('   - 🟡 表示工人忙碌，可能需要等待');
    console.log('   - ⚫ 表示工人离线，暂时无法接单');
    console.log('   - 企业可以根据项目需求选择合适的工人');
    console.log('   - 系统会自动向选中的工人发送邀请');
    
  } catch (error) {
    console.error('❌ 查询失败:', error);
  } finally {
    process.exit();
  }
}

showAvailableWorkers();