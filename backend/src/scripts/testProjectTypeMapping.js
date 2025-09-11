// 测试项目类型映射一致性

const industryProjectTypeMapping = {
  // 建筑装修业
  construction: [
    { id: 'home_renovation', name: '家装', code: '家装' },
    { id: 'office_decoration', name: '工装', code: '工装' },
    { id: 'outdoor_construction', name: '户外施工', code: '户外' },
    { id: 'installation_maintenance', name: '安装维修', code: '维修' },
    { id: 'waterproof_insulation', name: '防水保温', code: '防水' },
    { id: 'demolition', name: '拆除清理', code: '拆除' }
  ],
  
  // 餐饮服务业
  foodservice: [
    { id: 'chef', name: '厨师', code: '厨师' },
    { id: 'service_staff', name: '服务员', code: '服务' },
    { id: 'kitchen_helper', name: '后厨帮工', code: '帮厨' },
    { id: 'delivery', name: '配送员', code: '配送' },
    { id: 'dishwasher', name: '洗碗工', code: '洗碗' },
    { id: 'food_prep', name: '备菜员', code: '备菜' }
  ],
  
  // 制造业
  manufacturing: [
    { id: 'assembly_line', name: '流水线工人', code: '流水' },
    { id: 'quality_inspection', name: '质检员', code: '质检' },
    { id: 'packaging', name: '包装工', code: '包装' },
    { id: 'machine_operator', name: '机器操作员', code: '机操' },
    { id: 'warehouse_keeper', name: '仓库管理员', code: '仓管' },
    { id: 'forklift_driver', name: '叉车司机', code: '叉车' }
  ],
  
  // 物流仓储
  logistics: [
    { id: 'loader', name: '装卸工', code: '装卸' },
    { id: 'sorter', name: '分拣员', code: '分拣' },
    { id: 'packer', name: '打包员', code: '打包' },
    { id: 'courier', name: '快递员', code: '快递' },
    { id: 'driver', name: '司机', code: '司机' },
    { id: 'inventory_clerk', name: '库存管理员', code: '库管' }
  ],
  
  // 其他服务
  other: [
    { id: 'cleaner', name: '保洁员', code: '保洁' },
    { id: 'security', name: '保安', code: '保安' },
    { id: 'gardener', name: '园艺工', code: '园艺' },
    { id: 'mover', name: '搬运工', code: '搬运' },
    { id: 'general_labor', name: '普工', code: '普工' },
    { id: 'other', name: '其他', code: '其他' }
  ]
};

const projectSkillsMapping = {
  // 建筑装修业
  'home_renovation': ['plumbingInstall', 'carpentry', 'painting', 'tiling', 'masonry', 'waterproofing'],
  'office_decoration': ['electrician', 'carpentry', 'painting', 'tiling', 'ceilingInstall', 'glassInstall'],
  'outdoor_construction': ['rebarWorker', 'concreteWorker', 'welding', 'scaffoldWorker', 'surveyor', 'masonry'],
  'installation_maintenance': ['electrician', 'plumber', 'carpentry', 'locksmith', 'applianceRepair'],
  'waterproof_insulation': ['waterproofing', 'masonry', 'plumber', 'tiling'],
  'demolition': ['demolitionWorker', 'loader', 'cleaner', 'materialHandler'],
  
  // 餐饮服务业
  'chef': ['chef', 'kitchenHelper', 'foodProcessor'],
  'service_staff': ['waiter', 'foodRunner', 'cashier'],
  'kitchen_helper': ['kitchenHelper', 'dishwasher', 'cleaner'],
  'delivery': ['deliveryWorker', 'driver', 'packer'],
  'dishwasher': ['dishwasher', 'cleaner'],
  'food_prep': ['foodProcessor', 'kitchenHelper', 'cuttingWorker'],
  
  // 制造业
  'assembly_line': ['assemblyWorker', 'assembler', 'qualityInspector', 'packagingWorker'],
  'quality_inspection': ['qualityInspector', 'materialHandler', 'packagingWorker'],
  'packaging': ['packagingWorker', 'packer', 'qualityInspector'],
  'machine_operator': ['machineOperator', 'assemblyWorker', 'qualityInspector'],
  'warehouse_keeper': ['warehouseKeeper', 'stocker', 'forkliftOperator'],
  'forklift_driver': ['forkliftOperator', 'loader', 'warehouseKeeper'],
  
  // 物流仓储
  'loader': ['loader', 'mover', 'materialHandler'],
  'sorter': ['sorter', 'packer', 'qualityInspector'],
  'packer': ['packer', 'packagingWorker', 'sorter'],
  'courier': ['courier', 'deliveryWorker', 'driver'],
  'driver': ['driver', 'courier', 'deliveryWorker'],
  'inventory_clerk': ['warehouseKeeper', 'stocker', 'qualityInspector'],
  
  // 其他服务
  'cleaner': ['cleaner', 'janitor', 'windowCleaner', 'carpetCleaner'],
  'security': ['securityGuard', 'doorman', 'patrolOfficer', 'monitorOperator'],
  'gardener': ['gardener', 'treeTrimmer', 'irrigationWorker', 'planter'],
  'mover': ['mover', 'loader', 'packer', 'furnitureAssembler'],
  'general_labor': ['tempWorker', 'materialHandler', 'loader', 'cleaner'],
  'other': ['tempWorker', 'materialHandler', 'cleaner'],
};

console.log('🔍 检查项目类型映射一致性...\n');

let allProjectTypeIds = [];
let missingInSkillsMapping = [];
let successCount = 0;

// 收集所有项目类型ID
for (const industry in industryProjectTypeMapping) {
  industryProjectTypeMapping[industry].forEach(type => {
    allProjectTypeIds.push(type.id);
  });
}

console.log(`📊 总共有 ${allProjectTypeIds.length} 个项目类型\n`);

// 检查每个项目类型是否在技能映射中存在
allProjectTypeIds.forEach(typeId => {
  if (projectSkillsMapping[typeId]) {
    successCount++;
    console.log(`✅ ${typeId}: 映射存在，包含 ${projectSkillsMapping[typeId].length} 个技能`);
  } else {
    missingInSkillsMapping.push(typeId);
    console.log(`❌ ${typeId}: 映射缺失！`);
  }
});

console.log('\n📈 统计结果:');
console.log(`- 成功映射: ${successCount}/${allProjectTypeIds.length} (${Math.round(successCount/allProjectTypeIds.length*100)}%)`);
console.log(`- 缺失映射: ${missingInSkillsMapping.length}/${allProjectTypeIds.length} (${Math.round(missingInSkillsMapping.length/allProjectTypeIds.length*100)}%)`);

if (missingInSkillsMapping.length > 0) {
  console.log('\n⚠️  缺失的映射:');
  missingInSkillsMapping.forEach(id => {
    console.log(`- ${id}`);
  });
}

// 检查反向 - 技能映射中是否有不存在的项目类型
console.log('\n🔄 反向检查...');
const extraInSkillsMapping = [];
for (const typeId in projectSkillsMapping) {
  if (!allProjectTypeIds.includes(typeId)) {
    extraInSkillsMapping.push(typeId);
    console.log(`⚠️  ${typeId}: 存在于技能映射但不在项目类型定义中`);
  }
}

if (extraInSkillsMapping.length === 0) {
  console.log('✅ 没有发现多余的映射');
}

console.log('\n✨ 测试完成！');