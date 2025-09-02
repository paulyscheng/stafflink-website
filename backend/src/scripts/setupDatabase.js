require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
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
        
        // 1. 创建扩展
        console.log('1️⃣ 创建UUID扩展...');
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
        console.log('   ✅ 扩展创建成功\n');
        
        // 2. 创建所有表
        console.log('2️⃣ 创建数据库表...');
        
        // Companies表
        await client.query(`
            CREATE TABLE IF NOT EXISTS companies (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                company_name VARCHAR(255) NOT NULL,
                contact_person VARCHAR(100) NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                email VARCHAR(255),
                address TEXT,
                business_license VARCHAR(100),
                rating DECIMAL(2,1) DEFAULT 0.0,
                total_projects INTEGER DEFAULT 0,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ companies 表');
        
        // Workers表
        await client.query(`
            CREATE TABLE IF NOT EXISTS workers (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                id_card VARCHAR(20),
                age INTEGER,
                gender VARCHAR(10),
                address TEXT,
                rating DECIMAL(2,1) DEFAULT 0.0,
                total_jobs INTEGER DEFAULT 0,
                completed_jobs INTEGER DEFAULT 0,
                total_earnings DECIMAL(10,2) DEFAULT 0.00,
                status VARCHAR(20) DEFAULT 'offline',
                experience_years INTEGER DEFAULT 0,
                profile_photo VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ workers 表');
        
        // Skills表
        await client.query(`
            CREATE TABLE IF NOT EXISTS skills (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                category VARCHAR(50) NOT NULL,
                icon VARCHAR(10),
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('   ✅ skills 表');
        
        // 其他表...
        const otherTables = [
            {
                name: 'worker_skills',
                sql: `CREATE TABLE IF NOT EXISTS worker_skills (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
                    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
                    proficiency_level INTEGER DEFAULT 1,
                    years_experience INTEGER DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(worker_id, skill_id)
                );`
            },
            {
                name: 'projects',
                sql: `CREATE TABLE IF NOT EXISTS projects (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    location TEXT NOT NULL,
                    latitude DECIMAL(10,8),
                    longitude DECIMAL(11,8),
                    start_date DATE NOT NULL,
                    end_date DATE,
                    daily_wage DECIMAL(10,2) NOT NULL,
                    required_workers INTEGER NOT NULL,
                    hired_workers INTEGER DEFAULT 0,
                    work_hours VARCHAR(100),
                    work_type VARCHAR(50),
                    urgency_level VARCHAR(20) DEFAULT 'normal',
                    status VARCHAR(20) DEFAULT 'draft',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`
            },
            {
                name: 'invitations',
                sql: `CREATE TABLE IF NOT EXISTS invitations (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
                    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    status VARCHAR(20) DEFAULT 'pending',
                    invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    responded_at TIMESTAMP,
                    response_note TEXT,
                    wage_amount DECIMAL(10,2),
                    start_date DATE,
                    end_date DATE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`
            },
            {
                name: 'job_records',
                sql: `CREATE TABLE IF NOT EXISTS job_records (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
                    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
                    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                    invitation_id UUID REFERENCES invitations(id),
                    start_date TIMESTAMP NOT NULL,
                    end_date TIMESTAMP,
                    actual_hours DECIMAL(5,2),
                    wage_amount DECIMAL(10,2),
                    status VARCHAR(20) DEFAULT 'active',
                    worker_confirmed BOOLEAN DEFAULT FALSE,
                    company_confirmed BOOLEAN DEFAULT FALSE,
                    payment_status VARCHAR(20) DEFAULT 'pending',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`
            },
            {
                name: 'notifications',
                sql: `CREATE TABLE IF NOT EXISTS notifications (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    user_id UUID NOT NULL,
                    user_type VARCHAR(20) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    data JSONB,
                    read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`
            }
        ];
        
        for (const table of otherTables) {
            await client.query(table.sql);
            console.log(`   ✅ ${table.name} 表`);
        }
        
        // 3. 插入技能数据
        console.log('\n3️⃣ 插入技能数据...');
        
        // 检查是否已有数据
        const skillCount = await client.query('SELECT COUNT(*) as count FROM skills');
        
        if (skillCount.rows[0].count == 0) {
            // 读取并执行技能插入语句
            const schemaPath = path.join(__dirname, '../../../database/schema.sql');
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            
            // 提取所有技能插入语句
            const skillInserts = schemaSql.match(/INSERT INTO skills[\s\S]*?;/g);
            
            if (skillInserts) {
                for (const insert of skillInserts) {
                    try {
                        await client.query(insert);
                    } catch (err) {
                        if (err.code === '23505') {
                            // 忽略重复键错误
                            continue;
                        }
                        throw err;
                    }
                }
            }
            
            const finalCount = await client.query('SELECT COUNT(*) as count FROM skills');
            console.log(`   ✅ 插入了 ${finalCount.rows[0].count} 个技能\n`);
        } else {
            console.log(`   ℹ️  技能数据已存在 (${skillCount.rows[0].count} 个)\n`);
        }
        
        // 4. 创建索引
        console.log('4️⃣ 创建索引...');
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_companies_phone ON companies(phone);',
            'CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);',
            'CREATE INDEX IF NOT EXISTS idx_workers_phone ON workers(phone);',
            'CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);',
            'CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);',
            'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);',
            'CREATE INDEX IF NOT EXISTS idx_invitations_worker ON invitations(worker_id);',
            'CREATE INDEX IF NOT EXISTS idx_invitations_project ON invitations(project_id);',
            'CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, user_type);'
        ];
        
        for (const idx of indexes) {
            await client.query(idx);
        }
        console.log('   ✅ 索引创建完成\n');
        
        // 5. 显示最终结果
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename;
        `);
        
        console.log(`✅ 数据库设置完成！\n`);
        console.log(`📊 创建的表 (共 ${tablesResult.rows.length} 个):`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.tablename}`);
        });
        
    } catch (error) {
        console.error('\n❌ 设置失败:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

setupDatabase().catch(console.error);