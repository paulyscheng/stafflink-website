const db = require('../config/database');
const { validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');
const smsService = require('../services/smsService');
const voiceCallService = require('../services/voiceCallService');

// 创建邀请
const createInvitation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      project_id,
      worker_id,
      message,
      wage_amount,
      wage_unit,
      expires_at
    } = req.body;

    // 获取公司ID
    const company_id = req.user.id;

    // 检查项目是否属于该公司
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND company_id = $2',
      [project_id, company_id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: '无权操作此项目' });
    }

    // 检查是否已经邀请过该工人
    const existingInvitation = await db.query(
      'SELECT id, status FROM invitations WHERE project_id = $1 AND worker_id = $2',
      [project_id, worker_id]
    );

    if (existingInvitation.rows.length > 0) {
      const existing = existingInvitation.rows[0];
      if (existing.status === 'pending') {
        return res.status(409).json({ error: '已经向该工人发送过邀请' });
      }
      if (existing.status === 'accepted') {
        return res.status(409).json({ error: '该工人已接受邀请' });
      }
    }

    // 创建新邀请
    const result = await db.query(
      `INSERT INTO invitations 
       (project_id, company_id, worker_id, message, wage_amount, wage_unit, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [project_id, company_id, worker_id, message, wage_amount, wage_unit, expires_at]
    );

    // 获取项目和公司信息用于通知
    const projectInfo = await db.query(
      'SELECT project_name, description FROM projects WHERE id = $1',
      [project_id]
    );
    
    const companyInfo = await db.query(
      'SELECT company_name FROM companies WHERE id = $1',
      [company_id]
    );

    // 创建通知给工人
    await NotificationService.createNotification({
      receiver_id: worker_id,
      receiver_type: 'worker',
      sender_id: company_id,
      sender_type: 'company',
      type: 'invitation_received',
      title: '新工作机会',
      message: `${companyInfo.rows[0].company_name}邀请您参与"${projectInfo.rows[0].project_name}"项目`,
      project_id: project_id,
      invitation_id: result.rows[0].id,
      metadata: {
        companyName: companyInfo.rows[0].company_name,
        projectName: projectInfo.rows[0].project_name,
        wageOffer: wage_amount,
        wageType: wage_unit
      }
    });

    res.status(201).json({
      message: '邀请发送成功',
      invitation: result.rows[0]
    });
  } catch (error) {
    console.error('创建邀请失败:', error);
    res.status(500).json({ error: '创建邀请失败' });
  }
};

// 批量创建邀请（用于项目创建时）
const createBatchInvitations = async (req, res) => {
  try {
    const { project_id, worker_ids, message, wage_amount, wage_unit } = req.body;
    const company_id = req.user.id;

    // 检查项目权限
    const projectCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND company_id = $2',
      [project_id, company_id]
    );

    if (projectCheck.rows.length === 0) {
      return res.status(403).json({ error: '无权操作此项目' });
    }

    const invitations = [];
    const errors = [];

    // 为每个工人创建邀请
    for (const worker_id of worker_ids) {
      try {
        // 检查是否已存在邀请
        const existing = await db.query(
          'SELECT id FROM invitations WHERE project_id = $1 AND worker_id = $2',
          [project_id, worker_id]
        );

        if (existing.rows.length === 0) {
          const result = await db.query(
            `INSERT INTO invitations 
             (project_id, company_id, worker_id, message, wage_amount, wage_unit)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [project_id, company_id, worker_id, message, wage_amount, wage_type]
          );
          invitations.push(result.rows[0]);
        }
      } catch (err) {
        errors.push({ worker_id, error: err.message });
      }
    }

    res.status(201).json({
      message: `成功发送${invitations.length}个邀请`,
      invitations,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('批量创建邀请失败:', error);
    res.status(500).json({ error: '批量创建邀请失败' });
  }
};

