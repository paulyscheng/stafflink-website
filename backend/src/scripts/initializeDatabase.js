require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getClient } = require('../config/database');

async function initializeDatabase() {
    const client = await getClient();
    
    try {
        console.log('🚀 开始初始化数据库...\n');
        
        // 读取 schema.sql 文件
        const schemaPath = path.join(__dirname, '../../../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // 分割 SQL 语句（以分号和换行符分割）
        const statements = schemaSql
            .split(/;\s*\n/)
            .filter(stmt => stmt.trim().length > 0)
            .map(stmt => stmt.trim() + ';');
        
        console.log(`📋 找到 ${statements.length} 条SQL语句\n`);
        
        // 逐条执行 SQL 语句
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // 跳过注释
            if (statement.trim().startsWith('--') || statement.trim().length === 0) {
                continue;
            }
            
            try {
                // 提取语句类型用于日志
                const firstWord = statement.trim().split(' ')[0].toUpperCase();
                
                if (firstWord === 'CREATE') {
                    const match = statement.match(/CREATE\s+(TABLE|INDEX|EXTENSION|FUNCTION|TRIGGER)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i);
                    if (match) {
                        console.log(`  ✅ 创建 ${match[1]}: ${match[2]}`);
                    }
                } else if (firstWord === 'INSERT') {
                    const match = statement.match(/INSERT\s+INTO\s+(\S+)/i);
                    if (match) {
                        console.log(`  ✅ 插入数据到: ${match[1]}`);
                    }
                }
                
                await client.query(statement);
                
            } catch (error) {
                console.error(`\n❌ 执行语句失败 (第 ${i + 1} 条):`);
                console.error(`   错误信息: ${error.message}`);
                console.error(`   SQL语句: ${statement.substring(0, 100)}...`);
                
                // 如果是表已存在的错误，继续执行
                if (error.message.includes('already exists')) {
                    console.log('   ⚠️  对象已存在，跳过...\n');
                    continue;
                }
                
                // 其他错误则停止执行
                throw error;
            }
        }
        
        console.log('\n✅ 数据库初始化完成！');
        
        // 显示创建的表
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
        `);
        
        console.log(`\n📊 数据库中的表 (共 ${tablesResult.rows.length} 个):`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.tablename}`);
        });
        
    } catch (error) {
        console.error('\n❌ 数据库初始化失败:', error.message);
        throw error;
    } finally {
        client.release();
        process.exit(0);
    }
}

// 执行初始化
initializeDatabase().catch(console.error);