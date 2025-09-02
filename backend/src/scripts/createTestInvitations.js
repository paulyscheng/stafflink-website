const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../config/database');

async function createTestInvitations() {
  try {
    console.log('📮 创建测试邀请数据...\n');
    
    // 获取公司和项目
    const companyResult = await db.query(`
      SELECT id, company_name FROM companies LIMIT 1
    `);
    
    if (companyResult.rows.length === 0) {
      console.log('❌ 没有找到公司，请先创建公司和项目');
      return;
    }
    
    const company = companyResult.rows[0];
    console.log(`✅ 使用公司: ${company.company_name}\n`);
    
    // 获取或创建项目
    let projectResult = await db.query(`
      SELECT id, project_name FROM projects 
      WHERE company_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [company.id]);
    
    let project;
    
    if (projectResult.rows.length === 0) {
      console.log('📝 创建新项目...');
      
      const createProjectResult = await db.query(`
        INSERT INTO projects (
          company_id, project_name, project_address, project_type,
          required_workers, work_description, experience_level,
          start_date, end_date, start_time, end_time,
          payment_type, budget_range, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id, project_name
      `, [
        company.id,
        '厨房装修项目',
        '朝阳区建国路88号',
        'home_renovation',
        2,
        '需要进行厨房的水电改造，包括插座安装和水管更换。',
        'intermediate',
        '2025-01-14',
        '2025-01-14',
        '09:00',
        '17:00',
        'hourly',
        '80-100',
        'published'
      ]);
      
      project = createProjectResult.rows[0];
      console.log(`✅ 项目创建成功: ${project.project_name}\n`);
    } else {
      project = projectResult.rows[0];
      console.log(`✅ 使用现有项目: ${project.project_name}\n`);
    }
    
    // 获取工人列表
    const workersResult = await db.query(`
      SELECT id, name, phone FROM workers 
      WHERE status = 'online'
      LIMIT 5
    `);
    
    if (workersResult.rows.length === 0) {
      console.log('❌ 没有找到在线工人');
      return;
    }
    
    console.log(`📋 为 ${workersResult.rows.length} 个工人创建邀请:\n`);
    
    // 为每个工人创建邀请
    for (const worker of workersResult.rows) {
      try {
        // 检查是否已有邀请
        const existingInvitation = await db.query(`
          SELECT id, status FROM invitations 
          WHERE project_id = $1 AND worker_id = $2
        `, [project.id, worker.id]);
        
        if (existingInvitation.rows.length > 0) {
          console.log(`⚠️  ${worker.name} 已有邀请 (${existingInvitation.rows[0].status})`);
          continue;
        }
        
        // 创建新邀请
        const result = await db.query(`
          INSERT INTO invitations (
            project_id, company_id, worker_id,
            message, wage_amount, wage_unit,
            status, expires_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [
          project.id,
          company.id,
          worker.id,
          `诚邀您参与我们的厨房装修项目，需要您的专业技能。`,
          80,
          'hourly',
          'pending',
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7天后过期
        ]);
        
        console.log(`✅ 为 ${worker.name} (${worker.phone}) 创建邀请成功`);
      } catch (error) {
        console.error(`❌ 为 ${worker.name} 创建邀请失败:`, error.message);
      }
    }
    
    // 创建第二个项目的邀请
    console.log('\n📝 创建第二个项目...');
    
    const project2Result = await db.query(`
      INSERT INTO projects (
        company_id, project_name, project_address, project_type,
        required_workers, work_description, experience_level,
        start_date, end_date, start_time, end_time,
        payment_type, budget_range, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT DO NOTHING
      RETURNING id, project_name
    `, [
      company.id,
      '办公楼清洁',
      '海淀区中关村大街1号',
      'office_cleaning',
      3,
      '办公楼每周定期清洁，包括办公室、走廊、洗手间等区域。',
      'beginner',
      '2025-01-11',
      '2025-01-11',
      '18:00',
      '22:00',
      'hourly',
      '300-400',
      'published'
    ]);
    
    if (project2Result.rows.length > 0) {
      const project2 = project2Result.rows[0];
      console.log(`✅ 第二个项目创建成功: ${project2.project_name}\n`);
      
      // 为部分工人创建紧急邀请
      const urgentWorkers = workersResult.rows.slice(0, 2);
      for (const worker of urgentWorkers) {
        try {
          const result = await db.query(`
            INSERT INTO invitations (
              project_id, company_id, worker_id,
              message, wage_amount, wage_unit,
              status, expires_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (project_id, worker_id) DO NOTHING
            RETURNING id
          `, [
            project2.id,
            company.id,
            worker.id,
            `紧急！需要清洁人员，待遇优厚。`,
            300,
            'hourly',
            'pending',
            new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2天后过期
          ]);
          
          if (result.rows.length > 0) {
            console.log(`✅ 为 ${worker.name} 创建紧急邀请`);
          }
        } catch (error) {
          console.error(`❌ 创建紧急邀请失败:`, error.message);
        }
      }
    }
    
    // 显示统计
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
      FROM invitations
    `);
    
    const stats = statsResult.rows[0];
    console.log('\n📊 邀请统计:');
    console.log(`   总计: ${stats.total}`);
    console.log(`   待响应: ${stats.pending}`);
    console.log(`   已接受: ${stats.accepted}`);
    console.log(`   已拒绝: ${stats.rejected}`);
    
    console.log('\n✅ 测试数据创建完成！');
    console.log('📱 现在工人可以登录APP查看邀请了');
    
  } catch (error) {
    console.error('❌ 创建测试邀请失败:', error);
  } finally {
    process.exit();
  }
}

createTestInvitations();