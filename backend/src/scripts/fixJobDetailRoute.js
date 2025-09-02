const fs = require('fs');
const path = require('path');

/**
 * 修复工人端App查看工作详情时的路由问题
 * 
 * 问题：当工人接受邀请后，job列表显示的是job_record的ID，
 * 但JobDetailScreen错误地用这个ID去查询invitation详情，导致404错误
 * 
 * 解决方案：
 * 1. 在后端添加一个兼容路由，可以通过job_record_id获取工作详情
 * 2. 或者修改前端，根据工作状态选择正确的API
 */

console.log('🔧 分析和修复工作详情路由问题...\n');

// 1. 显示问题分析
console.log('📋 问题分析:');
console.log('1. 工人接受邀请后，创建了job_record');
console.log('2. 工人端App显示的是job_record的ID（如: 24fe9d2e-efc5-46ba-b669-7ca23719249c）');
console.log('3. 但JobDetailScreen使用这个ID调用 /invitations/:id，导致404');
console.log('4. 应该调用 /jobs/detail/:jobRecordId\n');

// 2. 建议的后端修复
console.log('💡 建议的后端修复方案:');
console.log('在invitationController中添加一个智能路由:\n');

const smartRouteCode = `
// 获取邀请或工作记录详情（智能路由）
const getInvitationOrJobDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // 首先尝试作为invitation_id查询
    let result = await db.query(
      \`SELECT * FROM invitations WHERE id = $1 AND worker_id = $2\`,
      [id, user_id]
    );
    
    if (result.rows.length > 0) {
      // 返回邀请详情
      return res.json(result.rows[0]);
    }
    
    // 如果找不到，尝试作为job_record_id查询
    result = await db.query(\`
      SELECT 
        jr.*,
        p.project_name,
        p.project_address,
        p.payment_type,
        p.original_wage,
        p.daily_wage,
        c.company_name,
        c.phone as company_phone,
        i.wage_amount,
        i.wage_unit,
        i.original_wage as invitation_original_wage
      FROM job_records jr
      LEFT JOIN projects p ON jr.project_id = p.id
      LEFT JOIN companies c ON jr.company_id = c.id
      LEFT JOIN invitations i ON jr.invitation_id = i.id
      WHERE jr.id = $1 AND jr.worker_id = $2
    \`, [id, user_id]);
    
    if (result.rows.length > 0) {
      // 转换为invitation格式以兼容前端
      const job = result.rows[0];
      return res.json({
        id: job.invitation_id || job.id,
        project_name: job.project_name,
        company_name: job.company_name,
        project_address: job.project_address,
        wage_amount: job.wage_amount,
        wage_unit: job.wage_unit,
        payment_type: job.payment_type,
        original_wage: job.original_wage || job.invitation_original_wage,
        daily_wage: job.daily_wage,
        status: job.status === 'active' ? 'accepted' : job.status,
        // 其他需要的字段...
      });
    }
    
    return res.status(404).json({ error: '邀请或工作记录不存在' });
    
  } catch (error) {
    console.error('Get invitation or job detail error:', error);
    res.status(500).json({ error: '获取详情失败' });
  }
};
`;

console.log(smartRouteCode);

// 3. 前端修复建议
console.log('\n💡 或者前端修复方案:');
console.log('修改 apps/worker/src/services/api.js:\n');

const frontendFixCode = `
// 修改 getInvitationDetail 方法
async getInvitationDetail(id) {
  try {
    // 首先尝试作为invitation获取
    const inv = await this.request(\`/invitations/\${id}\`);
    return this.transformInvitationData(inv);
  } catch (error) {
    if (error.message.includes('邀请不存在')) {
      // 如果失败，尝试作为job_record获取
      try {
        const job = await this.request(\`/jobs/detail/\${id}\`);
        // 转换job_record数据为invitation格式
        return {
          id: job.invitation_id || job.id,
          projectName: job.project_name,
          companyName: job.company_name,
          projectAddress: job.project_address,
          wageOffer: job.wage_amount,
          wageUnit: job.wage_unit || 'hour',
          paymentType: job.payment_type,
          budgetRange: job.payment_type === 'hourly' ? job.original_wage : job.daily_wage,
          status: job.status === 'active' ? 'accepted' : job.status,
          // 其他字段映射...
        };
      } catch (jobError) {
        throw error; // 抛出原始错误
      }
    }
    throw error;
  }
}
`;

console.log(frontendFixCode);

// 4. 立即可用的临时修复
console.log('\n🚀 立即可用的修复:');
console.log('1. 后端已有 /api/jobs/detail/:jobRecordId 端点');
console.log('2. 前端应该根据工作状态使用正确的API:');
console.log('   - 待响应(pending): 使用 /invitations/:invitationId');
console.log('   - 已接受(active/completed): 使用 /jobs/detail/:jobRecordId');
console.log('\n建议在前端添加状态判断逻辑。');

console.log('\n✅ 分析完成！');