const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function seedWorkers() {
  try {
    console.log('🌱 开始添加示例工人数据...\n');
    
    // 示例工人数据
    const workers = [
      {
        name: '张师傅',
        phone: '13800138001',
        age: 45,
        gender: 'male',
        address: '深圳市南山区',
        rating: 4.8,
        experience_years: 15,
        status: 'online',
        skills: [
          { name: '电工', proficiency: 5 },
          { name: '水管工', proficiency: 4 },
          { name: '空调维修', proficiency: 4 }
        ]
      },
      {
        name: '李师傅',
        phone: '13800138002',
        age: 38,
        gender: 'male',
        address: '深圳市福田区',
        rating: 4.6,
        experience_years: 10,
        status: 'online',
        skills: [
          { name: '木工', proficiency: 5 },
          { name: '油漆工', proficiency: 4 },
          { name: '家具安装', proficiency: 3 }
        ]
      },
      {
        name: '王师傅',
        phone: '13800138003',
        age: 42,
        gender: 'male',
        address: '深圳市龙华区',
        rating: 4.9,
        experience_years: 12,
        status: 'busy',
        skills: [
          { name: '铺砖工', proficiency: 5 },
          { name: '泥瓦工', proficiency: 5 },
          { name: '防水工', proficiency: 4 }
        ]
      },
      {
        name: '赵师傅',
        phone: '13800138004',
        age: 35,
        gender: 'male',
        address: '深圳市宝安区',
        rating: 4.5,
        experience_years: 8,
        status: 'online',
        skills: [
          { name: '搬运工', proficiency: 4 },
          { name: '装卸工', proficiency: 4 },
          { name: '司机', proficiency: 3 }
        ]
      },
      {
        name: '刘师傅',
        phone: '13800138005',
        age: 40,
        gender: 'male',
        address: '深圳市罗湖区',
        rating: 4.7,
        experience_years: 11,
        status: 'offline',
        skills: [
          { name: '焊工', proficiency: 5 },
          { name: '钢筋工', proficiency: 4 },
          { name: '脚手架工', proficiency: 4 }
        ]
      },
      {
        name: '陈阿姨',
        phone: '13800138006',
        age: 48,
        gender: 'female',
        address: '深圳市龙岗区',
        rating: 4.9,
        experience_years: 20,
        status: 'online',
        skills: [
          { name: '保洁员', proficiency: 5 },
          { name: '家政服务', proficiency: 5 },
          { name: '钟点工', proficiency: 4 }
        ]
      },
      {
        name: '孙师傅',
        phone: '13800138007',
        age: 36,
        gender: 'male',
        address: '深圳市坪山区',
        rating: 4.4,
        experience_years: 7,
        status: 'online',
        skills: [
          { name: '厨师', proficiency: 4 },
          { name: '配菜员', proficiency: 3 },
          { name: '面点师', proficiency: 3 }
        ]
      },
      {
        name: '周师傅',
        phone: '13800138008',
        age: 39,
        gender: 'male',
        address: '深圳市光明区',
        rating: 4.6,
        experience_years: 9,
        status: 'online',
        skills: [
          { name: '装配工', proficiency: 4 },
          { name: '普工', proficiency: 3 },
          { name: '质检员', proficiency: 4 }
        ]
      },
      {
        name: '吴师傅',
        phone: '13800138009',
        age: 43,
        gender: 'male',
        address: '深圳市大鹏新区',
        rating: 4.8,
        experience_years: 14,
        status: 'busy',
        skills: [
          { name: '园艺工', proficiency: 5 },
          { name: '维修工', proficiency: 4 },
          { name: '管道疏通', proficiency: 3 }
        ]
      },
      {
        name: '郑阿姨',
        phone: '13800138010',
        age: 45,
        gender: 'female',
        address: '深圳市盐田区',
        rating: 4.7,
        experience_years: 16,
        status: 'online',
        skills: [
          { name: '月嫂', proficiency: 5 },
          { name: '育儿嫂', proficiency: 5 },
          { name: '护工', proficiency: 4 }
        ]
      }
    ];
    
    // 首先获取技能ID映射
    const skillsQuery = 'SELECT id, name FROM skills';
    const skillsResult = await db.query(skillsQuery);
    const skillMap = {};
    skillsResult.rows.forEach(skill => {
      skillMap[skill.name] = skill.id;
    });
    
    console.log(`📦 找到 ${Object.keys(skillMap).length} 个技能\n`);
    
    let successCount = 0;
    
    for (const worker of workers) {
      try {
        // 插入工人基本信息
        const insertWorkerQuery = `
          INSERT INTO workers (
            name, phone, age, gender, address, 
            rating, experience_years, status,
            total_jobs, completed_jobs
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id
        `;
        
        const totalJobs = Math.floor(Math.random() * 50) + 10;
        const completedJobs = Math.floor(totalJobs * (0.8 + Math.random() * 0.2));
        
        const workerResult = await db.query(insertWorkerQuery, [
          worker.name,
          worker.phone,
          worker.age,
          worker.gender,
          worker.address,
          worker.rating,
          worker.experience_years,
          worker.status,
          totalJobs,
          completedJobs
        ]);
        
        const workerId = workerResult.rows[0].id;
        
        // 插入工人技能
        for (const skill of worker.skills) {
          const skillId = skillMap[skill.name];
          if (skillId) {
            const insertSkillQuery = `
              INSERT INTO worker_skills (worker_id, skill_id, proficiency_level, years_experience)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (worker_id, skill_id) DO NOTHING
            `;
            
            await db.query(insertSkillQuery, [
              workerId,
              skillId,
              skill.proficiency,
              Math.floor(worker.experience_years * (skill.proficiency / 5))
            ]);
          }
        }
        
        console.log(`✅ 添加工人: ${worker.name} (${worker.phone})`);
        console.log(`   技能: ${worker.skills.map(s => s.name).join(', ')}`);
        console.log(`   状态: ${worker.status === 'online' ? '🟢 在线' : worker.status === 'busy' ? '🟡 忙碌' : '⚫ 离线'}\n`);
        
        successCount++;
      } catch (error) {
        if (error.message.includes('duplicate key')) {
          console.log(`⚠️  工人 ${worker.name} (${worker.phone}) 已存在，跳过\n`);
        } else {
          console.error(`❌ 添加工人 ${worker.name} 失败:`, error.message, '\n');
        }
      }
    }
    
    console.log('═══════════════════════════════════════════');
    console.log(`\n✅ 成功添加 ${successCount} 个工人`);
    
    // 显示统计
    const countResult = await db.query('SELECT COUNT(*) FROM workers');
    console.log(`📊 数据库中现有工人总数: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ 添加工人数据失败:', error);
  } finally {
    process.exit();
  }
}

seedWorkers();