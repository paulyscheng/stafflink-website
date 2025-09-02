const db = require('../config/database');
const logger = require('../utils/logger');
const SkillService = require('../services/skillService');

const createProject = async (req, res, next) => {
  try {
    const {
      project_name,
      project_address,
      project_type,
      priority = 'normal',
      required_workers,
      work_description,
      experience_level = 'intermediate',
      time_nature = 'onetime',
      start_date,
      end_date,
      start_time,
      end_time,
      working_days,
      time_notes,
      payment_type,
      budget_range,
      estimated_duration,
      selected_workers = [],
      notification_methods = ['SMS'],
      skills = []
    } = req.body;

    // Validate required fields
    if (!project_name || !project_address || !project_type || !required_workers || 
        !start_date || !end_date || !start_time || !end_time || !payment_type || !budget_range) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Parse original wage from budget_range
    const originalWage = parseFloat(budget_range) || 0;
    
    // Determine wage unit based on payment type
    let wageUnit = 'day';
    if (payment_type === 'hourly') wageUnit = 'hour';
    else if (payment_type === 'fixed') wageUnit = 'total';
    
    // Calculate daily wage based on payment type
    let dailyWage = 0;
    if (payment_type === 'daily') {
      dailyWage = originalWage;
    } else if (payment_type === 'hourly') {
      // Assume 8 hours per day for hourly rate
      dailyWage = originalWage * 8;
    } else if (payment_type === 'fixed') {
      // For fixed payment, calculate daily rate based on duration
      const days = estimated_duration || 1;
      dailyWage = originalWage / days;
    }

    // Create project
    const query = `
      INSERT INTO projects (
        company_id, project_name, project_address, project_type, priority,
        required_workers, work_description, experience_level, time_nature,
        start_date, end_date, start_time, end_time, working_days, time_notes,
        payment_type, budget_range, estimated_duration, selected_workers,
        notification_methods, status, daily_wage, original_wage, wage_unit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `;

    const values = [
      req.user.id, project_name, project_address, project_type, priority,
      required_workers, work_description, experience_level, time_nature,
      start_date, end_date, start_time, end_time, 
      working_days ? JSON.stringify(working_days) : null,
      time_notes, payment_type, budget_range, estimated_duration,
      JSON.stringify(selected_workers), JSON.stringify(notification_methods),
      'draft', dailyWage, originalWage, wageUnit
    ];

    const result = await db.query(query, values);
    const project = result.rows[0];

    // Add project skills if provided
    logger.info(`Attempting to add ${skills ? skills.length : 0} skills to project ${project.id}`);
    if (skills && skills.length > 0) {
      try {
        // Get skill IDs dynamically from database
        const frontendKeys = skills.map(s => s.skill_id);
        const skillMapping = await SkillService.mapFrontendSkillsToIds(frontendKeys);
        
        const skillPromises = skills.map(async skill => {
          const skillId = skillMapping[skill.skill_id];
          
          if (!skillId) {
            // Try to find skill by name if mapping fails
            const alternativeId = await SkillService.mapFrontendSkillToId(skill.skill_id);
            if (!alternativeId) {
              logger.warn(`Unknown skill: ${skill.skill_id}`);
              return null;
            }
            skillId = alternativeId;
          }
          
          logger.info(`Inserting skill ID ${skillId} for project ${project.id}`);
          
          const insertQuery = `
            INSERT INTO project_skills (project_id, skill_id, required_level, is_mandatory)
            VALUES ($1, $2, $3, $4)
          `;
          
          return db.query(insertQuery, [
            project.id,
            skillId,
            skill.required_level || 1,
            skill.is_mandatory !== false
          ]);
        });
        
        const results = await Promise.all(skillPromises.filter(p => p));
        logger.info(`Successfully inserted ${results.length} skills for project ${project.id}`);
      } catch (skillError) {
        logger.error('Error adding project skills:', skillError);
        // Don't fail the entire project creation if skills fail
      }
    }

    // 如果有选择的工人，自动创建邀请
    if (selected_workers && selected_workers.length > 0) {
      try {
        // Filter out invalid worker IDs and ensure they are valid UUIDs
        const validWorkerIds = selected_workers.filter(worker_id => {
          // Check if it's a valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (typeof worker_id === 'string' && uuidRegex.test(worker_id)) {
            return true;
          }
          logger.warn(`Invalid worker ID format: ${worker_id} (expected UUID)`);
          return false;
        });

        if (validWorkerIds.length === 0) {
          logger.warn('No valid worker IDs provided for invitations');
        } else {
          const invitationPromises = validWorkerIds.map(worker_id => {
            const invitationQuery = `
              INSERT INTO invitations (
                project_id, company_id, worker_id, 
                wage_amount, original_wage, wage_unit,
                status, start_date, end_date
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              ON CONFLICT (project_id, worker_id) DO NOTHING
              RETURNING *
            `;
            
            // 同时保存原始薪资和计算后的日薪
            return db.query(invitationQuery, [
              project.id,
              req.user.id,
              worker_id,
              dailyWage,
              originalWage,
              wageUnit,
              'pending',
              start_date,
              end_date
            ]);
          });
          
          const invitationResults = await Promise.all(invitationPromises);
          const createdInvitations = invitationResults.filter(r => r.rows.length > 0).length;
          logger.info(`Created ${createdInvitations} invitations for project ${project.id}`);
        }
      } catch (invitationError) {
        logger.error('Error creating invitations:', invitationError);
        // 不阻塞项目创建，继续返回成功
      }
    }

    logger.info(`Project created: ${project.id}`, { 
      company_id: req.user.id, 
      project_name 
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: {
          ...project,
          working_days: project.working_days || null,
          selected_workers: project.selected_workers || [],
          notification_methods: project.notification_methods || []
        }
      }
    });

  } catch (error) {
    logger.error('Create project error:', error);
    next(error);
  }
};

