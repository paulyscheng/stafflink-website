require('dotenv').config();
const { Client } = require('pg');

async function checkTableStructure() {
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
        
        // 检查workers表结构
        const workersColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'workers'
            ORDER BY ordinal_position;
        `);
        
        console.log('👷 Workers表结构:');
        console.log('─'.repeat(80));
        workersColumns.rows.forEach(col => {
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${col.is_nullable} | ${col.column_default || 'NULL'}`);
        });
        
        // 检查companies表结构
        const companiesColumns = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'companies'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n🏢 Companies表结构:');
        console.log('─'.repeat(80));
        companiesColumns.rows.forEach(col => {
            console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(20)} | ${col.is_nullable} | ${col.column_default || 'NULL'}`);
        });
        
        // 检查是否有第三方登录相关字段
        console.log('\n🔍 检查第三方登录相关字段:');
        console.log('─'.repeat(80));
        
        const oauthFields = ['openid', 'unionid', 'union_id', 'wechat_openid', 'wechat_unionid', 'oauth_provider', 'oauth_id'];
        
        for (const tableName of ['workers', 'companies']) {
            console.log(`\n${tableName}表:`);
            for (const field of oauthFields) {
                const result = await client.query(`
                    SELECT COUNT(*) as count
                    FROM information_schema.columns
                    WHERE table_name = $1 AND column_name ILIKE $2
                `, [tableName, `%${field}%`]);
                
                if (result.rows[0].count > 0) {
                    console.log(`  ✅ 发现字段包含 "${field}"`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    } finally {
        await client.end();
    }
}

checkTableStructure();