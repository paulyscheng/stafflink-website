require('dotenv').config();
const { Client } = require('pg');

async function checkInvitationsTable() {
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
        
        console.log('📊 检查 invitations 表结构:\n');
        
        const columns = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'invitations' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('列名:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // 查看示例数据
        const sample = await client.query('SELECT * FROM invitations LIMIT 1');
        if (sample.rows.length > 0) {
            console.log('\n示例数据的列:');
            console.log(Object.keys(sample.rows[0]));
        }
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

checkInvitationsTable();