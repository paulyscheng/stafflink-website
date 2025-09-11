const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * 极光认证服务
 * 用于手机号一键登录功能
 */
class JiguangService {
  constructor() {
    this.appKey = process.env.JIGUANG_APP_KEY;
    this.masterSecret = process.env.JIGUANG_MASTER_SECRET;
    this.apiUrl = 'https://api.verification.jpush.cn/v1/web/loginTokenVerify';
    
    if (!this.appKey || !this.masterSecret) {
      logger.warn('极光认证配置缺失，一键登录功能将不可用');
    }
  }

  /**
   * 验证登录token
   * @param {string} loginToken - 客户端获取的loginToken
   * @returns {Promise<{code: number, message: string, phone?: string}>}
   */
  async verifyLoginToken(loginToken) {
    // 开发环境模拟模式
    if (process.env.NODE_ENV === 'development' && (!this.appKey || !this.masterSecret)) {
      logger.warn('极光认证未配置，使用开发模式模拟验证');
      
      // 模拟验证逻辑
      if (loginToken === 'mock_login_token_for_testing') {
        // 返回模拟的成功结果，使用测试手机号
        const testPhones = [
          '13800138001', // 测试工人账号
          '13900139000', // 测试企业账号
          '13800138' + Math.floor(Math.random() * 900 + 100) // 随机测试号码
        ];
        
        return {
          code: 8000,
          message: '验证成功（开发模式）',
          phone: testPhones[Math.floor(Math.random() * testPhones.length)],
          exID: 'mock_ex_id_' + Date.now()
        };
      } else if (loginToken === 'invalid_token') {
        // 模拟验证失败
        return {
          code: 8001,
          message: '验证失败（开发模式模拟）'
        };
      } else {
        // 对于其他token，随机返回成功或失败
        if (Math.random() > 0.3) {
          return {
            code: 8000,
            message: '验证成功（开发模式）',
            phone: '138' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
            exID: 'mock_ex_id_' + Date.now()
          };
        } else {
          return {
            code: 8002,
            message: 'Token已过期（开发模式模拟）'
          };
        }
      }
    }
    
    if (!this.appKey || !this.masterSecret) {
      throw new Error('极光认证未配置');
    }

    try {
      // 生成签名
      const timestamp = Date.now();
      const nonce = crypto.randomBytes(8).toString('hex');
      const signature = this.generateSignature(timestamp, nonce);

      // 构建请求
      const response = await axios.post(
        this.apiUrl,
        {
          loginToken: loginToken
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.appKey}:${this.masterSecret}`).toString('base64')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data;
      
      if (result.code === 8000) {
        // 验证成功
        logger.info('一键登录验证成功', { phone: result.phone.substring(0, 7) + '****' });
        return {
          code: 8000,
          message: '验证成功',
          phone: result.phone,
          exID: result.exID // 运营商返回的用户标识
        };
      } else {
        // 验证失败
        logger.warn('一键登录验证失败', { code: result.code, message: result.content });
        return {
          code: result.code,
          message: result.content || '验证失败'
        };
      }
    } catch (error) {
      logger.error('极光认证API调用失败', error);
      throw new Error('认证服务暂时不可用');
    }
  }

  /**
   * 生成签名
   * @private
   */
  generateSignature(timestamp, nonce) {
    const str = `${this.appKey}${timestamp}${nonce}${this.masterSecret}`;
    return crypto.createHash('md5').update(str).digest('hex');
  }

  /**
   * 检查服务是否可用
   */
  isAvailable() {
    return !!(this.appKey && this.masterSecret);
  }

  /**
   * 获取配置状态（用于调试）
   */
  getStatus() {
    return {
      configured: this.isAvailable(),
      appKey: this.appKey ? `${this.appKey.substring(0, 6)}...` : 'Not configured'
    };
  }
}

// 导出单例
module.exports = new JiguangService();