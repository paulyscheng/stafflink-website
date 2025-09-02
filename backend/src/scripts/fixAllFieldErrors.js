const fs = require('fs');
const path = require('path');

/**
 * 完整的字段映射文档 - 基于实际数据库结构
 */
const DATABASE_STRUCTURE = {
  notifications: ['id', 'user_id', 'user_type', 'type', 'title', 'message', 'data', 'read', 'created_at', 'updated_at'],
  invitations: ['id', 'company_id', 'worker_id', 'project_id', 'status', 'invited_at', 'responded_at', 'response_note', 'wage_amount', 'start_date', 'end_date', 'created_at', 'updated_at', 'original_wage', 'wage_unit'],
  job_records: ['id', 'worker_id', 'company_id', 'project_id', 'invitation_id', 'start_date', 'end_date', 'actual_hours', 'wage_amount', 'status', 'worker_confirmed', 'company_confirmed', 'payment_status', 'created_at', 'updated_at'],
  projects: ['id', 'company_id', 'title', 'description', 'location', 'latitude', 'longitude', 'start_date', 'end_date', 'daily_wage', 'required_workers', 'hired_workers', 'work_hours', 'work_type', 'urgency_level', 'status', 'created_at', 'updated_at', 'project_name', 'project_address', 'project_type', 'priority', 'work_description', 'experience_level', 'time_nature', 'start_time', 'end_time', 'working_days', 'time_notes', 'payment_type', 'budget_range', 'estimated_duration', 'selected_workers', 'notification_methods', 'urgency', 'original_wage', 'wage_unit'],
  workers: ['id', 'name', 'phone', 'id_card', 'age', 'gender', 'address', 'rating', 'total_jobs', 'completed_jobs', 'total_earnings', 'status', 'experience_years', 'profile_photo', 'created_at', 'updated_at'],
  companies: ['id', 'company_name', 'contact_person', 'phone', 'email', 'address', 'business_license', 'rating', 'total_projects', 'status', 'created_at', 'updated_at']
};

// 定义所有错误字段到正确字段的映射
const FIELD_FIXES = {
  // notifications表
  'receiver_id': { table: 'notifications', correct: 'user_id' },
  'receiver_type': { table: 'notifications', correct: 'user_type' },
  'sender_id': { table: 'notifications', correct: null, note: '应存储在data JSONB字段中' },
  'sender_type': { table: 'notifications', correct: null, note: '应存储在data JSONB字段中' },
  
  // invitations表
  'response_message': { table: 'invitations', correct: 'response_note' },
  'wage_offer': { table: 'invitations', correct: 'wage_amount' },
  'wage_type': { table: 'invitations', correct: 'wage_unit' },
  
  // job_records表
  'work_date': { table: 'job_records', correct: 'start_date' },
  'payment_amount': { table: 'job_records', correct: 'wage_amount' },
  'payment_type': { table: 'job_records', correct: null, note: '此字段在job_records表中不存在，需要从projects表获取' },
  
  // 通用错误
  'work_content': { table: 'projects', correct: 'description', note: 'projects表同时有description和work_description字段' },
  'workers_count': { table: 'projects', correct: 'required_workers' }
};

console.log('🔧 开始全面修复字段名错误...\n');

// 需要修复的文件列表
const filesToFix = [
  // Controllers
  { path: 'src/controllers/invitationController.js', critical: true },
  { path: 'src/controllers/jobController.js', critical: true },
  { path: 'src/controllers/projectController.js', critical: true },
  { path: 'src/controllers/notificationController.js', critical: true },
  
  // Routes
  { path: 'src/routes/invitations.js', critical: true },
  { path: 'src/routes/notifications.js', critical: true },
  { path: 'src/routes/jobRoutes.js', critical: true },
  
  // Services (已手动修复notificationService.js)
  // { path: 'src/services/notificationService.js', critical: true },
  
  // Scripts (非关键，但建议修复)
  { path: 'src/scripts/createTestNotifications.js', critical: false },
  { path: 'src/scripts/createNotificationsForZhang.js', critical: false },
  { path: 'src/scripts/updateNotificationsTable.js', critical: false },
  { path: 'src/scripts/createNotificationsTable.js', critical: false },
  { path: 'src/scripts/acceptTestInvitation.js', critical: false },
  { path: 'src/scripts/testInvitationNotifications.js', critical: false },
  { path: 'src/scripts/createTestInvitations.js', critical: false },
  { path: 'src/scripts/createPendingInvitations.js', critical: false },
  { path: 'src/scripts/createRejectedInvitations.js', critical: false },
  { path: 'src/scripts/createMoreTestJobs.js', critical: false },
  { path: 'src/scripts/createTestJobRecords.js', critical: false },
  { path: 'src/scripts/testWorkerJobsAPI.js', critical: false },
  { path: 'src/scripts/acceptTestInvitationFixed.js', critical: false }
];

// 修复统计
let fixedCount = 0;
let errorCount = 0;
const fixReport = [];

// 修复单个文件
function fixFile(fileInfo) {
  const { path: filePath, critical } = fileInfo;
  const fullPath = path.join(__dirname, '..', '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    if (critical) errorCount++;
    return;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    const fixes = [];
    
    // 遍历所有需要修复的字段
    Object.entries(FIELD_FIXES).forEach(([wrongField, fixInfo]) => {
      const { correct, note } = fixInfo;
      
      // 创建各种可能的匹配模式
      const patterns = [
        // SQL字段列表中的字段名 (如 SELECT field1, field2)
        new RegExp(`\\b${wrongField}\\b(?=[,\\s\\)\\n])`, 'g'),
        // 引号中的字段名 ('field' 或 "field" 或 `field`)
        new RegExp(`(['"\`])${wrongField}\\1`, 'g'),
        // 点号访问 (table.field)
        new RegExp(`\\.${wrongField}\\b`, 'g'),
        // 对象属性访问 (obj.field 或 obj['field'])
        new RegExp(`(\\w+)\\['${wrongField}'\\]`, 'g'),
        new RegExp(`(\\w+)\\.${wrongField}\\b`, 'g'),
        // WHERE子句中的字段名
        new RegExp(`WHERE\\s+.*?${wrongField}\\s*=`, 'gi'),
        // SET子句中的字段名
        new RegExp(`SET\\s+${wrongField}\\s*=`, 'gi')
      ];
      
      patterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          if (correct) {
            // 替换为正确的字段名
            content = content.replace(pattern, (match) => {
              return match.replace(wrongField, correct);
            });
            fixes.push(`${wrongField} → ${correct} (${matches.length}处)`);
          } else {
            // 记录需要特殊处理的字段
            fixes.push(`⚠️  ${wrongField} ${note} (${matches.length}处)`);
          }
        }
      });
    });
    
    // 如果有修改，保存文件
    if (content !== originalContent) {
      // 创建备份
      const backupPath = fullPath + '.backup_' + Date.now();
      fs.writeFileSync(backupPath, originalContent);
      
      // 写入修改后的内容
      fs.writeFileSync(fullPath, content);
      
      console.log(`✅ 已修复: ${filePath}`);
      fixes.forEach(fix => console.log(`   - ${fix}`));
      
      fixedCount++;
      fixReport.push({
        file: filePath,
        fixes: fixes,
        critical: critical
      });
    } else {
      console.log(`ℹ️  无需修改: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`❌ 处理文件失败: ${filePath}`, error.message);
    if (critical) errorCount++;
  }
}

// 执行修复
filesToFix.forEach(fixFile);

// 输出报告
console.log('\n' + '='.repeat(60));
console.log('📊 修复报告');
console.log('='.repeat(60));
console.log(`✅ 成功修复文件数: ${fixedCount}`);
console.log(`❌ 失败文件数: ${errorCount}`);

if (fixReport.length > 0) {
  console.log('\n📝 详细修复内容:');
  fixReport.forEach(report => {
    console.log(`\n${report.critical ? '⭐' : '📄'} ${report.file}`);
    report.fixes.forEach(fix => console.log(`   ${fix}`));
  });
}

console.log('\n⚠️  重要提醒:');
console.log('1. notificationService.js已手动修复，sender_id和sender_type现在存储在data JSONB字段中');
console.log('2. job_records表没有payment_type字段，需要从projects表获取');
console.log('3. 请测试所有修复的功能，确保正常工作');
console.log('4. 建议检查前端代码，确保字段映射正确');

// 创建字段映射文档
const mappingDoc = {
  timestamp: new Date().toISOString(),
  database_structure: DATABASE_STRUCTURE,
  field_corrections: FIELD_FIXES,
  fixed_files: fixReport
};

fs.writeFileSync(
  path.join(__dirname, 'field-mapping-report.json'),
  JSON.stringify(mappingDoc, null, 2)
);

console.log('\n✅ 字段映射报告已保存到 field-mapping-report.json');
console.log('\n🎉 修复完成！');