const db = require('../config/database');
const logger = require('../utils/logger');

const getSkills = async (req, res, next) => {
  try {
    const query = `
      SELECT id, name, category, description 
      FROM skills 
      ORDER BY category, name
    `;
    
    const result = await db.query(query);
    
    res.status(200).json({ 
      success: true, 
      data: {
        skills: result.rows
      }
    });
  } catch (error) {
    logger.error('Get skills error:', error);
    next(error);
  }
};

const getSkillsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    
    const query = `
      SELECT id, name, category, description 
      FROM skills 
      WHERE category = $1
      ORDER BY name
    `;
    
    const result = await db.query(query, [category]);
    
    res.status(200).json({ 
      success: true, 
      data: {
        skills: result.rows
      }
    });
  } catch (error) {
    logger.error('Get skills by category error:', error);
    next(error);
  }
};

const getWorkerSkills = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Get worker skills - coming soon' });
  } catch (error) {
    next(error);
  }
};

const updateWorkerSkills = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Update worker skills - coming soon' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSkills, getSkillsByCategory, getWorkerSkills, updateWorkerSkills };