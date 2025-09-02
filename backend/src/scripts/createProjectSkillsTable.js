require('dotenv').config();
const { Client } = require('pg');

async function createProjectSkillsTable() {
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
        
        console.log('🔧 创建 project_skills 表...\n');
        
        // 创建 project_skills 表
        await client.query(`
            CREATE TABLE IF NOT EXISTS project_skills (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                skill_id INTEGER NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
                required_level INTEGER DEFAULT 1,
                is_mandatory BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, skill_id)
            );
        `);
        console.log('   ✅ project_skills 表创建成功');
        
        // 创建索引
        console.log('\n🔍 创建索引...');
        await client.query('CREATE INDEX IF NOT EXISTS idx_project_skills_project ON project_skills(project_id);');
        await client.query('CREATE INDEX IF NOT EXISTS idx_project_skills_skill ON project_skills(skill_id);');
        console.log('   ✅ 索引创建完成');
        
        // 显示表结构
        console.log('\n📊 project_skills 表结构:');
        const columns = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_name = 'project_skills' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n┌─────────────────┬──────────────┬──────────┬──────────────────────────┐');
        console.log('│ 列名            │ 数据类型     │ 可空     │ 默认值                   │');
        console.log('├─────────────────┼──────────────┼──────────┼──────────────────────────┤');
        
        columns.rows.forEach(col => {
            const name = col.column_name.padEnd(15);
            const type = col.data_type.padEnd(12);
            const nullable = col.is_nullable.padEnd(8);
            const defaultVal = (col.column_default || '-').toString().substring(0, 24).padEnd(24);
            console.log(`│ ${name} │ ${type} │ ${nullable} │ ${defaultVal} │`);
        });
        
        console.log('└─────────────────┴──────────────┴──────────┴──────────────────────────┘');
        
        console.log('\n✅ project_skills 表创建完成！');
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

createProjectSkillsTable().catch(console.error);