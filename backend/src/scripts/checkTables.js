require('dotenv').config();
const { Client } = require('pg');

async function checkTables() {
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
        
        // 检查所有表
        const tablesResult = await client.query(`
            SELECT 
                schemaname,
                tablename,
                tableowner
            FROM pg_tables 
            WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
            ORDER BY schemaname, tablename;
        `);
        
        console.log(`📊 找到 ${tablesResult.rows.length} 个表:\n`);
        tablesResult.rows.forEach(row => {
            console.log(`   ${row.schemaname}.${row.tablename} (owner: ${row.tableowner})`);
        });
        
        // 检查skills表
        try {
            const skillsCheck = await client.query('SELECT COUNT(*) as count FROM skills;');
            console.log(`\n🎯 skills表中有 ${skillsCheck.rows[0].count} 条记录`);
        } catch (e) {
            console.log('\n❌ skills表不存在或无法访问');
        }
        
        // 检查扩展
        const extResult = await client.query(`
            SELECT extname, extversion 
            FROM pg_extension 
            WHERE extname = 'uuid-ossp';
        `);
        
        console.log(`\n🔧 扩展状态:`);
        if (extResult.rows.length > 0) {
            console.log(`   uuid-ossp: ${extResult.rows[0].extversion}`);
        } else {
            console.log(`   uuid-ossp: 未安装`);
        }
        
    } catch (error) {
        console.error('❌ 检查失败:', error.message);
    } finally {
        await client.end();
    }
}

checkTables();