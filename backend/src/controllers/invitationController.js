const db = require('../config/database');
const { validationResult } = require('express-validator');

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
      wage_offer,
      wage_type,
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
       (project_id, company_id, worker_id, message, wage_offer, wage_type, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [project_id, company_id, worker_id, message, wage_offer, wage_type, expires_at]
    );

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
    const { project_id, worker_ids, message, wage_offer, wage_type } = req.body;
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
             (project_id, company_id, worker_id, message, wage_offer, wage_type)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [project_id, company_id, worker_id, message, wage_offer, wage_type]
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

    query += ' ORDER BY i.sent_at DESC';

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

    query += ' ORDER BY i.sent_at DESC';

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
    const { status, response_message } = req.body;
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
       SET status = $1, response_message = $2, responded_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, response_message, id]
    );

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