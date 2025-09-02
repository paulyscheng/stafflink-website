require('dotenv').config();
const { Client } = require('pg');

async function updateVerificationCodesTable() {
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
        
        console.log('🔧 更新 verification_codes 表结构...\n');
        
        // 检查现有列
        const columns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'verification_codes' 
            AND table_schema = 'public';
        `);
        
        const existingColumns = columns.rows.map(row => row.column_name);
        console.log('现有列:', existingColumns.join(', '));
        
        // 添加缺失的列
        const columnsToAdd = [
            { name: 'purpose', sql: "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS purpose VARCHAR(50) DEFAULT 'login';" },
            { name: 'ip_address', sql: "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);" },
            { name: 'user_agent', sql: "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS user_agent TEXT;" },
            { name: 'updated_at', sql: "ALTER TABLE verification_codes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;" }
        ];
        
        for (const col of columnsToAdd) {
            if (!existingColumns.includes(col.name)) {
                await client.query(col.sql);
                console.log(`   ✅ 添加列: ${col.name}`);
            } else {
                console.log(`   ℹ️  列已存在: ${col.name}`);
            }
        }
        
        // 创建或更新触发器
        await client.query(`
            DROP TRIGGER IF EXISTS update_verification_codes_updated_at ON verification_codes;
            CREATE TRIGGER update_verification_codes_updated_at 
            BEFORE UPDATE ON verification_codes 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log('   ✅ 更新触发器');
        
        // 显示最终的表结构
        console.log('\n📊 更新后的表结构:');
        const finalColumns = await client.query(`
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                column_default,
                is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'verification_codes' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('┌────────────────┬──────────────┬────────┬─────────────────────────┬──────────┐');
        console.log('│ 列名           │ 数据类型     │ 长度   │ 默认值                  │ 可空     │');
        console.log('├────────────────┼──────────────┼────────┼─────────────────────────┼──────────┤');
        
        finalColumns.rows.forEach(col => {
            const name = col.column_name.padEnd(14);
            const type = col.data_type.padEnd(12);
            const length = (col.character_maximum_length || '-').toString().padEnd(6);
            const defaultVal = (col.column_default || '-').toString().substring(0, 23).padEnd(23);
            const nullable = col.is_nullable.padEnd(8);
            console.log(`│ ${name} │ ${type} │ ${length} │ ${defaultVal} │ ${nullable} │`);
        });
        
        console.log('└────────────────┴──────────────┴────────┴─────────────────────────┴──────────┘');
        
        console.log('\n✅ verification_codes 表更新完成！');
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

updateVerificationCodesTable().catch(console.error);