const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const logger = require('../utils/logger');
const { generateToken, storeToken, removeToken } = require('../middleware/auth');
const smsService = require('../services/smsService');
const config = require('../config/environment');

// @desc    Send SMS verification code
// @route   POST /api/auth/send-code
// @access  Public
const sendVerificationCode = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { phone, purpose = 'login' } = req.body;

    // Check rate limiting - only one code per minute per phone
    const recentCodeQuery = `
      SELECT * FROM verification_codes 
      WHERE phone = $1 AND created_at > NOW() - INTERVAL '1 minute' AND is_used = false
      ORDER BY created_at DESC LIMIT 1
    `;
    const recentCode = await db.query(recentCodeQuery, [phone]);

    if (recentCode.rows.length > 0) {
      return res.status(429).json({
        success: false,
        error: 'Please wait before requesting another code'
      });
    }

    // Generate verification code
    let code;
    if (config.isDevelopment && config.development.enableTestAccounts) {
      // 开发环境且启用测试账号时，使用安全的测试验证码
      const testAccount = [...config.testAccounts.workers, ...config.testAccounts.companies]
        .find(acc => acc.phone === phone);
      
      if (testAccount) {
        code = testAccount.code;
        logger.debug(`Using test code for ${phone}`);
      } else {
        // 非测试账号生成随机验证码
        code = Math.floor(100000 + Math.random() * 900000).toString();
      }
    } else {
      // 生产环境或禁用测试账号时，始终生成随机验证码
      code = Math.floor(100000 + Math.random() * 900000).toString();
    }
    
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store code in database with user_type
    const userType = req.body.userType || 'worker'; // Get from request
    const storeCodeQuery = `
      INSERT INTO verification_codes (phone, code, user_type, purpose, expires_at, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    await db.query(storeCodeQuery, [
      phone, 
      code, 
      userType,
      purpose, 
      expiresAt,
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    ]);

    // Send SMS
    if (config.sms.enabled && config.isProduction) {
      // 生产环境使用真实短信服务
      await smsService.sendCode(phone, code);
      res.status(200).json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } else {
      // 开发环境记录日志
      if (config.development.enableDebugLogs) {
        logger.info(`SMS Code for ${phone}: ${code}`);
      }
      
      const response = {
        success: true,
        message: 'Verification code sent successfully'
      };
      
      // 仅在开发环境且配置允许时返回验证码
      if (config.development.returnVerificationCode) {
        response.code = code;
      }
      
      res.status(200).json(response);
    }

  } catch (error) {
    logger.error('Send verification code error:', error);
    next(error);
  }
};

// @desc    Login with phone and verification code
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { phone, code, userType } = req.body;

    // 开发环境下的测试验证码
    let codeValid = false;
    
    if (process.env.NODE_ENV === 'development') {
      const testCodes = {
        // 工人测试账号
        '13800138001': '123456', // 张师傅/李师傅 - 主测试账号
        '13800138002': '123456', // 李师傅
        '13800138003': '123457', // 王师傅
        '13800138004': '123458', // 赵师傅
        '13800138005': '123451', // 刘师傅
        '13800138006': '234510', // 陈阿姨
        '13800138007': '123454', // 孙师傅
        '13800138008': '123453', // 周师傅
        '13800138009': '123452', // 吴师傅
        '13800138010': '123459', // 郑阿姨
        '13800138000': '123456', // 测试账号
        // 企业测试账号
        '13900139000': '123456', // 蓝领科技有限公司
      };
      
      if (testCodes[phone] && testCodes[phone] === code) {
        codeValid = true;
        logger.info(`Development mode: Test code accepted for ${phone}`);
      }
    }
    
    // 如果不是测试验证码，进行正常验证
    if (!codeValid) {
      const codeQuery = `
        SELECT * FROM verification_codes 
        WHERE phone = $1 AND code = $2 AND purpose = 'login' 
        AND expires_at > NOW() AND is_used = false
        ORDER BY created_at DESC LIMIT 1
      `;
      const codeResult = await db.query(codeQuery, [phone, code]);

      if (codeResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired verification code'
        });
      }

      // Mark code as used
      const markUsedQuery = 'UPDATE verification_codes SET is_used = true WHERE id = $1';
      await db.query(markUsedQuery, [codeResult.rows[0].id]);
    }

    // Find user by phone and type
    let userQuery;
    if (userType === 'company') {
      userQuery = 'SELECT * FROM companies WHERE phone = $1';
    } else {
      userQuery = 'SELECT * FROM workers WHERE phone = $1';
    }

    const userResult = await db.query(userQuery, [phone]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found. Please register first.'
      });
    }

    const user = userResult.rows[0];

    // Generate and store token
    const token = generateToken(user.id, userType);
    await storeToken(user.id, userType, token);

    // Update last login time
    const updateLastLoginQuery = userType === 'company' 
      ? 'UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE id = $1'
      : 'UPDATE workers SET updated_at = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(updateLastLoginQuery, [user.id]);

    logger.info(`User logged in: ${user.id} (${userType})`);

    // 根据用户类型返回不同的信息
    let userData;
    if (userType === 'worker') {
      userData = {
        id: user.id,
        name: user.name,
        phone: user.phone,
        age: user.age,
        gender: user.gender,
        address: user.address,
        rating: user.rating,
        experience_years: user.experience_years,
        completed_jobs: user.completed_jobs,
        total_jobs: user.total_jobs,
        status: user.status,
        type: userType
      };
    } else {
      userData = {
        id: user.id,
        name: user.company_name,
        phone: user.phone,
        contact_person: user.contact_person,
        address: user.address,
        rating: user.rating,
        type: userType
      };
    }

    res.status(200).json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { phone, code, userType, name, ...otherData } = req.body;

    // Verify SMS code
    const codeQuery = `
      SELECT * FROM sms_codes 
      WHERE phone = $1 AND code = $2 AND purpose IN ('register', 'login')
      AND expires_at > NOW() AND used = false
      ORDER BY created_at DESC LIMIT 1
    `;
    const codeResult = await db.query(codeQuery, [phone, code]);

    if (codeResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    // Check if user already exists
    let checkUserQuery;
    if (userType === 'company') {
      checkUserQuery = 'SELECT id FROM companies WHERE phone = $1';
    } else {
      checkUserQuery = 'SELECT id FROM workers WHERE phone = $1';
    }

    const existingUser = await db.query(checkUserQuery, [phone]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User already exists. Please login instead.'
      });
    }

    // Mark code as used
    const markUsedQuery = 'UPDATE sms_codes SET used = true WHERE id = $1';
    await db.query(markUsedQuery, [codeResult.rows[0].id]);

    // Create new user
    let createUserQuery, userData;
    if (userType === 'company') {
      createUserQuery = `
        INSERT INTO companies (company_name, contact_person, phone, email, address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      userData = [
        name,
        otherData.contactPerson || name,
        phone,
        otherData.email || null,
        otherData.address || null
      ];
    } else {
      createUserQuery = `
        INSERT INTO workers (name, phone, age, gender, address)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      userData = [
        name,
        phone,
        otherData.age || null,
        otherData.gender || null,
        otherData.address || null
      ];
    }

    const newUserResult = await db.query(createUserQuery, userData);
    const newUser = newUserResult.rows[0];

    // Generate and store token
    const token = generateToken(newUser.id, userType);
    await storeToken(newUser.id, userType, token);

    logger.info(`New user registered: ${newUser.id} (${userType})`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name || newUser.company_name,
        phone: newUser.phone,
        type: userType
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    await removeToken(req.user.id, req.user.type);

    logger.info(`User logged out: ${req.user.id} (${req.user.type})`);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logger.error('Logout error:', error);
    next(error);
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = async (req, res, next) => {
  try {
    // Generate new token
    const token = generateToken(req.user.id, req.user.type);
    await storeToken(req.user.id, req.user.type, token);

    res.status(200).json({
      success: true,
      token
    });

  } catch (error) {
    logger.error('Refresh token error:', error);
    next(error);
  }
};

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = { ...req.user };
    delete user.type; // Remove internal type field

    res.status(200).json({
      success: true,
      user: {
        ...user,
        userType: req.user.type
      }
    });

  } catch (error) {
    logger.error('Get me error:', error);
    next(error);
  }
};

module.exports = {
  sendVerificationCode,
  login,
  register,
  logout,
  refreshToken,
  getMe
};