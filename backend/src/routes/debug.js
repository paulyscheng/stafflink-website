const express = require('express');
const router = express.Router();
const db = require('../config/database');
const logger = require('../utils/logger');

// Debug route to check skills data
router.get('/skills-debug', async (req, res) => {
  try {
    // Get all skills
    const skillsResult = await db.query('SELECT * FROM skills ORDER BY id');
    
    // Get recent project skills
    const projectSkillsResult = await db.query(`
      SELECT 
        ps.project_id,
        p.project_name,
        ps.skill_id,
        s.name as skill_name
      FROM project_skills ps
      JOIN projects p ON ps.project_id = p.id
      LEFT JOIN skills s ON ps.skill_id = s.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      data: {
        totalSkills: skillsResult.rows.length,
        skills: skillsResult.rows,
        recentProjectSkills: projectSkillsResult.rows
      }
    });
  } catch (error) {
    logger.error('Debug skills error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Debug route to manually insert skills
router.post('/insert-skills', async (req, res) => {
  try {
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
    
    const results = [];
    const skipped = [];
    
    for (const skill of skills) {
      try {
        // First check if skill exists
        const existingResult = await db.query(
          'SELECT id, name FROM skills WHERE name = $1',
          [skill.name]
        );
        
        if (existingResult.rows.length > 0) {
          skipped.push(existingResult.rows[0]);
        } else {
          const result = await db.query(
            'INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING *',
            [skill.name, skill.category]
          );
          results.push(result.rows[0]);
        }
      } catch (err) {
        logger.warn(`Skill insert warning for ${skill.name}:`, err.message);
      }
    }
    
    // Get all skills with their IDs
    const allSkillsResult = await db.query('SELECT id, name, category FROM skills ORDER BY category, id');
    
    res.json({
      success: true,
      data: {
        insertedCount: results.length,
        skippedCount: skipped.length,
        totalSkills: allSkillsResult.rows.length,
        insertedSkills: results,
        skippedSkills: skipped,
        allSkills: allSkillsResult.rows
      }
    });
  } catch (error) {
    logger.error('Insert skills error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute SQL file route
router.post('/execute-sql', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, '../../insert-skills.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    const results = [];
    for (const statement of statements) {
      if (statement.toLowerCase().startsWith('insert')) {
        try {
          const result = await db.query(statement + ';');
          results.push({ statement: statement.substring(0, 50) + '...', rowCount: result.rowCount });
        } catch (err) {
          results.push({ statement: statement.substring(0, 50) + '...', error: err.message });
        }
      }
    }
    
    // Get final skills count
    const skillsResult = await db.query('SELECT id, name, category FROM skills ORDER BY category, id');
    
    res.json({
      success: true,
      data: {
        executionResults: results,
        totalSkills: skillsResult.rows.length,
        skills: skillsResult.rows
      }
    });
  } catch (error) {
    logger.error('Execute SQL error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test project creation with skills
router.post('/test-project-with-skills', async (req, res) => {
  try {
    // Create a test project
    const projectData = {
      company_id: 1, // Test company ID
      project_name: 'Test Project with Skills',
      project_type: 'home_renovation',
      project_address: 'Test Address',
      required_workers: 3,
      work_description: 'Test project to verify skill saving',
      experience_level: 'intermediate',
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
      start_time: '09:00',
      end_time: '17:00',
      payment_type: 'hourly',
      budget_range: '150-200',
      status: 'draft',
      urgency: false
    };
    
    const insertQuery = `
      INSERT INTO projects (
        company_id, project_name, project_type, project_address, 
        required_workers, work_description, experience_level,
        start_date, end_date, start_time, end_time,
        payment_type, budget_range, status, urgency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    
    const values = Object.values(projectData);
    const projectResult = await db.query(insertQuery, values);
    const project = projectResult.rows[0];
    
    // Add skills
    const testSkills = [
      { skill_id: 'plumbingInstall', required_level: 2, is_mandatory: true },
      { skill_id: 'electrician', required_level: 2, is_mandatory: true },
      { skill_id: 'carpentry', required_level: 1, is_mandatory: false }
    ];
    
    const skillIdMapping = {
      'plumbingInstall': 75,
      'electrician': 79,
      'carpentry': 76
    };
    
    const skillResults = [];
    for (const skill of testSkills) {
      const skillId = skillIdMapping[skill.skill_id];
      if (skillId) {
        const skillInsert = await db.query(
          `INSERT INTO project_skills (project_id, skill_id, required_level, is_mandatory)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [project.id, skillId, skill.required_level, skill.is_mandatory]
        );
        skillResults.push(skillInsert.rows[0]);
      }
    }
    
    // Get the complete project with skills
    const projectSkills = await db.query(`
      SELECT ps.*, s.name as skill_name
      FROM project_skills ps
      JOIN skills s ON ps.skill_id = s.id
      WHERE ps.project_id = $1
    `, [project.id]);
    
    res.json({
      success: true,
      data: {
        project: project,
        skills: projectSkills.rows,
        message: `Created project ${project.id} with ${skillResults.length} skills`
      }
    });
    
  } catch (error) {
    logger.error('Test project creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;