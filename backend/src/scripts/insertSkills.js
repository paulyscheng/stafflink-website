require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function insertSkills() {
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
        console.log('🔗 连接到数据库...\n');
        await client.connect();
        
        // 读取schema文件
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // 提取所有技能插入语句
        const skillSection = schemaSql.match(/-- ===========================\s*\n-- 技能数据[\s\S]*?(?=-- ===========================|$)/);
        
        if (!skillSection) {
            console.log('❌ 未找到技能数据部分');
            return;
        }
        
        // 提取每个INSERT语句
        const insertStatements = skillSection[0].match(/INSERT INTO skills[^;]+;/g);
        
        if (!insertStatements) {
            console.log('❌ 未找到INSERT语句');
            return;
        }
        
        console.log(`📋 找到 ${insertStatements.length} 条技能插入语句\n`);
        
        let successCount = 0;
        let skipCount = 0;
        
        for (const stmt of insertStatements) {
            try {
                await client.query(stmt);
                successCount++;
            } catch (err) {
                if (err.code === '23505') {
                    // 重复键，跳过
                    skipCount++;
                } else {
                    console.error(`❌ 错误: ${err.message}`);
                }
            }
        }
        
        console.log(`\n✅ 完成！插入 ${successCount} 条，跳过 ${skipCount} 条\n`);
        
        // 显示各类别的技能数量
        const categoriesResult = await client.query(`
            SELECT category, COUNT(*) as count 
            FROM skills 
            GROUP BY category 
            ORDER BY category;
        `);
        
        console.log('📊 技能分类统计:');
        categoriesResult.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.count} 个技能`);
        });
        
        const totalResult = await client.query('SELECT COUNT(*) as count FROM skills');
        console.log(`\n   总计: ${totalResult.rows[0].count} 个技能`);
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

insertSkills();