require('dotenv').config();
const { Client } = require('pg');

async function cleanDatabase() {
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
        console.log('🔗 连接到数据库...');
        await client.connect();
        
        // 获取所有表
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE 'pg_%'
            ORDER BY tablename;
        `);
        
        console.log(`\n📊 找到 ${tablesResult.rows.length} 个表`);
        
        if (tablesResult.rows.length > 0) {
            console.log('\n🗑️  删除所有表...');
            
            // 删除所有表
            for (const row of tablesResult.rows) {
                console.log(`   删除表: ${row.tablename}`);
                await client.query(`DROP TABLE IF EXISTS ${row.tablename} CASCADE;`);
            }
        }
        
        // 删除扩展
        console.log('\n🔧 删除扩展...');
        await client.query('DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;');
        
        console.log('\n✅ 数据库清理完成！');
        
    } catch (error) {
        console.error('❌ 清理失败:', error.message);
    } finally {
        await client.end();
    }
}

cleanDatabase();