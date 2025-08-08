require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const db = require('../config/database');

async function generateMapping() {
  try {
    await db.testConnection();
    
    const result = await db.query('SELECT id, name FROM skills ORDER BY name');
    
    console.log('// Skill ID mapping for backend');
    console.log('const skillIdMapping = {');
    
    // Map frontend IDs to database IDs
    const mapping = {
      // Construction skills
      'plumbingInstall': '管道安装',
      'electrician': '电工',
      'carpentry': '木工',
      'painting': '刷漆',
      'tiling': '贴砖',
      'masonry': '泥瓦工',
      'waterproofing': '防水',
      'plumber': '水管工',
      'welding': '焊工',
      'rebarWorker': '钢筋工',
      'concreteWorker': '混凝土工',
      'scaffoldWorker': '架子工',
      'ceilingInstall': '吊顶安装',
      'glassInstall': '玻璃安装',
      'locksmith': '锁匠',
      'applianceRepair': '家电维修',
      'surveyor': '测量员',
      
      // Food & Beverage skills
      'barista': '咖啡师',
      'waiter': '服务员',
      'cashier': '收银员',
      'chef': '厨师',
      'kitchenHelper': '厨房助手',
      'dishwasher': '洗碗工',
      'bbqChef': '烧烤师',
      'foodRunner': '传菜员',
      
      // Service skills
      'cleaner': '清洁工',
      
      // Manufacturing skills
      'operator': '操作员',
      'qualityInspector': '质检员',
      'packagingWorker': '包装工',
      'assemblyWorker': '装配工',
      'solderer': '焊接工',
      'machineOperator': '机器操作员',
      'sewingWorker': '缝纫工',
      'cuttingWorker': '裁剪工',
      'ironingWorker': '熨烫工',
      'foodProcessor': '食品加工工',
      'latheMachinist': '车床工',
      'assembler': '装配员',
      'materialHandler': '物料员',
      'printer': '印刷工',
      'bookbinder': '装订工',
      
      // Logistics skills
      'deliveryWorker': '送货员',
      'loader': '装卸工',
      'sorter': '分拣员',
      'driver': '司机',
      'courier': '快递员',
      'stocker': '理货员',
      'forkliftOperator': '叉车工',
      'warehouseKeeper': '仓库管理员',
      
      // General skills
      'securityGuard': '保安',
      'gardener': '园艺工',
      'housekeeper': '家政服务'
    };
    
    for (const [frontendId, skillName] of Object.entries(mapping)) {
      const skill = result.rows.find(r => r.name === skillName);
      if (skill) {
        console.log(`  '${frontendId}': ${skill.id}, // ${skillName}`);
      }
    }
    
    console.log('};');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

generateMapping();