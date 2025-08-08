const db = require('../config/database');
const logger = require('../utils/logger');

// 获取所有工人列表（企业端使用）
const getAllWorkers = async (req, res, next) => {
  try {
    const { status, skills } = req.query;
    
    let query = `
      SELECT 
        w.id,
        w.name,
        w.phone,
        w.age,
        w.gender,
        w.address,
        w.status,
        w.rating,
        w.experience_years,
        w.completed_jobs,
        w.total_jobs,
        w.created_at,
        w.updated_at
      FROM workers w
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 0;
    
    if (status) {
      paramCount++;
      query += ` AND w.status = $${paramCount}`;
      params.push(status);
    }
    
    query += ' ORDER BY w.rating DESC, w.completed_jobs DESC';
    
    const result = await db.query(query, params);
    
    // 获取所有工人的技能
    const workerIds = result.rows.map(w => w.id);
    let workerSkillsMap = {};
    
    if (workerIds.length > 0) {
      const skillsResult = await db.query(`
        SELECT 
          ws.worker_id,
          s.id as skill_id,
          s.name as skill_name,
          s.category,
          ws.proficiency_level
        FROM worker_skills ws
        JOIN skills s ON ws.skill_id = s.id
        WHERE ws.worker_id = ANY($1)
        ORDER BY ws.worker_id, s.name
      `, [workerIds]);
      
      // 组织技能数据
      skillsResult.rows.forEach(row => {
        if (!workerSkillsMap[row.worker_id]) {
          workerSkillsMap[row.worker_id] = [];
        }
        workerSkillsMap[row.worker_id].push({
          id: row.skill_id,
          name: row.skill_name,
          category: row.category,
          proficiency: row.proficiency_level
        });
      });
    }
    
    // 转换数据格式以匹配前端需求
    const workers = result.rows.map(worker => {
      const workerSkills = workerSkillsMap[worker.id] || [];
      return {
        id: worker.id,
        name: worker.name,
        phone: worker.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // 隐藏中间4位
        skills: workerSkills.map(s => s.name),
        skillDetails: workerSkills, // 包含完整技能信息
        rating: parseFloat(worker.rating) || 4.5,
        status: worker.status || 'offline',
        currentProject: null, // TODO: 从invitations表获取当前接受的项目
        avatar: worker.name ? worker.name[0] : '工',
        experience: worker.experience_years ? `${worker.experience_years}年` : '1年',
        completedProjects: worker.completed_jobs || 0,
        age: worker.age,
        gender: worker.gender,
        address: worker.address,
        totalJobs: worker.total_jobs || 0,
        experience_years: worker.experience_years,
        wageOffer: 80 + Math.floor(worker.experience_years * 5) // 根据经验计算时薪
      };
    });
    
    res.status(200).json({
      success: true,
      workers,
      total: workers.length
    });
    
  } catch (error) {
    logger.error('Get all workers error:', error);
    next(error);
  }
};

// 兼容旧的getWorkers函数名
const getWorkers = getAllWorkers;

// 获取可用工人（根据技能和状态筛选）
const getAvailableWorkers = async (req, res, next) => {
  try {
    const { skills, projectType } = req.query;
    
    let query = `
      SELECT 
        w.id,
        w.name,
        w.phone,
        w.status,
        w.rating,
        w.experience_years,
        w.completed_jobs,
        w.address
      FROM workers w
      WHERE w.status = 'online'
    `;
    
    const params = [];
    let paramCount = 0;
    
    // 添加技能筛选逻辑
    if (skills && skills.length > 0) {
      const skillList = skills.split(',');
      paramCount++;
      query = `
        SELECT DISTINCT
          w.id,
          w.name,
          w.phone,
          w.status,
          w.rating,
          w.experience_years,
          w.completed_jobs,
          w.address
        FROM workers w
        JOIN worker_skills ws ON w.id = ws.worker_id
        JOIN skills s ON ws.skill_id = s.id
        WHERE w.status = 'online'
        AND s.name = ANY($${paramCount})
      `;
      params.push(skillList);
    }
    
    query += ' ORDER BY w.rating DESC LIMIT 50';
    
    const result = await db.query(query, params);
    
    // 获取所有工人的技能
    const workerIds = result.rows.map(w => w.id);
    let workerSkillsMap = {};
    
    if (workerIds.length > 0) {
      const skillsResult = await db.query(`
        SELECT 
          ws.worker_id,
          s.id as skill_id,
          s.name as skill_name,
          s.category,
          ws.proficiency_level
        FROM worker_skills ws
        JOIN skills s ON ws.skill_id = s.id
        WHERE ws.worker_id = ANY($1)
        ORDER BY ws.worker_id, s.name
      `, [workerIds]);
      
      // 组织技能数据
      skillsResult.rows.forEach(row => {
        if (!workerSkillsMap[row.worker_id]) {
          workerSkillsMap[row.worker_id] = [];
        }
        workerSkillsMap[row.worker_id].push({
          id: row.skill_id,
          name: row.skill_name,
          category: row.category,
          proficiency: row.proficiency_level
        });
      });
    }
    
    const workers = result.rows.map(worker => {
      const workerSkills = workerSkillsMap[worker.id] || [];
      return {
        id: worker.id,
        name: worker.name,
        phone: worker.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
        skills: workerSkills.map(s => s.name),
        skillDetails: workerSkills,
        rating: parseFloat(worker.rating) || 4.5,
        status: worker.status,
        experience: worker.experience_years ? `${worker.experience_years}年` : '1年',
        completedProjects: worker.completed_jobs || 0,
        avatar: worker.name ? worker.name[0] : '工',
        canInvite: true,
        experience_years: worker.experience_years,
        wageOffer: 80 + Math.floor(worker.experience_years * 5)
      };
    });
    
    res.status(200).json({
      success: true,
      workers,
      total: workers.length
    });
    
  } catch (error) {
    logger.error('Get available workers error:', error);
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Update profile - coming soon' });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Update status - coming soon' });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getWorkers, 
  getAllWorkers,
  getAvailableWorkers,
  getProfile, 
  updateProfile, 
  updateStatus 
};