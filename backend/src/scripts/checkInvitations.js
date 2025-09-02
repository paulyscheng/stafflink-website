require('dotenv').config();
const { Client } = require('pg');

async function checkInvitations() {
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
        
        // 检查最新的邀请
        console.log('📋 最新的邀请记录:\n');
        const invitations = await client.query(`
            SELECT 
                i.*,
                w.name as worker_name,
                w.phone as worker_phone,
                p.project_name,
                p.daily_wage,
                p.payment_type,
                p.budget_range
            FROM invitations i
            JOIN workers w ON i.worker_id = w.id
            JOIN projects p ON i.project_id = p.id
            ORDER BY i.created_at DESC
            LIMIT 5;
        `);
        
        if (invitations.rows.length === 0) {
            console.log('没有找到邀请记录');
        } else {
            invitations.rows.forEach((inv, index) => {
                console.log(`邀请 ${index + 1}:`);
                console.log(`  项目: ${inv.project_name}`);
                console.log(`  工人: ${inv.worker_name} (${inv.worker_phone})`);
                console.log(`  状态: ${inv.status}`);
                console.log(`  薪资: ${inv.wage_amount || '未设置'}`);
                console.log(`  项目日薪: ${inv.daily_wage}`);
                console.log(`  支付类型: ${inv.payment_type}`);
                console.log(`  预算范围: ${inv.budget_range}`);
                console.log(`  创建时间: ${inv.created_at}`);
                console.log('---');
            });
        }
        
        // 检查特定工人的邀请
        console.log('\n📱 检查张师傅(13800138001)的邀请:\n');
        const zhangInvitations = await client.query(`
            SELECT 
                i.*,
                p.project_name,
                c.company_name
            FROM invitations i
            JOIN projects p ON i.project_id = p.id
            JOIN companies c ON i.company_id = c.id
            JOIN workers w ON i.worker_id = w.id
            WHERE w.phone = '13800138001'
            ORDER BY i.created_at DESC;
        `);
        
        if (zhangInvitations.rows.length === 0) {
            console.log('张师傅没有收到邀请');
        } else {
            console.log(`张师傅有 ${zhangInvitations.rows.length} 个邀请:`);
            zhangInvitations.rows.forEach((inv, index) => {
                console.log(`\n邀请 ${index + 1}:`);
                console.log(`  ID: ${inv.id}`);
                console.log(`  项目: ${inv.project_name}`);
                console.log(`  公司: ${inv.company_name}`);
                console.log(`  状态: ${inv.status}`);
                console.log(`  薪资: ${inv.wage_amount || '未设置'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

checkInvitations();