require('dotenv').config();
const { Client } = require('pg');

async function loadAllSkills() {
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
        
        // 所有技能数据 - 从schema.sql文件中提取
        const skillsData = [
            // 建筑装修类 (19个)
            ['电工', 'construction', '⚡'],
            ['木工', 'construction', '🔨'],
            ['水管工', 'construction', '🔧'],
            ['泥瓦工', 'construction', '🧱'],
            ['油漆工', 'construction', '🎨'],
            ['焊工', 'construction', '🔥'],
            ['钢筋工', 'construction', '🏗️'],
            ['架子工', 'construction', '🪜'],
            ['防水工', 'construction', '💧'],
            ['装修工', 'construction', '🏠'],
            ['吊顶安装', 'construction', '🏢'],
            ['地板安装', 'construction', '🪵'],
            ['门窗安装', 'construction', '🚪'],
            ['空调安装', 'construction', '❄️'],
            ['水电维修', 'construction', '🔌'],
            ['墙面处理', 'construction', '🧱'],
            ['瓷砖铺贴', 'construction', '🏛️'],
            ['管道疏通', 'construction', '🚿'],
            ['房屋维修', 'construction', '🏚️'],
            
            // 餐饮服务类 (30个)
            ['厨师', 'food_beverage', '👨‍🍳'],
            ['帮厨', 'food_beverage', '👩‍🍳'],
            ['切配', 'food_beverage', '🔪'],
            ['面点师', 'food_beverage', '🥟'],
            ['烧烤师', 'food_beverage', '🍖'],
            ['西餐厨师', 'food_beverage', '🍽️'],
            ['日料厨师', 'food_beverage', '🍱'],
            ['凉菜师', 'food_beverage', '🥗'],
            ['服务员', 'food_beverage', '🍴'],
            ['传菜员', 'food_beverage', '🏃'],
            ['迎宾', 'food_beverage', '👋'],
            ['收银员', 'food_beverage', '💵'],
            ['吧台', 'food_beverage', '🍹'],
            ['咖啡师', 'food_beverage', '☕'],
            ['茶艺师', 'food_beverage', '🍵'],
            ['调酒师', 'food_beverage', '🍸'],
            ['洗碗工', 'food_beverage', '🧽'],
            ['配送员', 'food_beverage', '🚴'],
            ['外卖骑手', 'food_beverage', '🏍️'],
            ['食品加工', 'food_beverage', '🏭'],
            ['营养配餐', 'food_beverage', '🥘'],
            ['快餐制作', 'food_beverage', '🍔'],
            ['饮品制作', 'food_beverage', '🥤'],
            ['甜品师', 'food_beverage', '🍰'],
            ['火锅服务', 'food_beverage', '🍲'],
            ['自助餐服务', 'food_beverage', '🍽️'],
            ['宴会服务', 'food_beverage', '🎉'],
            ['客房送餐', 'food_beverage', '🛎️'],
            ['食堂帮工', 'food_beverage', '🍜'],
            ['餐具管理', 'food_beverage', '🥄'],
            
            // 制造业类 (30个)
            ['普工', 'manufacturing', '👷'],
            ['操作工', 'manufacturing', '🏭'],
            ['包装工', 'manufacturing', '📦'],
            ['质检员', 'manufacturing', '🔍'],
            ['组装工', 'manufacturing', '🔧'],
            ['机修工', 'manufacturing', '🔨'],
            ['电工', 'manufacturing', '⚡'],
            ['焊工', 'manufacturing', '🔥'],
            ['钳工', 'manufacturing', '🔧'],
            ['车工', 'manufacturing', '🔩'],
            ['铣工', 'manufacturing', '⚙️'],
            ['磨工', 'manufacturing', '🛠️'],
            ['注塑工', 'manufacturing', '🏭'],
            ['冲压工', 'manufacturing', '🔨'],
            ['喷漆工', 'manufacturing', '🎨'],
            ['电镀工', 'manufacturing', '⚡'],
            ['缝纫工', 'manufacturing', '🧵'],
            ['裁剪工', 'manufacturing', '✂️'],
            ['印刷工', 'manufacturing', '🖨️'],
            ['装订工', 'manufacturing', '📚'],
            ['木工', 'manufacturing', '🪵'],
            ['油漆工', 'manufacturing', '🖌️'],
            ['抛光工', 'manufacturing', '✨'],
            ['打磨工', 'manufacturing', '🔧'],
            ['贴标工', 'manufacturing', '🏷️'],
            ['分拣工', 'manufacturing', '📊'],
            ['理货员', 'manufacturing', '📋'],
            ['设备操作', 'manufacturing', '🖥️'],
            ['流水线工', 'manufacturing', '🏭'],
            ['产品测试', 'manufacturing', '🧪'],
            
            // 物流运输类 (32个)
            ['货车司机', 'logistics', '🚚'],
            ['叉车司机', 'logistics', '🚜'],
            ['快递员', 'logistics', '📦'],
            ['分拣员', 'logistics', '📊'],
            ['仓管员', 'logistics', '🏪'],
            ['理货员', 'logistics', '📋'],
            ['装卸工', 'logistics', '💪'],
            ['打包员', 'logistics', '📦'],
            ['配送员', 'logistics', '🚴'],
            ['跟车员', 'logistics', '🚛'],
            ['调度员', 'logistics', '📍'],
            ['司机助理', 'logistics', '🚗'],
            ['货运代理', 'logistics', '🚢'],
            ['报关员', 'logistics', '📄'],
            ['单证员', 'logistics', '📑'],
            ['验货员', 'logistics', '✅'],
            ['物流专员', 'logistics', '🚚'],
            ['库房管理', 'logistics', '🏭'],
            ['冷链配送', 'logistics', '❄️'],
            ['危险品运输', 'logistics', '⚠️'],
            ['搬家工', 'logistics', '🏠'],
            ['行李员', 'logistics', '🧳'],
            ['邮政投递', 'logistics', '✉️'],
            ['机场地勤', 'logistics', '✈️'],
            ['码头工人', 'logistics', '⚓'],
            ['铁路货运', 'logistics', '🚂'],
            ['集装箱操作', 'logistics', '📦'],
            ['货物包装', 'logistics', '📦'],
            ['物流信息', 'logistics', '💻'],
            ['运输调度', 'logistics', '🗺️'],
            ['装载机操作', 'logistics', '🚜'],
            ['起重机操作', 'logistics', '🏗️'],
            
            // 通用服务类 (32个)
            ['保洁员', 'general_services', '🧹'],
            ['保安员', 'general_services', '👮'],
            ['绿化工', 'general_services', '🌿'],
            ['物业维修', 'general_services', '🔧'],
            ['电梯工', 'general_services', '🛗'],
            ['停车管理', 'general_services', '🚗'],
            ['门卫', 'general_services', '🚪'],
            ['巡逻员', 'general_services', '🚶'],
            ['消防员', 'general_services', '🚒'],
            ['护工', 'general_services', '👩‍⚕️'],
            ['月嫂', 'general_services', '👶'],
            ['保姆', 'general_services', '🏠'],
            ['钟点工', 'general_services', '⏰'],
            ['洗衣工', 'general_services', '👔'],
            ['熨烫工', 'general_services', '👕'],
            ['缝补工', 'general_services', '🧵'],
            ['擦鞋工', 'general_services', '👞'],
            ['洗车工', 'general_services', '🚗'],
            ['美容师', 'general_services', '💆'],
            ['理发师', 'general_services', '💇'],
            ['按摩师', 'general_services', '🤲'],
            ['足疗师', 'general_services', '🦶'],
            ['搓澡工', 'general_services', '🧼'],
            ['游泳教练', 'general_services', '🏊'],
            ['健身教练', 'general_services', '💪'],
            ['家政服务', 'general_services', '🏠'],
            ['管道疏通', 'general_services', '🚿'],
            ['开锁服务', 'general_services', '🔓'],
            ['家电维修', 'general_services', '🔌'],
            ['手机维修', 'general_services', '📱'],
            ['电脑维修', 'general_services', '💻'],
            ['礼仪服务', 'general_services', '🎩']
        ];
        
        console.log(`📋 准备插入 ${skillsData.length} 个技能\n`);
        
        let successCount = 0;
        let skipCount = 0;
        
        for (const [name, category, icon] of skillsData) {
            try {
                await client.query(
                    'INSERT INTO skills (name, category, icon) VALUES ($1, $2, $3)',
                    [name, category, icon]
                );
                successCount++;
            } catch (err) {
                if (err.code === '23505') {
                    skipCount++;
                } else {
                    console.error(`❌ 插入 "${name}" 失败: ${err.message}`);
                }
            }
        }
        
        console.log(`\n✅ 完成！成功插入 ${successCount} 个，跳过 ${skipCount} 个\n`);
        
        // 显示统计
        const stats = await client.query(`
            SELECT category, COUNT(*) as count 
            FROM skills 
            GROUP BY category 
            ORDER BY category;
        `);
        
        console.log('📊 技能分类统计:');
        stats.rows.forEach(row => {
            console.log(`   ${row.category}: ${row.count} 个技能`);
        });
        
        const total = await client.query('SELECT COUNT(*) as count FROM skills');
        console.log(`\n   总计: ${total.rows[0].count} 个技能`);
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

loadAllSkills();