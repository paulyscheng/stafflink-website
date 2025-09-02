require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runSchemaFile() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSLMODE === 'require' ? {
            rejectUnauthorized: true,
            ca: fs.readFileSync('./ssl/ca.pem').toString()
        } : false
    });

    try {
        console.log('🔗 连接到数据库...');
        await client.connect();
        
        console.log('📂 读取 schema.sql 文件...');
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('🚀 执行 SQL 语句...\n');
        
        // 执行整个文件
        await client.query(schemaSql);
        
        console.log('✅ Schema 执行成功！\n');
        
        // 显示创建的表
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
        `);
        
        console.log(`📊 数据库中的表 (共 ${tablesResult.rows.length} 个):`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.tablename}`);
        });
        
    } catch (error) {
        console.error('\n❌ 执行失败:', error.message);
        if (error.position) {
            const lines = fs.readFileSync(path.join(__dirname, '../../../database/schema.sql'), 'utf8').split('\n');
            let charCount = 0;
            for (let i = 0; i < lines.length; i++) {
                charCount += lines[i].length + 1; // +1 for newline
                if (charCount >= error.position) {
                    console.error(`   位置: 第 ${i + 1} 行附近`);
                    console.error(`   内容: ${lines[i]}`);
                    break;
                }
            }
        }
    } finally {
        await client.end();
    }
}

runSchemaFile();