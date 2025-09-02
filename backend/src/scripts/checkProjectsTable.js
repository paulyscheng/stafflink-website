require('dotenv').config();
const { Client } = require('pg');

async function checkProjectsTable() {
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
        
        console.log('📊 检查 projects 表结构:\n');
        
        // 获取所有列
        const columns = await client.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('当前列结构:');
        console.log('┌─────────────────────┬──────────────┬────────┬──────────┐');
        console.log('│ 列名                │ 数据类型     │ 长度   │ 可空     │');
        console.log('├─────────────────────┼──────────────┼────────┼──────────┤');
        
        columns.rows.forEach(col => {
            const name = col.column_name.padEnd(19);
            const type = col.data_type.padEnd(12);
            const length = (col.character_maximum_length || '-').toString().padEnd(6);
            const nullable = col.is_nullable.padEnd(8);
            console.log(`│ ${name} │ ${type} │ ${length} │ ${nullable} │`);
        });
        
        console.log('└─────────────────────┴──────────────┴────────┴──────────┘');
        
        // 检查是否有数据
        const count = await client.query('SELECT COUNT(*) as count FROM projects');
        console.log(`\n📈 表中有 ${count.rows[0].count} 条记录`);
        
        // 显示示例数据（如果有）
        if (count.rows[0].count > 0) {
            const sample = await client.query('SELECT * FROM projects LIMIT 1');
            console.log('\n示例数据:');
            console.log(JSON.stringify(sample.rows[0], null, 2));
        }
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

checkProjectsTable();