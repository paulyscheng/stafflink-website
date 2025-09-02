require('dotenv').config();
const { Client } = require('pg');

async function createAuthTables() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSLMODE === 'require' ? {
            rejectUnauthorized: true,
            ca: require('fs').readFileSync('./ssl/ca.pem').toString()
        } : false
    });

    try {
        console.log('🔗 连接到数据库...\n');
        await client.connect();
        
        console.log('🔐 创建认证相关表...\n');
        
        // 1. auth_tokens 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS auth_tokens (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('worker', 'company')),
                token TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_user_token UNIQUE (user_id, user_type)
            );
        `);
        console.log('   ✅ auth_tokens 表');
        
        // 创建索引
        await client.query('CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id, user_type);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);');
        
        // 2. sms_codes 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS sms_codes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                phone VARCHAR(20) NOT NULL,
                code VARCHAR(10) NOT NULL,
                type VARCHAR(20) DEFAULT 'login',
                expires_at TIMESTAMP NOT NULL,
                verified BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ sms_codes 表');
        
        // 创建索引
        await client.query('CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON sms_codes(phone);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_sms_codes_expires ON sms_codes(expires_at);');
        
        // 3. verification_codes 表（兼容旧代码）
        await client.query(`
            CREATE TABLE IF NOT EXISTS verification_codes (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                phone VARCHAR(20) NOT NULL,
                code VARCHAR(6) NOT NULL,
                user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('worker', 'company')),
                expires_at TIMESTAMP NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ verification_codes 表');
        
        // 创建索引
        await client.query('CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);');
        
        // 4. sms_rate_limit 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS sms_rate_limit (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                phone VARCHAR(20) NOT NULL,
                request_count INTEGER DEFAULT 1,
                first_request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                blocked_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_phone_limit UNIQUE (phone)
            );
        `);
        console.log('   ✅ sms_rate_limit 表');
        
        // 创建索引
        await client.query('CREATE INDEX IF NOT EXISTS idx_sms_rate_limit_phone ON sms_rate_limit(phone);');
        
        // 5. sms_logs 表（可选，用于记录短信发送历史）
        await client.query(`
            CREATE TABLE IF NOT EXISTS sms_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                phone VARCHAR(20) NOT NULL,
                type VARCHAR(50) NOT NULL,
                content TEXT,
                status VARCHAR(20) DEFAULT 'pending',
                provider VARCHAR(50),
                provider_response TEXT,
                cost DECIMAL(10,4),
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ sms_logs 表');
        
        // 6. call_logs 表（可选，用于记录语音验证码）
        await client.query(`
            CREATE TABLE IF NOT EXISTS call_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                phone VARCHAR(20) NOT NULL,
                code VARCHAR(10),
                type VARCHAR(50) DEFAULT 'verification',
                status VARCHAR(20) DEFAULT 'pending',
                provider VARCHAR(50),
                provider_response TEXT,
                duration INTEGER,
                cost DECIMAL(10,4),
                called_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ call_logs 表');
        
        // 创建更新时间触发器
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);
        
        // 为需要的表添加触发器
        const tablesWithUpdatedAt = ['auth_tokens', 'sms_codes', 'sms_rate_limit'];
        for (const table of tablesWithUpdatedAt) {
            await client.query(`
                DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
                CREATE TRIGGER update_${table}_updated_at 
                BEFORE UPDATE ON ${table} 
                FOR EACH ROW 
                EXECUTE FUNCTION update_updated_at_column();
            `);
        }
        
        console.log('\n✅ 所有认证相关表创建完成！');
        
        // 验证表创建
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('auth_tokens', 'sms_codes', 'verification_codes', 'sms_rate_limit', 'sms_logs', 'call_logs')
            ORDER BY table_name;
        `);
        
        console.log('\n📊 已创建的认证表:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

createAuthTables().catch(console.error);