require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixProjectController() {
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
        
        // 获取所有技能
        const result = await client.query('SELECT id, name FROM skills ORDER BY id;');
        
        // 创建名称到ID的映射
        const nameToId = {};
        result.rows.forEach(skill => {
            nameToId[skill.name] = skill.id;
        });
        
        // 读取控制器文件
        const controllerPath = path.join(__dirname, '../controllers/projectController.js');
        let content = fs.readFileSync(controllerPath, 'utf8');
        
        // 需要更新的映射
        const updates = [
            { old: "'electrician': 79", new: `'electrician': ${nameToId['电工']}` },
            { old: "'carpenter': 76", new: `'carpenter': ${nameToId['木工']}` },
            { old: "'plumber': 93", new: `'plumber': ${nameToId['水管工']}` },
            { old: "'painter': 77", new: `'painter': ${nameToId['油漆工']}` },
            { old: "'mason': 89", new: `'mason': ${nameToId['泥瓦工']}` },
            { old: "'welder': 80", new: `'welder': ${nameToId['焊工']}` },
            { old: "'chef': 103", new: `'chef': ${nameToId['厨师']}` },
            { old: "'waiter': 101", new: `'waiter': ${nameToId['服务员']}` },
            { old: "'cashier': 102", new: `'cashier': ${nameToId['收银员']}` },
            { old: "'generalWorker': 82", new: `'generalWorker': ${nameToId['普工']}` },
            { old: "'securityGuard': 132", new: `'securityGuard': ${nameToId['保安员']}` },
            { old: "'housekeeper': 134", new: `'housekeeper': ${nameToId['家政服务']}` },
        ];
        
        console.log('📝 更新映射:\n');
        updates.forEach(update => {
            if (content.includes(update.old)) {
                content = content.replace(update.old, update.new);
                console.log(`✅ ${update.old} → ${update.new}`);
            }
        });
        
        // 写回文件
        fs.writeFileSync(controllerPath, content);
        console.log('\n✅ 文件更新完成！');
        
        // 显示关键映射
        console.log('\n🔍 关键技能ID:');
        ['保洁员', '电工', '木工', '水管工', '厨师', '服务员', '普工', '保安员', '家政服务'].forEach(name => {
            console.log(`  ${name}: ${nameToId[name]}`);
        });
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

fixProjectController();