// 获取公司发送的邀请列表
const getCompanyInvitations = async (req, res) => {
  try {
    const company_id = req.user.id;
    // 支持从路径参数或查询参数获取project_id
    const project_id = req.params.projectId || req.query.project_id;
    const { status } = req.query;

    let query = `
      SELECT 
        i.*,
        w.name as worker_name,
        w.phone as worker_phone,
        w.rating as worker_rating,
        p.project_name,
        p.project_address
      FROM invitations i
      JOIN workers w ON i.worker_id = w.id
      JOIN projects p ON i.project_id = p.id
      WHERE i.company_id = $1
    `;

    const params = [company_id];
    let paramIndex = 2;

    if (project_id) {
      query += ` AND i.project_id = $${paramIndex}`;
      params.push(project_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND i.status = $${paramIndex}`;
      params.push(status);
    }

    query += ' ORDER BY i.invited_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('获取公司邀请列表失败:', error);
    res.status(500).json({ error: '获取邀请列表失败' });
  }
};

// 获取工人收到的邀请列表
const getWorkerInvitations = async (req, res) => {
  try {
    const worker_id = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        i.*,
        c.company_name,
        c.contact_person,
        c.phone as company_phone,
        c.rating as company_rating,
        p.project_name,
        p.project_address,
        p.project_type,
        p.start_date,
        p.end_date,
        p.start_time,
        p.end_time,
        p.budget_range,
        p.work_description
      FROM invitations i
      JOIN companies c ON i.company_id = c.id
      JOIN projects p ON i.project_id = p.id
      WHERE i.worker_id = $1
    `;

    const params = [worker_id];

    if (status) {
      query += ' AND i.status = $2';
      params.push(status);
    }

    query += ' ORDER BY i.invited_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('获取工人邀请列表失败:', error);
    res.status(500).json({ error: '获取邀请列表失败' });
  }
};

// 工人响应邀请
const respondToInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response_note } = req.body;
    const worker_id = req.user.id;

    // 验证状态值
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: '无效的响应状态' });
    }

    // 检查邀请是否存在且属于该工人
    const invitationCheck = await db.query(
      'SELECT * FROM invitations WHERE id = $1 AND worker_id = $2',
      [id, worker_id]
    );

    if (invitationCheck.rows.length === 0) {
      return res.status(404).json({ error: '邀请不存在' });
    }

    const invitation = invitationCheck.rows[0];

    // 检查邀请状态
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: '该邀请已处理' });
    }

    // 检查是否过期
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return res.status(400).json({ error: '邀请已过期' });
    }

    // 更新邀请状态
    const result = await db.query(
      `UPDATE invitations 
       SET status = $1, response_note = $2, responded_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, response_note, id]
    );

    // 如果接受邀请，创建job_record
    if (status === 'accepted') {
      const { v4: uuidv4 } = require('uuid');
      const jobRecordId = uuidv4();
      
      // 获取项目开始日期
      const projectData = await db.query(
        'SELECT start_date FROM projects WHERE id = $1',
        [invitation.project_id]
      );
      
      await db.query(
        `INSERT INTO job_records (
          id,
          invitation_id,
          project_id,
          worker_id,
          company_id,
          start_date,
          status,
          wage_amount,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)`,
        [
          jobRecordId,
          id,
          invitation.project_id,
          worker_id,
          invitation.company_id,
          projectData.rows[0]?.start_date || new Date(),
          'active',  // job_records使用'active'而不是'accepted'
          invitation.wage_amount
        ]
      );
    }

    // 获取相关信息用于通知
    const workerInfo = await db.query(
      'SELECT name FROM workers WHERE id = $1',
      [worker_id]
    );
    
    const projectInfo = await db.query(
      'SELECT project_name FROM projects WHERE id = $1',
      [invitation.project_id]
    );

    // 创建通知给企业
    await NotificationService.createNotification({
      receiver_id: invitation.company_id,
      receiver_type: 'company',
      sender_id: worker_id,
      sender_type: 'worker',
      type: status === 'accepted' ? 'invitation_accepted' : 'invitation_rejected',
      title: status === 'accepted' ? '工人已确认' : '工人已拒绝',
      message: `${workerInfo.rows[0].name}${status === 'accepted' ? '已确认参与' : '拒绝了'}"${projectInfo.rows[0].project_name}"项目${response_note ? '，留言：' + response_note : ''}`,
      project_id: invitation.project_id,
      invitation_id: invitation.id,
      metadata: {
        workerName: workerInfo.rows[0].name,
        projectName: projectInfo.rows[0].project_name,
        responseMessage: response_note,
        status: status
      }
    });

    res.json({
      message: status === 'accepted' ? '已接受邀请' : '已拒绝邀请',
      invitation: result.rows[0]
    });
  } catch (error) {
    console.error('响应邀请失败:', error);
    res.status(500).json({ error: '响应邀请失败' });
  }
};

// 取消邀请
const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const company_id = req.user.id;

    // 检查邀请是否存在且属于该公司
    const invitationCheck = await db.query(
      'SELECT * FROM invitations WHERE id = $1 AND company_id = $2',
      [id, company_id]
    );

    if (invitationCheck.rows.length === 0) {
      return res.status(404).json({ error: '邀请不存在' });
    }

    const invitation = invitationCheck.rows[0];

    // 只能取消待处理的邀请
    if (invitation.status !== 'pending') {
      return res.status(400).json({ error: '只能取消待处理的邀请' });
    }

    // 更新状态为已取消
    const result = await db.query(
      `UPDATE invitations 
       SET status = 'cancelled'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    // 获取项目信息
    const projectInfo = await db.query(
      'SELECT project_name FROM projects WHERE id = $1',
      [invitation.project_id]
    );
    
    const companyInfo = await db.query(
      'SELECT company_name FROM companies WHERE id = $1',
      [company_id]
    );

    // 通知工人邀请已取消
    await NotificationService.createNotification({
      receiver_id: invitation.worker_id,
      receiver_type: 'worker',
      sender_id: company_id,
      sender_type: 'company',
      type: 'invitation_cancelled',
      title: '邀请已取消',
      message: `${companyInfo.rows[0].company_name}取消了"${projectInfo.rows[0].project_name}"项目的邀请`,
      project_id: invitation.project_id,
      invitation_id: invitation.id,
      metadata: {
        companyName: companyInfo.rows[0].company_name,
        projectName: projectInfo.rows[0].project_name
      }
    });

    res.json({
      message: '邀请已取消',
      invitation: result.rows[0]
    });
  } catch (error) {
    console.error('取消邀请失败:', error);
    res.status(500).json({ error: '取消邀请失败' });
  }
};

