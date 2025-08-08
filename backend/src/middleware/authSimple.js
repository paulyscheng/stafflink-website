const jwt = require('jsonwebtoken');
const db = require('../config/database');

// 简化的认证中间件
const authenticateToken = async (req, res, next) => {
  try {
    // 获取token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    // 开发环境测试token
    if (process.env.NODE_ENV === 'development') {
      // 处理test-token
      if (token === 'test-token') {
        // 根据请求路径判断用户类型
        const isWorkerRoute = req.path.includes('/worker') || req.path.includes('/respond');
        
        if (isWorkerRoute) {
          // 模拟工人用户
          req.user = {
            id: '550e8400-e29b-41d4-a716-446655440001', // 使用已存在的工人ID
            type: 'worker'
          };
        } else {
          // 模拟公司用户
          req.user = {
            id: '62dbe51e-2aae-499c-9783-2890a4a23dea',
            type: 'company'
          };
        }
        return next();
      }
      
      // 处理mock-token（从工人端APP登录后生成的）
      if (token.startsWith('mock-token-')) {
        // 检查是否是企业token
        if (token.includes('company')) {
          const companyId = token.replace('mock-token-company-', '');
          req.user = {
            id: companyId,
            type: 'company'
          };
        } else {
          // 工人token
          const workerId = token.replace('mock-token-', '');
          const isWorkerRoute = req.path.includes('/worker') || req.path.includes('/respond');
          
          req.user = {
            id: workerId,
            type: isWorkerRoute ? 'worker' : 'company'
          };
        }
        return next();
      }
    }

    // 验证JWT
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: '令牌无效或已过期' });
      }

      // 根据用户类型查询用户
      let userQuery;
      if (decoded.type === 'company') {
        userQuery = 'SELECT * FROM companies WHERE id = $1';
      } else if (decoded.type === 'worker') {
        userQuery = 'SELECT * FROM workers WHERE id = $1';
      } else {
        return res.status(403).json({ error: '无效的用户类型' });
      }

      const userResult = await db.query(userQuery, [decoded.id]);
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }

      req.user = {
        ...userResult.rows[0],
        type: decoded.type
      };

      next();
    });
  } catch (error) {
    console.error('认证错误:', error);
    res.status(500).json({ error: '认证过程出错' });
  }
};

module.exports = { authenticateToken };