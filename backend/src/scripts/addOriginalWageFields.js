require('dotenv').config();
const { Client } = require('pg');

async function addOriginalWageFields() {
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
        
        // 1. 添加原始薪资字段到 projects 表
        console.log('📊 更新 projects 表结构...');
        
        // 添加 original_wage 字段（存储用户输入的原始薪资）
        await client.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS original_wage DECIMAL(10,2);
        `);
        console.log('   ✅ 添加 original_wage 列');
        
        // 添加 wage_unit 字段（存储薪资单位：hour/day/total）
        await client.query(`
            ALTER TABLE projects 
            ADD COLUMN IF NOT EXISTS wage_unit VARCHAR(20) DEFAULT 'day';
        `);
        console.log('   ✅ 添加 wage_unit 列');
        
        // 2. 更新现有数据
        console.log('\n📝 更新现有项目数据...');
        
        // 对于时薪项目，从daily_wage反推original_wage
        await client.query(`
            UPDATE projects 
            SET original_wage = CASE 
                WHEN payment_type = 'hourly' THEN daily_wage / 8
                WHEN payment_type = 'daily' THEN daily_wage
                WHEN payment_type = 'fixed' THEN daily_wage * COALESCE(estimated_duration, 1)
                ELSE daily_wage
            END,
            wage_unit = CASE
                WHEN payment_type = 'hourly' THEN 'hour'
                WHEN payment_type = 'daily' THEN 'day'
                WHEN payment_type = 'fixed' THEN 'total'
                ELSE 'day'
            END
            WHERE original_wage IS NULL;
        `);
        console.log('   ✅ 更新现有数据');
        
        // 3. 同样更新 invitations 表
        console.log('\n📊 更新 invitations 表结构...');
        
        await client.query(`
            ALTER TABLE invitations 
            ADD COLUMN IF NOT EXISTS original_wage DECIMAL(10,2);
        `);
        console.log('   ✅ 添加 original_wage 列');
        
        await client.query(`
            ALTER TABLE invitations 
            ADD COLUMN IF NOT EXISTS wage_unit VARCHAR(20) DEFAULT 'day';
        `);
        console.log('   ✅ 添加 wage_unit 列');
        
        // 从关联的项目更新邀请的薪资信息
        await client.query(`
            UPDATE invitations i
            SET 
                original_wage = p.original_wage,
                wage_unit = p.wage_unit
            FROM projects p
            WHERE i.project_id = p.id
            AND i.original_wage IS NULL;
        `);
        console.log('   ✅ 更新邀请数据');
        
        // 4. 显示更新后的表结构
        console.log('\n📋 更新后的表结构:');
        
        const projectColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'projects' 
            AND column_name IN ('daily_wage', 'original_wage', 'wage_unit', 'payment_type', 'budget_range')
            ORDER BY column_name;
        `);
        
        console.log('\nprojects 表薪资相关字段:');
        projectColumns.rows.forEach(col => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });
        
        // 5. 创建视图以便于查询
        console.log('\n🔍 创建薪资显示视图...');
        
        await client.query(`
            CREATE OR REPLACE VIEW project_wage_display AS
            SELECT 
                id,
                project_name,
                payment_type,
                original_wage,
                wage_unit,
                daily_wage,
                CASE 
                    WHEN wage_unit = 'hour' THEN original_wage || '元/小时'
                    WHEN wage_unit = 'day' THEN original_wage || '元/天'
                    WHEN wage_unit = 'total' THEN original_wage || '元(总价)'
                    ELSE daily_wage || '元/天'
                END as wage_display,
                CASE 
                    WHEN wage_unit = 'hour' THEN '日薪: ' || daily_wage || '元 (按8小时计)'
                    ELSE ''
                END as wage_note
            FROM projects;
        `);
        console.log('   ✅ 创建薪资显示视图');
        
        console.log('\n✅ 数据库更新完成！');
        console.log('\n💡 使用说明:');
        console.log('   - original_wage: 存储用户输入的原始薪资数值');
        console.log('   - wage_unit: 薪资单位 (hour/day/total)');
        console.log('   - daily_wage: 计算后的日薪（用于统一比较和计算）');
        console.log('   - project_wage_display 视图: 提供格式化的薪资显示');
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
        throw error;
    } finally {
        await client.end();
    }
}

addOriginalWageFields().catch(console.error);