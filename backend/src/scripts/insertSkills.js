require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/database');
const logger = require('../utils/logger');

const skills = [
  // Construction & Renovation
  { name: '管道安装', category: 'construction' },
  { name: '电工', category: 'construction' },
  { name: '木工', category: 'construction' },
  { name: '刷漆', category: 'construction' },
  { name: '贴砖', category: 'construction' },
  { name: '焊工', category: 'construction' },
  { name: '泥瓦工', category: 'construction' },
  { name: '防水', category: 'construction' },
  { name: '吊顶安装', category: 'construction' },
  { name: '玻璃安装', category: 'construction' },
  { name: '水管工', category: 'construction' },
  { name: '锁匠', category: 'construction' },
  { name: '家电维修', category: 'construction' },
  { name: '钢筋工', category: 'construction' },
  { name: '混凝土工', category: 'construction' },
  { name: '架子工', category: 'construction' },
  { name: '测量员', category: 'construction' },
  
  // Food & Beverage
  { name: '咖啡师', category: 'food_beverage' },
  { name: '服务员', category: 'food_beverage' },
  { name: '收银员', category: 'food_beverage' },
  { name: '厨师', category: 'food_beverage' },
  { name: '厨房助手', category: 'food_beverage' },
  { name: '洗碗工', category: 'food_beverage' },
  { name: '烧烤师', category: 'food_beverage' },
  { name: '传菜员', category: 'food_beverage' },
  
  // Manufacturing
  { name: '操作员', category: 'manufacturing' },
  { name: '装配工', category: 'manufacturing' },
  { name: '焊接工', category: 'manufacturing' },
  { name: '质检员', category: 'manufacturing' },
  { name: '包装工', category: 'manufacturing' },
  { name: '机器操作员', category: 'manufacturing' },
  { name: '缝纫工', category: 'manufacturing' },
  { name: '裁剪工', category: 'manufacturing' },
  { name: '熨烫工', category: 'manufacturing' },
  { name: '食品加工工', category: 'manufacturing' },
  { name: '车床工', category: 'manufacturing' },
  { name: '装配员', category: 'manufacturing' },
  { name: '物料员', category: 'manufacturing' },
  { name: '印刷工', category: 'manufacturing' },
  { name: '装订工', category: 'manufacturing' },
  
  // Logistics
  { name: '送货员', category: 'logistics' },
  { name: '装卸工', category: 'logistics' },
  { name: '分拣员', category: 'logistics' },
  { name: '司机', category: 'logistics' },
  { name: '快递员', category: 'logistics' },
  { name: '理货员', category: 'logistics' },
  { name: '叉车工', category: 'logistics' },
  { name: '仓库管理员', category: 'logistics' },
  
  // General Services
  { name: '清洁工', category: 'general_services' },
  { name: '保安', category: 'general_services' },
  { name: '园艺工', category: 'general_services' },
  { name: '家政服务', category: 'general_services' }
];

async function insertSkills() {
  try {
    console.log('Connecting to database...');
    await db.testConnection();
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const skill of skills) {
      try {
        const result = await db.query(
          'INSERT INTO skills (name, category) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING RETURNING *',
          [skill.name, skill.category]
        );
        
        if (result.rows.length > 0) {
          console.log(`✅ Inserted: ${skill.name}`);
          insertedCount++;
        } else {
          console.log(`⏭️  Skipped (exists): ${skill.name}`);
          skippedCount++;
        }
      } catch (err) {
        console.error(`❌ Error inserting ${skill.name}:`, err.message);
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`✅ Inserted: ${insertedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📋 Total: ${skills.length}`);
    
    // Display all skills
    const allSkills = await db.query('SELECT id, name, category FROM skills ORDER BY category, name');
    console.log('\n📋 All skills in database:');
    console.table(allSkills.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

insertSkills();