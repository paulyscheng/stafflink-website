const db = require('../config/database');
const logger = require('../utils/logger');

class SkillService {
  // 缓存技能数据，避免频繁查询数据库
  static skillCache = null;
  static cacheExpiry = null;
  static CACHE_DURATION = 3600000; // 1小时

  /**
   * 获取所有技能，带缓存
   */
  static async getAllSkills() {
    const now = Date.now();
    if (this.skillCache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.skillCache;
    }

    try {
      const result = await db.query('SELECT id, name, category, icon FROM skills ORDER BY category, name');
      this.skillCache = result.rows;
      this.cacheExpiry = now + this.CACHE_DURATION;
      return this.skillCache;
    } catch (error) {
      logger.error('Failed to get skills:', error);
      throw error;
    }
  }

  /**
   * 根据名称获取技能ID
   */
  static async getSkillIdByName(name) {
    const skills = await this.getAllSkills();
    const skill = skills.find(s => s.name === name);
    return skill ? skill.id : null;
  }

  /**
   * 根据多个名称获取技能ID映射
   */
  static async getSkillIdsByNames(names) {
    const skills = await this.getAllSkills();
    const mapping = {};
    
    names.forEach(name => {
      const skill = skills.find(s => s.name === name);
      if (skill) {
        mapping[name] = skill.id;
      }
    });
    
    return mapping;
  }

  /**
   * 根据前端技能键获取数据库技能ID
   * 这是一个更智能的映射方法
   */
  static async mapFrontendSkillToId(frontendKey) {
    // 前端键到技能名称的映射
    const keyToNameMapping = {
      // 建筑装修类
      'electrician': '电工',
      'carpenter': '木工',
      'plumber': '水管工',
      'painter': '油漆工',
      'mason': '泥瓦工',
      'welder': '焊工',
      'tiling': '瓷砖铺贴',
      'waterproofing': '防水工',
      'painting': '油漆工',
      'plumbingInstall': '管道疏通',
      'scaffoldWorker': '架子工',
      'rebarWorker': '钢筋工',
      'tile': '瓷砖铺贴',  // Alternative mapping
      
      // 餐饮服务类
      'chef': '厨师',
      'waiter': '服务员',
      'cashier': '收银员',
      'dishwasher': '洗碗工',
      'barista': '咖啡师',
      'bbqChef': '烧烤师',
      'foodRunner': '传菜员',
      'kitchenHelper': '帮厨',
      
      // 通用服务类
      'cleaner': '保洁员',
      'securityGuard': '保安员',
      'housekeeper': '家政服务',
      'gardener': '绿化工',
      'janitor': '保洁员',
      
      // 制造业类
      'generalWorker': '普工',
      'operator': '操作工',
      'packagingWorker': '包装工',
      'qualityInspector': '质检员',
      'assemblyWorker': '组装工',
      
      // 物流运输类
      'driver': '货车司机',
      'loader': '装卸工',
      'mover': '搬运工',
      'courier': '快递员',
      'forkliftOperator': '叉车司机',
      'deliveryWorker': '配送员',
      'warehouseWorker': '仓管员',
      'sorter': '分拣员'
    };

    const skillName = keyToNameMapping[frontendKey];
    if (!skillName) {
      logger.warn(`Unknown frontend skill key: ${frontendKey}`);
      return null;
    }

    return await this.getSkillIdByName(skillName);
  }

  /**
   * 批量映射前端技能键到数据库ID
   */
  static async mapFrontendSkillsToIds(frontendKeys) {
    const mappingPromises = frontendKeys.map(key => 
      this.mapFrontendSkillToId(key).then(id => ({ key, id }))
    );
    
    const results = await Promise.all(mappingPromises);
    const mapping = {};
    
    results.forEach(({ key, id }) => {
      if (id !== null) {
        mapping[key] = id;
      }
    });
    
    return mapping;
  }

  /**
   * 清除缓存
   */
  static clearCache() {
    this.skillCache = null;
    this.cacheExpiry = null;
  }
}

module.exports = SkillService;