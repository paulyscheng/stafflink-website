/**
 * 环境配置管理
 * 生产级别的环境配置，确保测试数据不会泄露到生产环境
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const config = {
  // 环境标识
  env: process.env.NODE_ENV || 'development',
  isDevelopment,
  isProduction,
  isTest,

  // API配置
  api: {
    port: process.env.PORT || 5000,
    baseUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    version: process.env.API_VERSION || 'v1',
  },

  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || (isDevelopment ? 'dev-secret-key' : undefined),
    jwtExpiry: process.env.JWT_EXPIRY || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  },

  // 数据库配置
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  },

  // SMS配置
  sms: {
    enabled: process.env.SMS_ENABLED === 'true',
    provider: process.env.SMS_PROVIDER || 'console', // 'console', 'twilio', 'aliyun'
    codeExpiry: parseInt(process.env.SMS_CODE_EXPIRY || '300000'), // 5 minutes
    codeLength: parseInt(process.env.SMS_CODE_LENGTH || '6'),
    maxAttempts: parseInt(process.env.SMS_MAX_ATTEMPTS || '5'),
    resendDelay: parseInt(process.env.SMS_RESEND_DELAY || '60000'), // 1 minute
  },

  // 开发配置（仅在开发环境生效）
  development: {
    // 是否显示测试提示
    showTestHints: isDevelopment && process.env.SHOW_TEST_HINTS !== 'false',
    // 是否启用测试账号
    enableTestAccounts: isDevelopment && process.env.ENABLE_TEST_ACCOUNTS !== 'false',
    // 是否在响应中返回验证码
    returnVerificationCode: isDevelopment && process.env.RETURN_VERIFICATION_CODE !== 'false',
    // 是否启用调试日志
    enableDebugLogs: isDevelopment && process.env.ENABLE_DEBUG_LOGS !== 'false',
  },

  // 测试账号配置（仅在开发环境且启用时生效）
  testAccounts: isDevelopment ? {
    workers: [
      { phone: '13800138001', code: generateSecureTestCode('13800138001'), name: '张师傅' },
      { phone: '13800138002', code: generateSecureTestCode('13800138002'), name: '李师傅' },
      { phone: '13800138003', code: generateSecureTestCode('13800138003'), name: '王师傅' },
    ],
    companies: [
      { phone: '13900139000', code: generateSecureTestCode('13900139000'), name: '测试企业' },
    ],
  } : {},

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    format: process.env.LOG_FORMAT || 'json',
    colorize: isDevelopment,
    timestamp: true,
  },

  // 文件上传配置
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),
    storagePath: process.env.STORAGE_PATH || './uploads',
  },

  // 缓存配置
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '3600'), // 1 hour
    checkPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600'), // 10 minutes
  },

  // 邮件配置
  email: {
    enabled: process.env.EMAIL_ENABLED === 'true',
    from: process.env.EMAIL_FROM || 'noreply@stafflink.com',
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },

  // 第三方服务配置
  services: {
    maps: {
      provider: process.env.MAPS_PROVIDER || 'google',
      apiKey: process.env.MAPS_API_KEY,
    },
    payment: {
      provider: process.env.PAYMENT_PROVIDER || 'stripe',
      apiKey: process.env.PAYMENT_API_KEY,
      webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET,
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER || 'local',
      bucket: process.env.STORAGE_BUCKET,
      region: process.env.STORAGE_REGION,
    },
  },

  // 功能开关
  features: {
    registration: process.env.FEATURE_REGISTRATION !== 'false',
    socialLogin: process.env.FEATURE_SOCIAL_LOGIN === 'true',
    pushNotifications: process.env.FEATURE_PUSH_NOTIFICATIONS === 'true',
    chat: process.env.FEATURE_CHAT === 'true',
    payments: process.env.FEATURE_PAYMENTS === 'true',
    analytics: process.env.FEATURE_ANALYTICS === 'true',
  },
};

/**
 * 生成安全的测试验证码
 * 基于手机号和密钥生成，确保每个环境的验证码不同
 */
function generateSecureTestCode(phone) {
  if (!isDevelopment) return null;
  
  const crypto = require('crypto');
  const secret = process.env.TEST_CODE_SECRET || 'stafflink-dev-2024';
  const hash = crypto.createHmac('sha256', secret)
    .update(phone)
    .digest('hex');
  
  // 取前6位数字
  const code = parseInt(hash.substring(0, 6), 16) % 1000000;
  return code.toString().padStart(6, '0');
}

// 验证必需的配置
function validateConfig() {
  const required = [];

  if (isProduction) {
    // 生产环境必需的配置
    if (!config.security.jwtSecret) required.push('JWT_SECRET');
    if (!config.database.host) required.push('DB_HOST');
    if (!config.database.database) required.push('DB_NAME');
    if (!config.database.user) required.push('DB_USER');
    if (!config.database.password) required.push('DB_PASSWORD');
  }

  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
}

// 仅在非测试环境验证配置
if (!isTest) {
  validateConfig();
}

module.exports = config;