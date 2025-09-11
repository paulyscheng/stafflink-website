const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function testWorkerInvitations() {
  try {
    console.log('🔍 测试周师傅的邀请数据...\n');
    
    // 1. 查找周师傅
    console.log('1️⃣ 查找周师傅账号...');
    const workerResult = await db.query(
      "SELECT * FROM workers WHERE phone = '13800138008'"
    );
    
    if (workerResult.rows.length === 0) {
      console.log('❌ 未找到周师傅账号');
      return;
    }
    
    const worker = workerResult.rows[0];
    console.log('✅ 找到周师傅账号:');
    console.log(`   ID: ${worker.id}`);
    console.log(`   姓名: ${worker.name}`);
    console.log(`   手机: ${worker.phone}`);
    
    // 2. 查询邀请
    console.log('\n2️⃣ 查询周师傅的邀请...');
    const invitationsQuery = `
      SELECT 
        i.*,
        c.company_name,
        c.phone as company_phone,
        p.project_name,
        p.project_address,
        p.project_type,
        p.start_date,
        p.end_date,
        p.work_description,
        -- 获取项目技能
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'skill_id', s.id,
              'skill_name', s.name,
              'skill_category', s.category
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) as required_skills
      FROM invitations i
      JOIN companies c ON i.company_id = c.id
      JOIN projects p ON i.project_id = p.id
      LEFT JOIN project_skills ps ON ps.project_id = p.id
      LEFT JOIN skills s ON s.id = ps.skill_id
      WHERE i.worker_id = $1
      GROUP BY i.id, i.project_id, i.company_id, i.worker_id, i.status, 
               i.wage_amount, i.original_wage, i.wage_unit,
               i.created_at, i.invited_at, i.responded_at, i.response_note,
               i.start_date, i.end_date,
               c.company_name, c.phone,
               p.project_name, p.project_address, p.project_type, p.start_date, 
               p.end_date, p.work_description
      ORDER BY i.invited_at DESC
    `;
    
    const invitations = await db.query(invitationsQuery, [worker.id]);
    console.log(`✅ 找到 ${invitations.rows.length} 个邀请`);
    
    // 3. 显示邀请详情
    if (invitations.rows.length > 0) {
      console.log('\n3️⃣ 邀请详情:');
      invitations.rows.forEach((inv, index) => {
        console.log(`\n邀请 ${index + 1}:`);
        console.log(`   项目名称: ${inv.project_name}`);
        console.log(`   公司名称: ${inv.company_name}`);
        console.log(`   工资: ¥${inv.wage_amount} / ${inv.wage_unit || 'hour'}`);
        console.log(`   状态: ${inv.status}`);
        console.log(`   邀请时间: ${inv.invited_at}`);
        console.log(`   技能要求: ${inv.required_skills.map(s => s.skill_name).join(', ') || '无'}`);
      });
    }
    
    // 4. 测试API响应格式
    console.log('\n4️⃣ 测试API响应格式...');
    if (invitations.rows.length > 0) {
      const inv = invitations.rows[0];
      const apiFormat = {
        id: inv.id,
        projectName: inv.project_name,
        companyName: inv.company_name,
        wageOffer: inv.wage_amount || inv.original_wage,
        requiredSkills: inv.required_skills ? inv.required_skills.map(s => s.skill_name) : [],
        status: inv.status
      };
      console.log('API格式示例:');
      console.log(JSON.stringify(apiFormat, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

testWorkerInvitations();