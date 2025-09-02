require('dotenv').config();
const { Client } = require('pg');

async function fixProjectsCompatibility() {
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
        
        console.log('🔧 添加兼容性列到 projects 表...\n');
        
        // 添加缺失的列（如果不存在）
        const columnsToAdd = [
            // 映射到现有列的别名
            { name: 'project_name', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);' },
            { name: 'project_address', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_address TEXT;' },
            { name: 'project_type', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type VARCHAR(50);' },
            { name: 'priority', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT \'normal\';' },
            { name: 'work_description', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_description TEXT;' },
            { name: 'experience_level', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) DEFAULT \'intermediate\';' },
            { name: 'time_nature', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS time_nature VARCHAR(50);' },
            { name: 'start_time', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_time TIME;' },
            { name: 'end_time', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_time TIME;' },
            { name: 'working_days', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS working_days JSONB;' },
            { name: 'time_notes', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS time_notes TEXT;' },
            { name: 'payment_type', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT \'daily\';' },
            { name: 'budget_range', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget_range VARCHAR(100);' },
            { name: 'estimated_duration', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;' },
            { name: 'selected_workers', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS selected_workers JSONB DEFAULT \'[]\';' },
            { name: 'notification_methods', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS notification_methods JSONB DEFAULT \'[]\';' },
            { name: 'urgency', sql: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS urgency VARCHAR(20);' }
        ];
        
        for (const col of columnsToAdd) {
            try {
                await client.query(col.sql);
                console.log(`   ✅ 添加列: ${col.name}`);
            } catch (err) {
                if (err.code === '42701') { // column already exists
                    console.log(`   ℹ️  列已存在: ${col.name}`);
                } else {
                    console.error(`   ❌ 错误添加列 ${col.name}: ${err.message}`);
                }
            }
        }
        
        // 同步数据（从旧列到新列）
        console.log('\n📋 同步数据...');
        
        await client.query(`
            UPDATE projects SET
                project_name = COALESCE(project_name, title),
                project_address = COALESCE(project_address, location),
                project_type = COALESCE(project_type, work_type),
                priority = COALESCE(priority, urgency_level),
                work_description = COALESCE(work_description, description),
                budget_range = COALESCE(budget_range, daily_wage::text),
                urgency = COALESCE(urgency, urgency_level)
            WHERE project_name IS NULL OR project_address IS NULL
        `);
        console.log('   ✅ 数据同步完成');
        
        // 创建触发器以保持数据同步
        console.log('\n🔄 创建同步触发器...');
        
        await client.query(`
            CREATE OR REPLACE FUNCTION sync_project_columns()
            RETURNS TRIGGER AS $$
            BEGIN
                -- 同步到兼容性列
                IF NEW.title IS NOT NULL THEN
                    NEW.project_name = NEW.title;
                END IF;
                IF NEW.location IS NOT NULL THEN
                    NEW.project_address = NEW.location;
                END IF;
                IF NEW.work_type IS NOT NULL THEN
                    NEW.project_type = NEW.work_type;
                END IF;
                IF NEW.urgency_level IS NOT NULL THEN
                    NEW.priority = NEW.urgency_level;
                    NEW.urgency = NEW.urgency_level;
                END IF;
                IF NEW.description IS NOT NULL THEN
                    NEW.work_description = NEW.description;
                END IF;
                IF NEW.daily_wage IS NOT NULL THEN
                    NEW.budget_range = NEW.daily_wage::text;
                END IF;
                
                -- 反向同步（从兼容性列到原始列）
                IF NEW.project_name IS NOT NULL AND NEW.title IS NULL THEN
                    NEW.title = NEW.project_name;
                END IF;
                IF NEW.project_address IS NOT NULL AND NEW.location IS NULL THEN
                    NEW.location = NEW.project_address;
                END IF;
                IF NEW.project_type IS NOT NULL AND NEW.work_type IS NULL THEN
                    NEW.work_type = NEW.project_type;
                END IF;
                IF NEW.priority IS NOT NULL AND NEW.urgency_level IS NULL THEN
                    NEW.urgency_level = NEW.priority;
                END IF;
                IF NEW.work_description IS NOT NULL AND NEW.description IS NULL THEN
                    NEW.description = NEW.work_description;
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        
        await client.query(`
            DROP TRIGGER IF EXISTS sync_project_columns_trigger ON projects;
            CREATE TRIGGER sync_project_columns_trigger 
            BEFORE INSERT OR UPDATE ON projects 
            FOR EACH ROW 
            EXECUTE FUNCTION sync_project_columns();
        `);
        
        console.log('   ✅ 触发器创建完成');
        
        // 显示最终的表结构
        console.log('\n📊 更新后的表结构:');
        const columns = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log('\n列名列表:');
        columns.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        console.log('\n✅ 项目表兼容性修复完成！');
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

fixProjectsCompatibility().catch(console.error);