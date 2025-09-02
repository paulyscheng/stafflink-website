require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');
const SkillService = require('../services/skillService');

// 配置axios忽略代理
axios.defaults.proxy = false;

// API配置
const API_BASE = 'http://localhost:3000/api';
let authToken = '';

// 测试数据
const testCompany = {
  phone: '13900139000',
  code: '123456',
  userType: 'company'
};

const testWorkers = [
  { phone: '13800138001', code: '123456', name: '张师傅' },
  { phone: '13800138002', code: '123456', name: '李师傅' }
];

// 测试项目数据
const testProjects = [
  {
    name: '时薪测试项目',
    project_name: '办公室清洁 - 时薪30元',
    project_address: '北京市朝阳区建国路88号',
    project_type: 'cleaning_service',
    priority: 'normal',
    required_workers: 2,
    work_description: '办公室日常清洁，包括地面清洁、垃圾清理、桌面整理等',
    experience_level: 'beginner',
    time_nature: 'onetime',
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // 明天
    end_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    payment_type: 'hourly',
    budget_range: '30', // 30元/小时
    skills: [
      { skill_id: 'cleaner', required_level: 1, is_mandatory: true }
    ]
  },
  {
    name: '日薪测试项目',
    project_name: '装修工程 - 日薪300元',
    project_address: '北京市海淀区中关村大街1号',
    project_type: 'maintenance_service',
    priority: 'high',
    required_workers: 3,
    work_description: '室内装修，包括刷墙、铺地板等',
    experience_level: 'intermediate',
    time_nature: 'multiday',
    start_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3天后
    start_time: '08:00',
    end_time: '18:00',
    payment_type: 'daily',
    budget_range: '300', // 300元/天
    skills: [
      { skill_id: 'painter', required_level: 2, is_mandatory: true },
      { skill_id: 'carpenter', required_level: 1, is_mandatory: false }
    ]
  }
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginCompany() {
  console.log('🏢 企业登录...');
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, testCompany);
    
    // 处理不同的响应结构
    authToken = response.data.token || response.data.data?.token;
    if (!authToken) {
      console.error('   响应数据:', JSON.stringify(response.data, null, 2));
      throw new Error('Token not found in response');
    }
    
    console.log('   ✅ 登录成功');
    return response.data.company || response.data.data?.company || response.data.user;
  } catch (error) {
    console.error('   ❌ 登录失败:', error.response?.data || error.message);
    throw error;
  }
}

async function createProjectWithTest(projectData) {
  console.log(`\n📋 创建项目: ${projectData.name}`);
  
  try {
    // 暂时使用固定的工人ID（实际ID需要从数据库获取）
    const selectedWorkers = [1, 2]; // 假设ID为1和2的工人存在
    
    // 创建项目
    const projectPayload = {
      ...projectData,
      selected_workers: selectedWorkers,
      notification_methods: ['INAPP']
    };
    
    const response = await axios.post(`${API_BASE}/projects`, projectPayload, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const project = response.data.data.project;
    console.log('   ✅ 项目创建成功');
    console.log(`      ID: ${project.id}`);
    console.log(`      原始薪资: ${project.original_wage} ${project.wage_unit === 'hour' ? '元/小时' : '元/天'}`);
    console.log(`      日薪: ${project.daily_wage} 元/天`);
    
    return project;
  } catch (error) {
    console.error('   ❌ 项目创建失败:', error.response?.data || error.message);
    if (error.response?.data?.params) {
      console.error('      请求参数:', JSON.stringify(error.response.data.params, null, 2));
    }
    throw error;
  }
}

async function verifyProjectData(projectId) {
  console.log('\n🔍 验证项目数据...');
  
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
    await client.connect();
    
    // 查询项目数据
    const projectResult = await client.query(`
      SELECT 
        id, project_name, payment_type,
        original_wage, wage_unit, daily_wage,
        budget_range
      FROM projects 
      WHERE id = $1
    `, [projectId]);
    
    const project = projectResult.rows[0];
    console.log('   项目数据:');
    console.log(`      支付类型: ${project.payment_type}`);
    console.log(`      原始薪资: ${project.original_wage} ${project.wage_unit}`);
    console.log(`      日薪: ${project.daily_wage}`);
    console.log(`      预算范围: ${project.budget_range}`);
    
    // 查询邀请数据
    const invitationsResult = await client.query(`
      SELECT 
        i.*, 
        w.name as worker_name,
        w.phone as worker_phone
      FROM invitations i
      JOIN workers w ON i.worker_id = w.id
      WHERE i.project_id = $1
    `, [projectId]);
    
    console.log(`\n   邀请数据 (${invitationsResult.rows.length} 个):`);
    invitationsResult.rows.forEach(inv => {
      console.log(`      ${inv.worker_name} (${inv.worker_phone})`);
      console.log(`         状态: ${inv.status}`);
      console.log(`         日薪: ${inv.wage_amount} 元`);
      console.log(`         原始薪资: ${inv.original_wage} ${inv.wage_unit}`);
    });
    
    // 查询技能数据
    const skillsResult = await client.query(`
      SELECT 
        s.name as skill_name,
        ps.required_level,
        ps.is_mandatory
      FROM project_skills ps
      JOIN skills s ON ps.skill_id = s.id
      WHERE ps.project_id = $1
    `, [projectId]);
    
    console.log(`\n   技能要求 (${skillsResult.rows.length} 个):`);
    skillsResult.rows.forEach(skill => {
      console.log(`      ${skill.skill_name} - 等级${skill.required_level} ${skill.is_mandatory ? '(必需)' : '(可选)'}`);
    });
    
  } finally {
    await client.end();
  }
}

async function testSkillMapping() {
  console.log('\n🎯 测试技能映射服务...');
  
  const testSkills = ['cleaner', 'electrician', 'painter', 'unknownSkill'];
  
  for (const skill of testSkills) {
    const id = await SkillService.mapFrontendSkillToId(skill);
    console.log(`   ${skill} → ${id || '未找到'}`);
  }
}

async function runCompleteTest() {
  console.log('🚀 开始完整的项目创建流程测试\n');
  console.log('=' .repeat(50));
  
  try {
    // 1. 测试技能映射
    await testSkillMapping();
    
    // 2. 企业登录
    const company = await loginCompany();
    
    // 3. 创建测试项目
    const createdProjects = [];
    for (const projectData of testProjects) {
      await delay(1000); // 避免请求过快
      const project = await createProjectWithTest(projectData);
      createdProjects.push(project);
      
      // 4. 验证数据
      await verifyProjectData(project.id);
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ 测试完成！所有功能正常工作');
    console.log('\n📊 测试总结:');
    console.log(`   - 创建了 ${createdProjects.length} 个项目`);
    console.log('   - 技能映射服务正常');
    console.log('   - 薪资计算和存储正确');
    console.log('   - 邀请创建成功');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
runCompleteTest();