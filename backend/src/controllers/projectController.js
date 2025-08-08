const db = require('../config/database');
const logger = require('../utils/logger');

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

    // Create project
    const query = `
      INSERT INTO projects (
        company_id, project_name, project_address, project_type, priority,
        required_workers, work_description, experience_level, time_nature,
        start_date, end_date, start_time, end_time, working_days, time_notes,
        payment_type, budget_range, estimated_duration, selected_workers,
        notification_methods, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const values = [
      req.user.id, project_name, project_address, project_type, priority,
      required_workers, work_description, experience_level, time_nature,
      start_date, end_date, start_time, end_time, 
      working_days ? JSON.stringify(working_days) : null,
      time_notes, payment_type, budget_range, estimated_duration,
      JSON.stringify(selected_workers), JSON.stringify(notification_methods),
      'draft'
    ];

    const result = await db.query(query, values);
    const project = result.rows[0];

    // Add project skills if provided
    logger.info(`Attempting to add ${skills ? skills.length : 0} skills to project ${project.id}`);
    if (skills && skills.length > 0) {
      // Skill ID mapping - maps frontend IDs directly to database skill IDs
      const skillIdMapping = {
        'plumbingInstall': 75, // 管道安装
        'electrician': 79, // 电工
        'carpentry': 76, // 木工
        'painting': 77, // 刷漆
        'tiling': 78, // 贴砖
        'masonry': 89, // 泥瓦工
        'waterproofing': 90, // 防水
        'plumber': 93, // 水管工
        'welding': 80, // 焊工
        'rebarWorker': 96, // 钢筋工
        'concreteWorker': 97, // 混凝土工
        'scaffoldWorker': 98, // 架子工
        'ceilingInstall': 91, // 吊顶安装
        'glassInstall': 92, // 玻璃安装
        'locksmith': 94, // 锁匠
        'applianceRepair': 95, // 家电维修
        'surveyor': 99, // 测量员
        'barista': 100, // 咖啡师
        'waiter': 101, // 服务员
        'cashier': 102, // 收银员
        'chef': 103, // 厨师
        'kitchenHelper': 104, // 厨房助手
        'dishwasher': 105, // 洗碗工
        'bbqChef': 106, // 烧烤师
        'foodRunner': 107, // 传菜员
        'cleaner': 81, // 清洁工
        'operator': 82, // 操作员
        'qualityInspector': 111, // 质检员
        'packagingWorker': 112, // 包装工
        'assemblyWorker': 109, // 装配工
        'solderer': 110, // 焊接工
        'machineOperator': 113, // 机器操作员
        'sewingWorker': 114, // 缝纫工
        'cuttingWorker': 115, // 裁剪工
        'ironingWorker': 116, // 熨烫工
        'foodProcessor': 117, // 食品加工工
        'latheMachinist': 118, // 车床工
        'assembler': 119, // 装配员
        'materialHandler': 120, // 物料员
        'printer': 121, // 印刷工
        'bookbinder': 122, // 装订工
        'deliveryWorker': 123, // 送货员
        'loader': 124, // 装卸工
        'sorter': 125, // 分拣员
        'driver': 126, // 司机
        'courier': 127, // 快递员
        'stocker': 128, // 理货员
        'forkliftOperator': 129, // 叉车工
        'warehouseKeeper': 130, // 仓库管理员
        'securityGuard': 132, // 保安
        'gardener': 133, // 园艺工
        'housekeeper': 134 // 家政服务
      };
      
      // Insert project skills using direct ID mapping
      const skillPromises = skills.map(skill => {
        const skillId = skillIdMapping[skill.skill_id];
        
        if (!skillId) {
          logger.warn(`Unknown skill ID from frontend: ${skill.skill_id}`);
          return Promise.resolve(); // Skip unknown skills
        }
        
        logger.info(`Inserting skill ID ${skillId} for project ${project.id}`);
        
        const insertQuery = `
          INSERT INTO project_skills (project_id, skill_id, required_level, is_mandatory)
          VALUES ($1, $2, $3, $4)
        `;
        return db.query(insertQuery, [
          project.id, 
          skillId, // Use the direct ID mapping
          skill.required_level || 1, 
          skill.is_mandatory !== false
        ]);
      });
      
      const results = await Promise.all(skillPromises.filter(p => p)); // Filter out undefined promises
      logger.info(`Successfully inserted ${results.length} skills for project ${project.id}`);
    }

    // 如果有选择的工人，自动创建邀请
    if (selected_workers && selected_workers.length > 0) {
      try {
        const invitationPromises = selected_workers.map(worker_id => {
          const invitationQuery = `
            INSERT INTO invitations (project_id, company_id, worker_id, wage_offer, wage_type, message)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (project_id, worker_id) DO NOTHING
            RETURNING *
          `;
          
          // 根据payment_type决定wage_type
          let wage_type = 'fixed';
          if (payment_type === 'hourly') wage_type = 'hourly';
          else if (payment_type === 'daily') wage_type = 'daily';
          
          return db.query(invitationQuery, [
            project.id,
            req.user.id,
            worker_id,
            parseFloat(budget_range.split('-')[0]) || null, // 使用预算范围的最小值作为工资offer
            wage_type,
            `您被邀请参与项目：${project_name}`
          ]);
        });
        
        const invitationResults = await Promise.all(invitationPromises);
        const createdInvitations = invitationResults.filter(r => r.rows.length > 0).length;
        logger.info(`Created ${createdInvitations} invitations for project ${project.id}`);
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
        id, project_name, project_address, project_type, priority,
        required_workers, work_description, experience_level,
        start_date, end_date, start_time, end_time,
        payment_type, budget_range, status, urgency,
        created_at, updated_at
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
      FROM job_invitations
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