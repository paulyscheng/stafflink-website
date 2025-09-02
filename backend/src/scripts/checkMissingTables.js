require('dotenv').config();
const { Client } = require('pg');

async function checkMissingTables() {
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
        
        // 需要检查的表
        const requiredTables = [
            'companies',
            'workers', 
            'auth_tokens',
            'sms_codes',
            'verification_codes',
            'skills',
            'worker_skills',
            'projects',
            'invitations',
            'job_records',
            'notifications',
            'sms_rate_limit'
        ];
        
        console.log('📋 检查必需的表:\n');
        
        for (const table of requiredTables) {
            try {
                const result = await client.query(
                    `SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    );`,
                    [table]
                );
                
                const exists = result.rows[0].exists;
                console.log(`   ${exists ? '✅' : '❌'} ${table}`);
                
                if (!exists) {
                    // 尝试获取类似的表名
                    const similar = await client.query(`
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name LIKE '%${table.substring(0, 3)}%'
                        LIMIT 3;
                    `);
                    
                    if (similar.rows.length > 0) {
                        console.log(`      可能的相似表: ${similar.rows.map(r => r.table_name).join(', ')}`);
                    }
                }
            } catch (err) {
                console.log(`   ❌ ${table} (检查失败: ${err.message})`);
            }
        }
        
        // 列出所有实际存在的表
        console.log('\n📊 数据库中实际存在的表:');
        const allTables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        allTables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

checkMissingTables();