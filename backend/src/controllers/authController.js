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
    
    // Store code in database with user_type
    const userType = req.body.userType || 'worker'; // Get from request
    const storeCodeQuery = `
      INSERT INTO verification_codes (phone, code, user_type, purpose, expires_at, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, NOW() + INTERVAL '30 minutes', $5, $6, NOW())
      RETURNING id, expires_at, created_at
    `;
    const storeResult = await db.query(storeCodeQuery, [
      phone, 
      code, 
      userType,
      purpose, 
      req.ip || req.connection.remoteAddress,
      req.headers['user-agent']
    ]);
    
    logger.debug(`Verification code stored for ${phone}, expires at: ${storeResult.rows[0].expires_at}`);

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

    logger.info(`🔍 [LOGIN] Attempt - Phone: ${phone}, UserType: ${userType}, Code: ${code?.substring(0, 3)}***`);

    // Verify verification code
    const codeQuery = `
      SELECT * FROM verification_codes 
      WHERE phone = $1 AND code = $2 AND purpose IN ('login', 'register')
      AND expires_at > NOW() AND is_used = false
      ORDER BY created_at DESC LIMIT 1
    `;
    
    logger.info(`🔍 [LOGIN] Checking verification code...`);
    const codeResult = await db.query(codeQuery, [phone, code]);
    logger.info(`📊 [LOGIN] Verification code query result: Found ${codeResult.rows.length} valid codes`);
    
    if (codeResult.rows.length > 0) {
      const validCode = codeResult.rows[0];
      logger.info(`✅ [LOGIN] Valid code found - Created: ${validCode.created_at}, Expires: ${validCode.expires_at}`);
    }

    if (codeResult.rows.length === 0) {
      // 额外查询以了解为什么找不到验证码
      const allCodesQuery = `
        SELECT code, purpose, is_used, expires_at, created_at 
        FROM verification_codes 
        WHERE phone = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      const allCodes = await db.query(allCodesQuery, [phone]);
      logger.warn(`⚠️ [LOGIN] No valid code found. Recent codes for ${phone}:`);
      allCodes.rows.forEach((c, i) => {
        logger.warn(`  ${i+1}. Code: ${c.code}, Purpose: ${c.purpose}, Used: ${c.is_used}, Expires: ${c.expires_at}`);
      });
      
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    // Mark code as used only after verifying user exists
    let codeId = codeResult.rows[0].id;

    // Find user by phone and type
    let userQuery;
    if (userType === 'company') {
      userQuery = 'SELECT * FROM companies WHERE phone = $1';
    } else {
      userQuery = 'SELECT * FROM workers WHERE phone = $1';
    }

    logger.info(`🔍 [LOGIN] Looking for user in ${userType} table...`);
    const userResult = await db.query(userQuery, [phone]);
    logger.info(`📊 [LOGIN] User query result: Found ${userResult.rows.length} users`);

    if (userResult.rows.length === 0) {
      logger.warn(`⚠️ [LOGIN] User not found - Phone: ${phone}, Type: ${userType}`);
      return res.status(404).json({
        success: false,
        error: 'User not found. Please register first.'
      });
    }

    const user = userResult.rows[0];
    logger.info(`✅ [LOGIN] User found - ID: ${user.id}, Name: ${user.name || user.company_name}`);
    
    // Now mark code as used since we found the user
    const markUsedQuery = 'UPDATE verification_codes SET is_used = true WHERE id = $1';
    await db.query(markUsedQuery, [codeId]);

    // Generate and store token
    const token = generateToken(user.id, userType);
    await storeToken(user.id, userType, token);

    // Update last login time
    const updateLastLoginQuery = userType === 'company' 
      ? 'UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE id = $1'
      : 'UPDATE workers SET updated_at = CURRENT_TIMESTAMP WHERE id = $1';
    await db.query(updateLastLoginQuery, [user.id]);

    logger.info(`✅ [LOGIN] Success - User logged in: ${user.id} (${userType})`);

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
        position: user.position,
        address: user.address,
        industry: user.industry,
        company_size: user.company_size,
        logo_url: user.logo_url,
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

    const { phone, code, userType, name, password, ...otherData } = req.body;

    // Check if it's a test account in development mode
    let codeValid = false;
    let codeId = null;
    
    if (process.env.NODE_ENV === 'development' && code === '123456') {
      // In development, accept test code for any new registration
      const testPhones = [
        '13900139000', '13900139001', '13900139002', '13900139003',
        '13900139004', '13900139005', '13900139006', '13900139007',
        '13900139008', '13900139009'
      ];
      
      // Check if it's a test phone or any phone in development
      if (testPhones.includes(phone) || process.env.NODE_ENV === 'development') {
        codeValid = true;
        logger.info(`Development mode: Test code accepted for new registration ${phone}`);
      }
    }
    
    // If not using test code, verify the actual code
    if (!codeValid) {
      const codeQuery = `
        SELECT * FROM verification_codes 
        WHERE phone = $1 AND code = $2 AND purpose IN ('register', 'login')
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
      
      codeId = codeResult.rows[0].id;
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

    // Mark code as used (only if not using test code)
    if (codeId) {
      const markUsedQuery = 'UPDATE verification_codes SET is_used = true WHERE id = $1';
      await db.query(markUsedQuery, [codeId]);
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create new user
    let createUserQuery, userData;
    if (userType === 'company') {
      createUserQuery = `
        INSERT INTO companies (company_name, contact_person, phone, email, address, industry, position, company_size, logo_url, password)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      userData = [
        name,
        otherData.contactPerson || name,
        phone,
        otherData.email || null,
        otherData.address || null,
        otherData.industry || null,
        otherData.position || null,
        otherData.companySize || null,
        otherData.logoUrl || null,
        hashedPassword
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
    // Get fresh user data from database
    let userQuery;
    if (req.user.type === 'company') {
      userQuery = `
        SELECT 
          id, company_name, contact_person, position, phone, email, 
          address, industry, company_size, logo_url, rating, 
          total_projects, status, created_at,
          (SELECT COUNT(*) FROM projects WHERE company_id = companies.id AND status = 'active') as active_projects,
          (SELECT COUNT(*) FROM projects WHERE company_id = companies.id AND status = 'completed') as completed_projects
        FROM companies 
        WHERE id = $1
      `;
    } else {
      userQuery = `
        SELECT 
          id, name, phone, age, gender, address, rating, 
          experience_years, completed_jobs, total_jobs, status, created_at
        FROM workers 
        WHERE id = $1
      `;
    }
    
    const result = await db.query(userQuery, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = result.rows[0];
    
    // Format response based on user type
    if (req.user.type === 'company') {
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          company_name: user.company_name,
          contact_person: user.contact_person,
          position: user.position,
          phone: user.phone,
          email: user.email,
          address: user.address,
          industry: user.industry,
          company_size: user.company_size,
          logo_url: user.logo_url,
          verified: user.status === 'active',
          created_at: user.created_at,
          stats: {
            active_projects: parseInt(user.active_projects) || 0,
            completed_projects: parseInt(user.completed_projects) || 0,
            total_workers: 0 // TODO: Calculate from invitations
          },
          userType: 'company'
        }
      });
    } else {
      res.status(200).json({
        success: true,
        user: {
          ...user,
          userType: 'worker'
        }
      });
    }

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