const getCompanyProjects = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Build query conditions
    let whereConditions = ['company_id = $1'];
    let queryParams = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereConditions.push(`status = $${paramCount}`);
      queryParams.push(status);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(project_name ILIKE $${paramCount} OR project_address ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get projects with pagination
    const projectsQuery = `
      SELECT 
        id, 
        title as project_name, 
        location as project_address, 
        work_type as project_type, 
        urgency_level as priority,
        required_workers, 
        description as work_description, 
        'intermediate' as experience_level,
        start_date, 
        end_date, 
        work_hours as start_time, 
        work_hours as end_time,
        'daily' as payment_type, 
        daily_wage::text as budget_range, 
        status, 
        urgency_level as urgency,
        created_at, 
        updated_at
      FROM projects 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const projectsResult = await db.query(projectsQuery, queryParams);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM projects WHERE ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));
    const totalProjects = parseInt(countResult.rows[0].count);

    // Calculate pagination info
    const totalPages = Math.ceil(totalProjects / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    logger.info(`Retrieved ${projectsResult.rows.length} projects for company ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: {
        projects: projectsResult.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProjects,
          hasNextPage,
          hasPreviousPage,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    logger.error('Get company projects error:', error);
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get project details
    const projectQuery = `
      SELECT 
        p.*,
        c.company_name, c.contact_person, c.phone as company_phone
      FROM projects p
      JOIN companies c ON p.company_id = c.id
      WHERE p.id = $1
    `;

    const projectResult = await db.query(projectQuery, [id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const project = projectResult.rows[0];

    // Get project skills with actual skill names from skills table
    const skillsQuery = `
      SELECT 
        s.id, s.name, s.category, s.description,
        ps.required_level, ps.is_mandatory
      FROM project_skills ps
      JOIN skills s ON ps.skill_id = s.id
      WHERE ps.project_id = $1
    `;

    const skillsResult = await db.query(skillsQuery, [id]);
    
    // Log skills for debugging
    logger.info(`Retrieved ${skillsResult.rows.length} skills for project ${id}`);
    
    const skills = skillsResult.rows;

    // Get project invitations count
    const invitationsQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM invitations
      WHERE project_id = $1
      GROUP BY status
    `;

    const invitationsResult = await db.query(invitationsQuery, [id]);
    const invitationStats = {};
    invitationsResult.rows.forEach(row => {
      invitationStats[row.status] = parseInt(row.count);
    });

    logger.info(`Retrieved project details: ${id}`);

    res.status(200).json({
      success: true,
      data: {
        project: {
          ...project,
          working_days: project.working_days || null,
          selected_workers: project.selected_workers || [],
          notification_methods: project.notification_methods || []
        },
        skills: skills,
        invitationStats: {
          pending: invitationStats.pending || 0,
          accepted: invitationStats.accepted || 0,
          rejected: invitationStats.rejected || 0,
          expired: invitationStats.expired || 0
        }
      }
    });

  } catch (error) {
    logger.error('Get project error:', error);
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Update project - coming soon' });
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, message: 'Delete project - coming soon' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createProject, getCompanyProjects, getProject, updateProject, deleteProject };