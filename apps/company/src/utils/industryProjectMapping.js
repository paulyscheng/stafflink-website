// 行业与项目类型映射关系
export const industryProjectTypeMapping = {
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

// 获取特定行业的项目类型
export const getProjectTypesForIndustry = (industry) => {
  return industryProjectTypeMapping[industry] || industryProjectTypeMapping.other;
};

// 获取所有项目类型（用于没有选择行业时）
export const getAllProjectTypes = () => {
  const allTypes = [];
  Object.values(industryProjectTypeMapping).forEach(types => {
    allTypes.push(...types);
  });
  // 去重
  const uniqueTypes = Array.from(new Map(allTypes.map(item => [item.id, item])).values());
  return uniqueTypes;
};