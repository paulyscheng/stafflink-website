const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function checkWageFields() {
  try {
    console.log('🔍 检查工资字段映射问题...\n');
    
    // 1. 检查特定邀请的数据
    console.log('1️⃣ 检查腾讯数据标注项目的邀请数据...');
    const invitationData = await db.query(`
      SELECT 
        i.id,
        i.wage_amount as inv_wage_amount,
        i.wage_unit as inv_wage_unit,
        i.original_wage as inv_original_wage,
        p.project_name,
        p.budget_range,
        p.original_wage as proj_original_wage,
        p.wage_unit as proj_wage_unit,
        p.payment_type as proj_payment_type,
        p.start_time,
        p.end_time,
        c.contact_person,
        c.phone as company_phone,
        c.rating as company_rating
      FROM invitations i
      JOIN projects p ON i.project_id = p.id
      JOIN companies c ON i.company_id = c.id
      WHERE i.id = 'd7c09652-42d0-4271-9464-7144a258a253'
    `);
    
    if (invitationData.rows.length > 0) {
      const data = invitationData.rows[0];
      console.log('✅ 找到邀请数据:');
      console.log(`   项目名称: ${data.project_name}`);
      console.log(`   邀请工资: ¥${data.inv_wage_amount} / ${data.inv_wage_unit || 'hour'}`);
      console.log(`   邀请original_wage: ${data.inv_original_wage || 'NULL'}`);
      console.log(`   项目budget_range: ${data.budget_range || 'NULL'}`);
      console.log(`   项目original_wage: ${data.proj_original_wage || 'NULL'}`);
      console.log(`   项目payment_type: ${data.proj_payment_type || 'NULL'}`);
      console.log(`   开始时间: ${data.start_time || 'NULL'}`);
      console.log(`   结束时间: ${data.end_time || 'NULL'}`);
      console.log(`   联系人: ${data.contact_person}`);
      console.log(`   公司电话: ${data.company_phone}`);
      console.log(`   公司评分: ${data.company_rating || 'NULL'}`);
    }
    
    // 2. 检查技能数据
    console.log('\n2️⃣ 检查技能数据...');
    const skillsData = await db.query(`
      SELECT 
        s.name as skill_name,
        s.category
      FROM invitations i
      JOIN project_skills ps ON ps.project_id = i.project_id
      JOIN skills s ON s.id = ps.skill_id
      WHERE i.id = 'd7c09652-42d0-4271-9464-7144a258a253'
    `);
    
    console.log(`✅ 找到 ${skillsData.rows.length} 个技能:`);
    skillsData.rows.forEach(skill => {
      console.log(`   - ${skill.skill_name} (${skill.category})`);
    });
    
    // 3. 分析问题
    console.log('\n3️⃣ 问题分析:');
    console.log('🔍 前端显示的数据:');
    console.log('   budgetRange: "60.00" ❌');
    console.log('   wageOffer: "480.00" ✅');
    console.log('   requiredSkills: [] ❌');
    console.log('   startTime: undefined ❌');
    console.log('   companyRating: "0.0" ❓');
    
    // 4. 检查API返回的原始数据
    console.log('\n4️⃣ 模拟API返回数据...');
    const apiQuery = `
      SELECT 
        i.*,
        c.company_name,
        c.contact_person,
        c.phone as company_phone,
        c.rating as company_rating,
        p.project_name,
        p.project_address,
        p.project_type,
        p.start_date,
        p.end_date,
        p.start_time,
        p.end_time,
        p.budget_range,
        p.work_description,
        p.original_wage,
        p.wage_unit,
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
      WHERE i.id = 'd7c09652-42d0-4271-9464-7144a258a253'
      GROUP BY i.id, i.project_id, i.company_id, i.worker_id, i.status, 
               i.wage_amount, i.original_wage, i.wage_unit,
               i.created_at, i.invited_at, i.responded_at, i.response_note,
               i.start_date, i.end_date,
               c.company_name, c.contact_person, c.phone, c.rating,
               p.project_name, p.project_address, p.project_type, p.start_date, 
               p.end_date, p.start_time, p.end_time, p.budget_range, 
               p.work_description, p.original_wage, p.wage_unit
    `;
    
    const apiData = await db.query(apiQuery);
    if (apiData.rows.length > 0) {
      const row = apiData.rows[0];
      console.log('API返回的关键字段:');
      console.log(`   wage_amount: ${row.wage_amount}`);
      console.log(`   original_wage (invitation): ${row.original_wage || 'NULL'}`);
      console.log(`   original_wage (project): ${row.original_wage || 'NULL'}`);
      console.log(`   budget_range: ${row.budget_range || 'NULL'}`);
      console.log(`   required_skills: ${JSON.stringify(row.required_skills)}`);
      console.log(`   start_time: ${row.start_time || 'NULL'}`);
      console.log(`   end_time: ${row.end_time || 'NULL'}`);
      console.log(`   company_rating: ${row.company_rating || 'NULL'}`);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    console.error(error.stack);
  } finally {
    process.exit();
  }
}

checkWageFields();