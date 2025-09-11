const db = require('../config/database');
const logger = require('../utils/logger');

// @desc    Update company profile
// @route   PUT /api/companies/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    console.log('🟡 [Backend] updateProfile 被调用');
    console.log('🟡 [Backend] 用户信息:', req.user);
    console.log('🟡 [Backend] 请求数据:', req.body);
    
    const companyId = req.user.id;
    const {
      company_name,
      contact_person,
      position,
      address,
      phone,
      email,
      industry,
      company_size,
      description
    } = req.body;

    // Build update query dynamically based on provided fields
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (company_name !== undefined) {
      updateFields.push(`company_name = $${paramCount}`);
      values.push(company_name);
      paramCount++;
    }

    if (contact_person !== undefined) {
      updateFields.push(`contact_person = $${paramCount}`);
      values.push(contact_person);
      paramCount++;
    }

    if (position !== undefined) {
      updateFields.push(`position = $${paramCount}`);
      values.push(position);
      paramCount++;
    }

    if (address !== undefined) {
      updateFields.push(`address = $${paramCount}`);
      values.push(address);
      paramCount++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (industry !== undefined) {
      updateFields.push(`industry = $${paramCount}`);
      values.push(industry);
      paramCount++;
    }

    if (company_size !== undefined) {
      updateFields.push(`company_size = $${paramCount}`);
      values.push(company_size);
      paramCount++;
    }

    // 暂时注释掉description字段，因为表中还没有这个列
    // if (description !== undefined) {
    //   updateFields.push(`description = $${paramCount}`);
    //   values.push(description);
    //   paramCount++;
    // }

    // Always update the updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add company ID to the values array
    values.push(companyId);

    const updateQuery = `
      UPDATE companies 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING 
        id, company_name, contact_person, position, phone, email, 
        address, industry, company_size, logo_url, rating, 
        total_projects, status, created_at, updated_at
    `;

    console.log('🟡 [Backend] SQL查询:', updateQuery);
    console.log('🟡 [Backend] 参数值:', values);
    
    const result = await db.query(updateQuery, values);
    console.log('🟡 [Backend] 查询结果行数:', result.rows.length);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    const updatedCompany = result.rows[0];

    logger.info(`Company profile updated: ${companyId}`);
    console.log('🟡 [Backend] 更新成功，返回数据:', updatedCompany);

    res.status(200).json({
      success: true,
      data: updatedCompany,
      message: '公司信息更新成功'
    });

  } catch (error) {
    logger.error('Update company profile error:', error);
    next(error);
  }
};

// @desc    Get company profile
// @route   GET /api/companies/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const companyId = req.user.id;

    const query = `
      SELECT 
        id, company_name, contact_person, position, phone, email, 
        address, industry, company_size, logo_url, rating, 
        total_projects, status, created_at, updated_at,
        (SELECT COUNT(*) FROM projects WHERE company_id = companies.id AND status = 'active') as active_projects,
        (SELECT COUNT(*) FROM projects WHERE company_id = companies.id AND status = 'completed') as completed_projects
      FROM companies 
      WHERE id = $1
    `;

    const result = await db.query(query, [companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    logger.error('Get company profile error:', error);
    next(error);
  }
};

module.exports = {
  updateProfile,
  getProfile
};