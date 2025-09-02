require('dotenv').config();
const { Client } = require('pg');

async function updateAuthTokensTable() {
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
        
        console.log('🔧 检查 auth_tokens 表结构...\n');
        
        // 检查现有列
        const columns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'auth_tokens' 
            AND table_schema = 'public';
        `);
        
        console.log('现有列:');
        columns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });
        
        // 检查是否有 token_hash 列
        const hasTokenHash = columns.rows.some(col => col.column_name === 'token_hash');
        const hasToken = columns.rows.some(col => col.column_name === 'token');
        
        if (!hasTokenHash && hasToken) {
            // 重命名 token 列为 token_hash
            console.log('\n📝 重命名 token 列为 token_hash...');
            await client.query('ALTER TABLE auth_tokens RENAME COLUMN token TO token_hash;');
            console.log('   ✅ 列重命名完成');
        } else if (!hasTokenHash && !hasToken) {
            // 添加 token_hash 列
            console.log('\n➕ 添加 token_hash 列...');
            await client.query('ALTER TABLE auth_tokens ADD COLUMN token_hash TEXT NOT NULL;');
            console.log('   ✅ 列添加完成');
        } else {
            console.log('\n✅ token_hash 列已存在');
        }
        
        // 确保索引存在
        console.log('\n🔍 创建索引...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON auth_tokens(token_hash);');
        console.log('   ✅ 索引创建完成');
        
        // 显示最终的表结构
        console.log('\n📊 更新后的 auth_tokens 表结构:');
        const finalColumns = await client.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'auth_tokens' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n┌─────────────────┬──────────────┬────────┬──────────┬──────────────────────────┐');
        console.log('│ 列名            │ 数据类型     │ 长度   │ 可空     │ 默认值                   │');
        console.log('├─────────────────┼──────────────┼────────┼──────────┼──────────────────────────┤');
        
        finalColumns.rows.forEach(col => {
            const name = col.column_name.padEnd(15);
            const type = col.data_type.padEnd(12);
            const length = (col.character_maximum_length || '-').toString().padEnd(6);
            const nullable = col.is_nullable.padEnd(8);
            const defaultVal = (col.column_default || '-').toString().substring(0, 24).padEnd(24);
            console.log(`│ ${name} │ ${type} │ ${length} │ ${nullable} │ ${defaultVal} │`);
        });
        
        console.log('└─────────────────┴──────────────┴────────┴──────────┴──────────────────────────┘');
        
        // 检查约束
        const constraints = await client.query(`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'auth_tokens'
            AND table_schema = 'public';
        `);
        
        console.log('\n🔒 约束:');
        constraints.rows.forEach(con => {
            console.log(`   - ${con.constraint_name} (${con.constraint_type})`);
        });
        
        console.log('\n✅ auth_tokens 表更新完成！');
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

updateAuthTokensTable().catch(console.error);