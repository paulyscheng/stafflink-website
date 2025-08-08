const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 开发环境下跳过JWT验证
    if (process.env.NODE_ENV === 'development') {
      if (token === 'test-token-for-development') {
        req.user = {
          id: '62dbe51e-2aae-499c-9783-2890a4a23dea',
          type: 'company'
        };
        return next();
      }
      
      // 处理mock-token
      if (token && token.startsWith('mock-token-')) {
        if (token.includes('company')) {
          // 企业模拟token
          const companyId = token.replace('mock-token-company-', '');
          req.user = {
            id: companyId,
            type: 'company',
            company_name: '测试企业'
          };
        } else {
          // 工人模拟token
          const workerId = token.replace('mock-token-', '');
          req.user = {
            id: workerId,
            type: 'worker',
            name: '测试工人'
          };
        }
        return next();
      }
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if token exists in database and is not expired
      const tokenQuery = `
        SELECT * FROM auth_tokens 
        WHERE user_id = $1 AND user_type = $2 AND expires_at > NOW()
      `;
      const tokenResult = await db.query(tokenQuery, [decoded.id, decoded.type]);

      if (tokenResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'Token is invalid or expired'
        });
      }

      // Get user details based on type
      let userQuery;
      if (decoded.type === 'company') {
        userQuery = 'SELECT * FROM companies WHERE id = $1';
      } else if (decoded.type === 'worker') {
        userQuery = 'SELECT * FROM workers WHERE id = $1';
      } else {
        return res.status(401).json({
          success: false,
          error: 'Invalid user type'
        });
      }

      const userResult = await db.query(userQuery, [decoded.id]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Add user to request object
      req.user = {
        ...userResult.rows[0],
        type: decoded.type
      };

      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during authentication'
    });
  }
};

// Authorize specific user types
const authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.type)) {
      return res.status(403).json({
        success: false,
        error: `User type ${req.user.type} is not authorized to access this route`
      });
    }
    next();
  };
};

// Generate JWT token
const generateToken = (userId, userType) => {
  return jwt.sign(
    { id: userId, type: userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Store token in database
const storeToken = async (userId, userType, token) => {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    const query = `
      INSERT INTO auth_tokens (user_id, user_type, token_hash, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, user_type) DO UPDATE SET
        token_hash = $3,
        expires_at = $4,
        created_at = CURRENT_TIMESTAMP
    `;

    await db.query(query, [userId, userType, token, expiresAt]);
    logger.info(`Token stored for user ${userId} (${userType})`);
  } catch (error) {
    logger.error('Error storing token:', error);
    throw error;
  }
};

// Remove token from database (logout)
const removeToken = async (userId, userType) => {
  try {
    const query = 'DELETE FROM auth_tokens WHERE user_id = $1 AND user_type = $2';
    await db.query(query, [userId, userType]);
    logger.info(`Token removed for user ${userId} (${userType})`);
  } catch (error) {
    logger.error('Error removing token:', error);
    throw error;
  }
};

module.exports = {
  protect,
  authorize,
  generateToken,
  storeToken,
  removeToken
};