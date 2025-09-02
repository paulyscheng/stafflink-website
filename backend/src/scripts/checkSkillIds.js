require('dotenv').config();
const { Client } = require('pg');

async function checkSkillIds() {
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
        
        // 检查技能ID范围
        const result = await client.query(`
            SELECT 
                MIN(id) as min_id, 
                MAX(id) as max_id, 
                COUNT(*) as total_skills
            FROM skills;
        `);
        
        console.log('📊 技能ID统计:');
        console.log(`   最小ID: ${result.rows[0].min_id}`);
        console.log(`   最大ID: ${result.rows[0].max_id}`);
        console.log(`   总数: ${result.rows[0].total_skills}\n`);
        
        // 查看保洁相关的技能
        const cleaningSkills = await client.query(`
            SELECT id, name, category 
            FROM skills 
            WHERE name LIKE '%保洁%' 
               OR name LIKE '%清洁%' 
               OR name LIKE '%打扫%'
               OR name LIKE '%cleaning%'
               OR category = 'general_services'
            ORDER BY id;
        `);
        
        console.log('🧹 保洁相关技能:');
        cleaningSkills.rows.forEach(skill => {
            console.log(`   ID ${skill.id}: ${skill.name} (${skill.category})`);
        });
        
        // 检查ID 124 附近的技能
        console.log('\n🔍 ID 120-130 范围的技能:');
        const nearbySkills = await client.query(`
            SELECT id, name, category 
            FROM skills 
            WHERE id BETWEEN 120 AND 130
            ORDER BY id;
        `);
        
        if (nearbySkills.rows.length === 0) {
            console.log('   没有找到这个范围的技能');
        } else {
            nearbySkills.rows.forEach(skill => {
                console.log(`   ID ${skill.id}: ${skill.name} (${skill.category})`);
            });
        }
        
        // 显示所有通用服务类技能
        console.log('\n📋 所有通用服务类技能:');
        const generalSkills = await client.query(`
            SELECT id, name 
            FROM skills 
            WHERE category = 'general_services'
            ORDER BY id
            LIMIT 10;
        `);
        
        generalSkills.rows.forEach(skill => {
            console.log(`   ID ${skill.id}: ${skill.name}`);
        });
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

checkSkillIds();