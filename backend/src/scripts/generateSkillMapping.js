require('dotenv').config();
const { Client } = require('pg');

async function generateSkillMapping() {
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
        
        // 获取所有技能
        const result = await client.query(`
            SELECT id, name, category 
            FROM skills 
            ORDER BY category, id;
        `);
        
        console.log('📋 生成技能映射:\n');
        console.log('const skillIdMapping = {');
        
        const categoryNames = {
            'construction': '建筑装修',
            'food_beverage': '餐饮服务',
            'manufacturing': '制造业',
            'logistics': '物流运输',
            'general_services': '通用服务'
        };
        
        let currentCategory = '';
        
        result.rows.forEach(skill => {
            if (skill.category !== currentCategory) {
                currentCategory = skill.category;
                console.log(`\n  // ${categoryNames[skill.category] || skill.category}`);
            }
            
            // 生成英文键名（简化版）
            let key = skill.name
                .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '') // 移除特殊字符
                .replace(/员$/g, 'Worker')
                .replace(/工$/g, 'Worker')
                .replace(/师$/g, 'Master');
            
            // 特殊映射
            const specialMappings = {
                '电工': 'electrician',
                '木工': 'carpenter',
                '水管工': 'plumber',
                '泥瓦工': 'mason',
                '油漆工': 'painter',
                '焊工': 'welder',
                '保洁员': 'cleaner',
                '保安员': 'securityGuard',
                '厨师': 'chef',
                '服务员': 'waiter',
                '收银员': 'cashier',
                '司机': 'driver',
                '搬运工': 'mover',
                '装卸工': 'loader',
                '普工': 'generalWorker',
                '家政服务': 'housekeeper'
            };
            
            if (specialMappings[skill.name]) {
                key = specialMappings[skill.name];
            }
            
            console.log(`  '${key}': ${skill.id}, // ${skill.name}`);
        });
        
        console.log('};\n');
        
        // 显示保洁相关的映射
        console.log('🧹 保洁相关技能映射:');
        const cleaningSkills = result.rows.filter(s => 
            s.name.includes('保洁') || 
            s.name.includes('清洁') || 
            s.name.includes('家政')
        );
        
        cleaningSkills.forEach(skill => {
            console.log(`  ${skill.name}: ID ${skill.id}`);
        });
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

generateSkillMapping();