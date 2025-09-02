require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabaseStep() {
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
        
        // 读取schema文件
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // 分割成单个语句
        const statements = schemaSql
            .split(/;(?=\s*\n)/)
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log(`\n📋 找到 ${statements.length} 条SQL语句\n`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i] + ';';
            
            try {
                // 提取语句类型
                const stmtType = stmt.match(/^\s*(\w+)/)?.[1]?.toUpperCase() || 'UNKNOWN';
                
                // 跳过空语句
                if (!stmt.trim() || stmt.trim() === ';') continue;
                
                await client.query(stmt);
                successCount++;
                
                // 简化输出
                if (stmtType === 'CREATE') {
                    const objectMatch = stmt.match(/CREATE\s+(?:TABLE|INDEX|EXTENSION|FUNCTION|TRIGGER)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i);
                    if (objectMatch) {
                        console.log(`✅ 创建: ${objectMatch[1]}`);
                    }
                } else if (stmtType === 'INSERT') {
                    const tableMatch = stmt.match(/INSERT\s+INTO\s+(\S+)/i);
                    if (tableMatch && tableMatch[1] === 'skills') {
                        // 对于skills表，只显示一次
                        if (!this.skillsInserted) {
                            console.log(`✅ 插入数据到: skills 表`);
                            this.skillsInserted = true;
                        }
                    } else if (tableMatch) {
                        console.log(`✅ 插入数据到: ${tableMatch[1]}`);
                    }
                }
                
            } catch (error) {
                errorCount++;
                
                // 忽略某些可接受的错误
                if (error.message.includes('already exists') || 
                    error.message.includes('duplicate key')) {
                    console.log(`⚠️  跳过 (已存在): 语句 ${i + 1}`);
                    successCount++; // 计为成功
                    errorCount--;
                } else {
                    console.error(`❌ 错误 (语句 ${i + 1}): ${error.message}`);
                    // 对于关键错误，停止执行
                    if (error.message.includes('does not exist') && !stmt.includes('IF EXISTS')) {
                        throw error;
                    }
                }
            }
        }
        
        console.log(`\n📊 执行结果: ${successCount} 成功, ${errorCount} 失败\n`);
        
        // 显示最终的表
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
        `);
        
        console.log(`✅ 创建的表 (共 ${tablesResult.rows.length} 个):`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.tablename}`);
        });
        
        // 检查skills数据
        const skillsCount = await client.query('SELECT COUNT(*) as count FROM skills;');
        console.log(`\n📋 skills表中有 ${skillsCount.rows[0].count} 个技能`);
        
    } catch (error) {
        console.error('\n❌ 初始化失败:', error.message);
    } finally {
        await client.end();
    }
}

initDatabaseStep();