// 获取单个邀请详情
const getInvitationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    const user_type = req.user.type;

    let query;
    let params;

    if (user_type === 'company') {
      query = `
        SELECT 
          i.*,
          w.name as worker_name,
          w.phone as worker_phone,
          w.rating as worker_rating,
          w.experience_years,
          p.project_name,
          p.project_address
        FROM invitations i
        JOIN workers w ON i.worker_id = w.id
        JOIN projects p ON i.project_id = p.id
        WHERE i.id = $1 AND i.company_id = $2
      `;
      params = [id, user_id];
    } else {
      query = `
        SELECT 
          i.*,
          c.company_name,
          c.contact_person,
          c.phone as company_phone,
          c.rating as company_rating,
          p.project_name,
          p.project_address,
          p.project_type,
          p.start_date,
          p.end_date,
          p.work_description
        FROM invitations i
        JOIN companies c ON i.company_id = c.id
        JOIN projects p ON i.project_id = p.id
        WHERE i.id = $1 AND i.worker_id = $2
      `;
      params = [id, user_id];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '邀请不存在' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('获取邀请详情失败:', error);
    res.status(500).json({ error: '获取邀请详情失败' });
  }
};

module.exports = {
  createInvitation,
  createBatchInvitations,
  getCompanyInvitations,
  getWorkerInvitations,
  respondToInvitation,
  cancelInvitation,
  getInvitationDetail
};