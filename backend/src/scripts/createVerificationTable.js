const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'gz-postgres-peldbckv.sql.tencentcdb.com',
  port: process.env.DB_PORT || 23309,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'staffLink',
  password: process.env.DB_PASSWORD || 'SkzgEBg-23YbBpc',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTable() {
  try {
    console.log('📱 Creating verification codes table...\n');

    // 创建验证码表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        user_type VARCHAR(20) NOT NULL, -- 'worker' or 'company'
        purpose VARCHAR(50) DEFAULT 'login', -- 'login', 'register', 'reset_password'
        attempts INT DEFAULT 0,
        is_used BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT
      )
    `);

    // 创建索引
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_phone_code 
      ON verification_codes(phone, code, is_used, expires_at)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_expires 
      ON verification_codes(expires_at) 
      WHERE is_used = false
    `);

    console.log('✅ Verification codes table created successfully');

    // 创建清理过期验证码的函数
    await pool.query(`
      CREATE OR REPLACE FUNCTION clean_expired_codes()
      RETURNS void AS $$
      BEGIN
        DELETE FROM verification_codes 
        WHERE expires_at < NOW() OR is_used = true;
      END;
      $$ LANGUAGE plpgsql;
    `);

    console.log('✅ Cleanup function created');

    // 创建发送记录表（防止频繁发送）
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_rate_limit (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone VARCHAR(20) NOT NULL,
        sent_count INT DEFAULT 1,
        first_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        blocked_until TIMESTAMP,
        UNIQUE(phone)
      )
    `);

    console.log('✅ SMS rate limit table created');

    // 创建通话记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS call_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        call_id VARCHAR(255) UNIQUE,
        phone VARCHAR(20) NOT NULL,
        type VARCHAR(50), -- 'invitation', 'urgent', 'payment', 'general'
        status VARCHAR(50), -- 'initiated', 'ringing', 'completed', 'failed'
        duration INT, -- 秒
        recording_url TEXT,
        script TEXT,
        user_response VARCHAR(10),
        provider VARCHAR(50), -- 'twilio', 'aliyun', 'baidu', 'mock'
        cost DECIMAL(10, 4),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    console.log('✅ Call logs table created');

    // 创建短信发送记录表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        message_id VARCHAR(255) UNIQUE,
        phone VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50), -- 'verification', 'invitation', 'payment', 'notification'
        status VARCHAR(50), -- 'sent', 'delivered', 'failed'
        provider VARCHAR(50), -- 'twilio', 'tencent', 'aliyun', 'mock'
        cost DECIMAL(10, 4),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP
      )
    `);

    console.log('✅ SMS logs table created');

    console.log('\n✅ All verification and notification tables created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await pool.end();
  }
}

createTable();