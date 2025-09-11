const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function checkZhouWorker() {
  try {
    // 1. Check if 周师傅 exists in the workers table
    console.log('🔍 查询周师傅的账号信息...\n');
    
    const workerResult = await db.query(
      "SELECT * FROM workers WHERE name = '周师傅' OR phone = '13800138008'"
    );
    
    if (workerResult.rows.length === 0) {
      console.log('❌ 周师傅账号不存在！');
      console.log('需要先运行 seedWorkers.js 创建测试工人数据');
      return;
    }
    
    const worker = workerResult.rows[0];
    console.log('✅ 找到周师傅账号:');
    console.log('   ID:', worker.id);
    console.log('   姓名:', worker.name);
    console.log('   手机:', worker.phone);
    console.log('   状态:', worker.status);
    console.log('   评分:', worker.rating);
    
    // 2. Check skills
    console.log('\n📋 查询周师傅的技能...');
    const skillsResult = await db.query(`
      SELECT s.name, ws.proficiency_level 
      FROM worker_skills ws 
      JOIN skills s ON ws.skill_id = s.id 
      WHERE ws.worker_id = $1
      ORDER BY ws.proficiency_level DESC
    `, [worker.id]);
    
    if (skillsResult.rows.length > 0) {
      console.log('技能列表:');
      skillsResult.rows.forEach(skill => {
        console.log(`   - ${skill.name} (熟练度: ${skill.proficiency_level}/5)`);
      });
    } else {
      console.log('   ❌ 没有技能记录');
    }
    
    // 3. Check invitations
    console.log('\n📬 查询周师傅的工作邀请...');
    const invitationsResult = await db.query(`
      SELECT i.*, p.project_name, c.company_name 
      FROM invitations i
      JOIN projects p ON i.project_id = p.id
      JOIN companies c ON p.company_id = c.id
      WHERE i.worker_id = $1
      ORDER BY i.created_at DESC
    `, [worker.id]);
    
    console.log(`邀请总数: ${invitationsResult.rows.length}`);
    
    if (invitationsResult.rows.length > 0) {
      console.log('\n邀请详情:');
      invitationsResult.rows.forEach((inv, index) => {
        console.log(`\n邀请 ${index + 1}:`);
        console.log('   ID:', inv.id);
        console.log('   项目:', inv.project_name);
        console.log('   公司:', inv.company_name);
        console.log('   状态:', inv.status);
        console.log('   工资:', `¥${inv.wage_amount}`);
        console.log('   创建时间:', new Date(inv.created_at).toLocaleString('zh-CN'));
      });
    }
    
    // 4. Check if worker app is using correct login
    console.log('\n💡 提示:');
    console.log('1. 确保在工人端App使用正确的登录信息:');
    console.log(`   手机号: ${worker.phone}`);
    console.log('   验证码: 123456');
    console.log('\n2. 登录后应该能在"工作邀请"页面看到邀请列表');
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    process.exit();
  }
}

checkZhouWorker();