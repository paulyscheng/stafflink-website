const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
});

/**
 * 开发前字段验证脚本
 * 运行此脚本以确保使用正确的数据库字段名
 */
async function validateFields() {
  console.log('🔍 开发前字段验证检查...\n');

  try {
    // 1. 检查关键表的字段
    const tables = ['workers', 'companies', 'projects', 'invitations', 'job_records'];
    const tableFields = {};

    for (const table of tables) {
      const query = `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `;
      const result = await pool.query(query, [table]);
      tableFields[table] = result.rows.map(row => row.column_name);
      
      console.log(`✅ ${table} 表字段:`, tableFields[table].join(', '));
    }

    console.log('\n📋 工资相关字段验证:');
    
    // 2. 验证工资相关字段
    const wageFieldChecks = [
      {
        table: 'invitations',
        correct: ['wage_amount', 'original_wage', 'wage_unit'],
        incorrect: ['wage_offer', 'wage_type', 'hourly_wage', 'daily_rate']
      },
      {
        table: 'projects',
        correct: ['daily_wage', 'original_wage', 'wage_unit', 'payment_type'],
        incorrect: ['wage_offer', 'hourly_rate', 'wage_type']
      },
      {
        table: 'job_records',
        correct: ['wage_amount', 'actual_hours', 'payment_status'],
        incorrect: ['hourly_wage', 'daily_wage', 'wage_offer']
      }
    ];

    wageFieldChecks.forEach(check => {
      console.log(`\n${check.table} 表:`);
      
      // 检查正确字段是否存在
      check.correct.forEach(field => {
        if (tableFields[check.table].includes(field)) {
          console.log(`  ✅ ${field} - 存在`);
        } else {
          console.log(`  ❌ ${field} - 不存在（需要添加）`);
        }
      });
      
      // 警告不应使用的字段
      check.incorrect.forEach(field => {
        if (tableFields[check.table].includes(field)) {
          console.log(`  ⚠️  ${field} - 存在但不推荐使用`);
        } else {
          console.log(`  ✅ ${field} - 不存在（正确，不应使用此字段名）`);
        }
      });
    });

    // 3. 常见字段映射提醒
    console.log('\n📌 字段映射提醒:');
    console.log('  - 时薪显示: 使用 projects.original_wage 或 invitations.original_wage');
    console.log('  - 日薪显示: 使用 projects.daily_wage');
    console.log('  - 支付类型: 使用 projects.payment_type (值: hourly/daily/fixed)');
    console.log('  - 工作描述: 使用 projects.description (不是 work_description)');
    console.log('  - 需要人数: 使用 projects.required_workers (不是 workers_count)');

    // 4. API 响应字段转换规则
    console.log('\n🔄 API响应字段转换规则:');
    console.log('  数据库字段 → 前端字段:');
    console.log('  - wage_amount → wageAmount');
    console.log('  - original_wage → originalWage'); 
    console.log('  - wage_unit → wageUnit');
    console.log('  - payment_type → paymentType');
    console.log('  - daily_wage → dailyWage');
    console.log('  - project_name → projectName');
    console.log('  - required_workers → requiredWorkers');

    // 5. 示例查询
    console.log('\n📝 正确的查询示例:');
    console.log(`
    -- 获取工人工单列表（正确）
    SELECT 
      jr.*,
      p.payment_type,
      p.daily_wage,
      p.original_wage as project_original_wage,
      i.wage_amount,
      i.original_wage,
      i.wage_unit
    FROM job_records jr
    LEFT JOIN projects p ON jr.project_id = p.id
    LEFT JOIN invitations i ON jr.invitation_id = i.id
    WHERE jr.worker_id = $1
    `);

    console.log('\n✅ 字段验证完成！');
    console.log('💡 提示: 开发新功能前请先运行此脚本验证字段');

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    await pool.end();
  }
}

// 执行验证
validateFields();