const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// 判断是否需要SSL
const needsSSL = process.env.DB_SSLMODE === 'require';
const sslPath = path.join(__dirname, '../../ssl/ca.pem');
const sslExists = fs.existsSync(sslPath);

// PostgreSQL连接配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  application_name: 'blue-collar-api',
};

// 如果需要SSL且证书存在，使用SSL连接
if (needsSSL && sslExists) {
  poolConfig.ssl = {
    ca: fs.readFileSync(sslPath),
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  };
} else if (needsSSL && !sslExists) {
  // 如果需要SSL但证书不存在，使用简单的SSL配置（腾讯云）
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('✅ Database connected successfully');
    logger.info(`📅 Database time: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    logger.warn('⚠️  Running without database connection - some features may not work');
    // 不抛出错误，允许服务器启动
    return false;
  }
};

// Execute query with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Executed query in ${duration}ms: ${text}`);
    return result;
  } catch (error) {
    logger.error('Database query error:', {
      error: error.message,
      query: text,
      params: params
    });
    throw error;
  }
};

// Get a client from the pool for transactions
const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error) {
    logger.error('Failed to get database client:', error.message);
    throw error;
  }
};

// Execute transaction
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
const shutdown = async () => {
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error('Error closing database pool:', error.message);
  }
};

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  shutdown
};