# 字段映射完整指南

## 数据库表结构（2025-08-23更新）

### 1. notifications 表
```sql
- id (uuid)
- user_id (uuid)          -- 不是 receiver_id
- user_type (varchar)     -- 不是 receiver_type  
- type (varchar)
- title (varchar)
- message (text)
- data (jsonb)           -- 存储所有额外信息，包括sender_id, sender_type等
- read (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### 2. invitations 表
```sql
- id (uuid)
- company_id (uuid)
- worker_id (uuid)
- project_id (uuid)
- status (varchar)
- invited_at (timestamp)
- responded_at (timestamp)
- response_note (text)     -- 不是 response_message
- wage_amount (numeric)    -- 不是 wage_offer
- original_wage (numeric)
- wage_unit (varchar)      -- 不是 wage_type
- start_date (date)
- end_date (date)
- created_at (timestamp)
- updated_at (timestamp)
```

### 3. job_records 表
```sql
- id (uuid)
- worker_id (uuid)
- company_id (uuid)
- project_id (uuid)
- invitation_id (uuid)
- start_date (timestamp)   -- 不是 work_date
- end_date (timestamp)
- actual_hours (numeric)
- wage_amount (numeric)    -- 不是 payment_amount
- status (varchar)         -- 值: 'active', 'completed', 'cancelled'
- worker_confirmed (boolean)
- company_confirmed (boolean)
- payment_status (varchar)
- created_at (timestamp)
- updated_at (timestamp)

注意：job_records表没有payment_type字段！需要从projects表获取
```

### 4. projects 表
```sql
- id (uuid)
- company_id (uuid)
- title (varchar)
- description (text)       -- 基础描述
- work_description (text)  -- 详细工作描述（两个字段都存在）
- daily_wage (numeric)     -- 日薪
- original_wage (numeric)  -- 原始工资（时薪）
- wage_unit (varchar)      -- 工资单位
- payment_type (varchar)   -- 支付类型: 'hourly', 'daily', 'fixed'
- required_workers (integer) -- 不是 workers_count
- budget_range (varchar)   -- 预算范围字符串
...其他字段
```

## 前后端字段映射规则

### API响应转换（后端 → 前端）

#### notifications
```javascript
// 后端查询
{
  user_id: 'xxx',
  user_type: 'worker',
  data: {
    sender_id: 'yyy',
    sender_type: 'company',
    project_id: 'zzz'
  }
}

// 前端期望（保持兼容）
{
  receiver_id: user_id,      // 映射
  receiver_type: user_type,  // 映射
  sender_id: data.sender_id,
  sender_type: data.sender_type,
  ...
}
```

#### invitations
```javascript
// 数据库字段 → API响应
{
  response_note → responseNote,
  wage_amount → wageAmount,
  wage_unit → wageUnit,
  original_wage → originalWage
}
```

#### job_records  
```javascript
// 数据库字段 → API响应
{
  start_date → startDate,    // 不是workDate
  wage_amount → wageAmount,  // 不是paymentAmount
  // payment_type需要从projects表获取
}
```

## 工资显示逻辑

### 正确的工资字段使用
1. **时薪项目 (payment_type = 'hourly')**
   - 显示: `original_wage` (如: 50元/小时)
   - 存储: projects.original_wage 或 invitations.original_wage

2. **日薪项目 (payment_type = 'daily')**
   - 显示: `daily_wage` (如: 400元/天)
   - 存储: projects.daily_wage

3. **固定价格项目 (payment_type = 'fixed')**
   - 显示: `original_wage` 或 `wage_amount`
   - 存储: projects.original_wage 或 invitations.wage_amount

### 常见错误
- ❌ 时薪项目显示daily_wage (会显示400而不是50)
- ❌ 使用budget_range作为实际工资
- ❌ 混淆wage_amount和original_wage

## 前端修复建议

### 1. 工人端App (apps/worker/src/services/api.js)
```javascript
// 修复getWorkerJobs的数据转换
transformJobData(job) {
  return {
    ...job,
    // 正确的字段映射
    wageAmount: job.wage_amount,
    originalWage: job.original_wage,
    paymentType: job.payment_type,
    budgetRange: job.payment_type === 'hourly' ? job.original_wage : job.daily_wage,
    startDate: job.start_date,  // 不是work_date
  };
}
```

### 2. 企业端App (apps/company/src/screens/ProjectDetailScreen.js)
```javascript
// 修复formatPayment函数
const formatPayment = () => {
  const paymentType = project.payment_type || project.paymentType;
  const originalWage = project.original_wage || project.originalWage;
  const dailyWage = project.daily_wage || project.dailyWage;
  
  if (paymentType === 'hourly' && originalWage) {
    return `¥${originalWage}/小时`;
  }
  if (paymentType === 'daily' && dailyWage) {
    return `¥${dailyWage}/天`;
  }
  // ...
};
```

## 测试检查清单

- [ ] notifications表的user_id/user_type映射正确
- [ ] invitations表的response_note和wage_amount使用正确
- [ ] job_records表的start_date使用正确（不是work_date）
- [ ] payment_type从projects表获取，不从job_records表
- [ ] 时薪显示使用original_wage，不是daily_wage
- [ ] 前端API服务正确转换snake_case到camelCase

## 数据库查询示例

### 正确的通知创建
```sql
INSERT INTO notifications (user_id, user_type, type, title, message, data)
VALUES ($1, $2, $3, $4, $5, jsonb_build_object(
  'sender_id', $6,
  'sender_type', $7,
  'project_id', $8
));
```

### 正确的邀请响应
```sql
UPDATE invitations 
SET status = $1, response_note = $2, responded_at = CURRENT_TIMESTAMP
WHERE id = $3;
```

### 正确的工作记录创建
```sql
INSERT INTO job_records (
  id, invitation_id, project_id, worker_id, company_id,
  start_date, status, wage_amount
) VALUES ($1, $2, $3, $4, $5, $6, 'active', $7);
```