const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
    // 先连接到默认的 postgres 数据库
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'postgres', // 连接到默认数据库
        ssl: process.env.DB_SSLMODE === 'require' ? {
            rejectUnauthorized: true,
            ca: require('fs').readFileSync('./ssl/ca.pem').toString()
        } : false
    });

    try {
        console.log('🔗 连接到 postgres 数据库...');
        await client.connect();
        
        // 检查数据库是否存在
        const checkDbQuery = `
            SELECT datname FROM pg_database 
            WHERE datname = 'blue_collar_platform';
        `;
        
        const result = await client.query(checkDbQuery);
        
        if (result.rows.length === 0) {
            console.log('📦 创建 blue_collar_platform 数据库...');
            await client.query('CREATE DATABASE blue_collar_platform;');
            console.log('✅ 数据库创建成功！');
        } else {
            console.log('ℹ️ 数据库已存在');
        }
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

createDatabase();