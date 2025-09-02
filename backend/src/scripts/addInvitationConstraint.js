require('dotenv').config();
const { Client } = require('pg');

async function addInvitationConstraint() {
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
        
        // 添加唯一约束
        console.log('➕ 添加唯一约束...');
        try {
            await client.query(`
                ALTER TABLE invitations 
                ADD CONSTRAINT unique_project_worker 
                UNIQUE (project_id, worker_id);
            `);
        } catch (err) {
            if (err.code === '42710') { // duplicate_object
                console.log('   ℹ️  约束已存在');
            } else {
                throw err;
            }
        }
        console.log('   ✅ 约束添加成功\n');
        
        // 显示所有约束
        const constraints = await client.query(`
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_name = 'invitations'
            AND table_schema = 'public';
        `);
        
        console.log('📋 invitations 表的约束:');
        constraints.rows.forEach(con => {
            console.log(`   - ${con.constraint_name} (${con.constraint_type})`);
        });
        
    } catch (error) {
        console.error('❌ 错误:', error.message);
    } finally {
        await client.end();
    }
}

addInvitationConstraint();