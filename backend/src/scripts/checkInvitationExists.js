const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

async function checkInvitation() {
  const invitationId = '24fe9d2e-efc5-46ba-b669-7ca23719249c';
  
  try {
    console.log(`🔍 检查邀请: ${invitationId}\n`);
    
    // 1. 检查邀请是否存在
    const invResult = await pool.query(
      'SELECT * FROM invitations WHERE id = $1',
      [invitationId]
    );
    
    if (invResult.rows.length === 0) {
      console.log('❌ 邀请不存在于数据库中\n');
      
      // 2. 查看最近的邀请
      console.log('📋 最近创建的邀请:');
      const recentInvitations = await pool.query(`
        SELECT 
          i.id,
          i.status,
          w.name as worker_name,
          p.project_name,
          i.created_at
        FROM invitations i
        LEFT JOIN workers w ON i.worker_id = w.id
        LEFT JOIN projects p ON i.project_id = p.id
        ORDER BY i.created_at DESC
        LIMIT 5
      `);
      
      console.table(recentInvitations.rows.map(inv => ({
        ID: inv.id.slice(0, 8) + '...',
        状态: inv.status,
        工人: inv.worker_name,
        项目: inv.project_name,
        创建时间: new Date(inv.created_at).toLocaleString('zh-CN')
      })));
      
      // 3. 查看周师傅的邀请
      console.log('\n📋 周师傅的邀请:');
      const zhouInvitations = await pool.query(`
        SELECT 
          i.id,
          i.status,
          p.project_name,
          c.company_name,
          i.wage_amount,
          i.created_at
        FROM invitations i
        LEFT JOIN workers w ON i.worker_id = w.id
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN companies c ON i.company_id = c.id
        WHERE w.name = '周师傅'
        ORDER BY i.created_at DESC
        LIMIT 5
      `);
      
      if (zhouInvitations.rows.length > 0) {
        console.table(zhouInvitations.rows.map(inv => ({
          ID: inv.id,
          状态: inv.status,
          项目: inv.project_name,
          企业: inv.company_name,
          工资: inv.wage_amount ? `¥${inv.wage_amount}` : 'N/A',
          创建时间: new Date(inv.created_at).toLocaleString('zh-CN')
        })));
      } else {
        console.log('  暂无邀请记录');
      }
      
    } else {
      console.log('✅ 找到邀请:');
      const inv = invResult.rows[0];
      console.log(JSON.stringify(inv, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkInvitation();