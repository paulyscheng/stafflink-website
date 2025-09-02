const fs = require('fs');
const path = require('path');

/**
 * 全面修复所有字段名错误的脚本
 */

// 定义所有需要替换的字段映射
const fieldMappings = {
  // notifications表的字段修正
  notifications: {
    // 旧字段 -> 新字段
    'receiver_id': 'user_id',
    'receiver_type': 'user_type',
    'sender_id': 'data->>\\'sender_id\\' as sender_id',  // 移到JSONB data字段
    'sender_type': 'data->>\\'sender_type\\' as sender_type',
    // 但是在INSERT/UPDATE语句中，我们需要特殊处理
  },
  
  // invitations表的字段修正
  invitations: {
    'response_message': 'response_note',
    'wage_offer': 'wage_amount',
    'wage_type': 'wage_unit'
  },
  
  // job_records表的字段修正
  job_records: {
    'work_date': 'start_date',
    'payment_amount': 'wage_amount',
    // payment_type字段在job_records表中不存在，需要从projects表获取
  },
  
  // 其他常见错误
  common: {
    'work_content': 'description',
    'workers_count': 'required_workers'
  }
};

// 需要修复的文件列表
const filesToFix = [
  // Controllers
  'src/controllers/invitationController.js',
  'src/controllers/jobController.js',
  'src/controllers/projectController.js',
  'src/controllers/authController.js',
  
  // Services
  'src/services/notificationService.js',
  
  // Routes
  'src/routes/invitations.js',
  'src/routes/notifications.js',
  
  // Scripts (可选，但建议修复)
  'src/scripts/createTestNotifications.js',
  'src/scripts/createNotificationsForZhang.js',
  'src/scripts/updateNotificationsTable.js',
  'src/scripts/createNotificationsTable.js',
  'src/scripts/acceptTestInvitation.js',
  'src/scripts/testInvitationNotifications.js',
  'src/scripts/createTestInvitations.js',
  'src/scripts/createPendingInvitations.js',
  'src/scripts/createRejectedInvitations.js',
  'src/scripts/createMoreTestJobs.js',
  'src/scripts/createTestJobRecords.js',
  'src/scripts/testWorkerJobsAPI.js',
  'src/scripts/acceptTestInvitationFixed.js'
];

console.log('🔧 开始修复所有字段名错误...\n');

// 修复函数
function fixFieldNames(filePath) {
  const fullPath = path.join(__dirname, '..', '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // 应用所有字段映射
  Object.entries(fieldMappings).forEach(([table, mappings]) => {
    Object.entries(mappings).forEach(([oldField, newField]) => {
      // 替换SQL查询中的字段名
      const patterns = [
        // INSERT语句
        new RegExp(`\\b${oldField}\\b(?=.*VALUES)`, 'gi'),
        // UPDATE语句
        new RegExp(`SET\\s+${oldField}\\s*=`, 'gi'),
        // WHERE子句
        new RegExp(`WHERE\\s+.*?${oldField}\\s*=`, 'gi'),
        // SELECT语句
        new RegExp(`SELECT\\s+.*?${oldField}`, 'gi'),
        // 点号访问 (table.field)
        new RegExp(`\\.${oldField}\\b`, 'g'),
        // 引号中的字段名
        new RegExp(`['"\`]${oldField}['"\`]`, 'g')
      ];
      
      patterns.forEach(pattern => {
        if (content.match(pattern)) {
          content = content.replace(pattern, (match) => {
            // 特殊处理notifications表的sender_id和sender_type
            if (table === 'notifications' && (oldField === 'sender_id' || oldField === 'sender_type')) {
              // 在INSERT语句中，这些字段应该存储在data JSONB字段中
              return match; // 暂时保留，需要手动处理
            }
            return match.replace(oldField, newField);
          });
          modified = true;
        }
      });
    });
  });
  
  if (modified) {
    // 创建备份
    const backupPath = fullPath + '.backup';
    fs.writeFileSync(backupPath, fs.readFileSync(fullPath));
    
    // 写入修改后的内容
    fs.writeFileSync(fullPath, content);
    console.log(`✅ 已修复: ${filePath}`);
  } else {
    console.log(`ℹ️  无需修改: ${filePath}`);
  }
}

// 执行修复
filesToFix.forEach(fixFieldNames);

console.log('\n📝 修复报告:');
console.log('1. notifications表: receiver_id -> user_id, receiver_type -> user_type');
console.log('2. invitations表: response_message -> response_note, wage_offer -> wage_amount, wage_type -> wage_unit');
console.log('3. job_records表: work_date -> start_date, payment_amount -> wage_amount');
console.log('4. projects表: work_content -> description (注意: work_description字段也存在)');

console.log('\n⚠️  注意事项:');
console.log('1. notifications表的sender_id和sender_type应该存储在data JSONB字段中');
console.log('2. job_records表没有payment_type字段，需要从projects表获取');
console.log('3. 请手动检查修复后的代码，确保逻辑正确');
console.log('4. 建议运行测试确保功能正常');

console.log('\n✅ 字段名修复完成！');