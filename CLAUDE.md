# StaffLink (蓝领派工系统) 开发规范

## 项目概述
StaffLink 是一个连接蓝领工人和企业的双端移动应用平台，包含工人端和企业端两个 React Native 应用。

## 开发原则 🎯

### 1. 生产级别标准
- **禁止硬编码**：所有数据必须从数据库或 API 获取
- **禁止模拟数据**：除了初始种子数据外，不使用模拟数据
- **真实 API 调用**：所有功能必须连接真实后端 API
- **完整错误处理**：每个 API 调用都需要 try-catch 和用户友好的错误提示
- **数据持久化**：使用 PostgreSQL 数据库存储所有业务数据

### 2. UI/UX 设计要求 ⭐️
- **专业设计**：所有 UI 必须专业、精美，符合产品定位
- **一致性**：保持视觉风格、交互模式的一致性
- **用户体验**：注重细节，提供流畅的用户体验
- **响应式设计**：适配不同屏幕尺寸
- **动画效果**：适当使用动画提升交互感
- **禁止简化**：不能为了开发方便而简化 UI 设计
- **品牌形象**：UI 设计必须符合 StaffLink 专业派工平台的定位

### 3. 代码质量要求
- **类型安全**：使用 PropTypes 或 TypeScript（未来迁移）
- **组件复用**：提取通用组件，避免代码重复
- **状态管理**：使用 Context API 管理全局状态
- **异步处理**：正确处理 loading、error、success 状态
- **性能优化**：使用 React.memo、useMemo、useCallback 优化性能

### 4. 安全规范
- **认证授权**：使用 JWT token 进行身份验证
- **数据验证**：前后端双重数据验证
- **敏感信息**：不在代码中存储密码、密钥等敏感信息
- **SQL 注入防护**：使用参数化查询，避免 SQL 注入
- **XSS 防护**：对用户输入进行转义处理

## 技术栈

### 前端
- React Native + Expo
- React Navigation
- AsyncStorage（本地存储）
- Context API（状态管理）

### 后端
- Node.js + Express
- PostgreSQL（腾讯云托管）
- JWT（身份验证）
- bcrypt（密码加密）

## 项目结构
```
/Blue_collar
├── /apps
│   ├── /worker        # 工人端 App
│   └── /company       # 企业端 App
├── /backend           # 后端 API
│   ├── /src
│   │   ├── /controllers
│   │   ├── /routes
│   │   ├── /middleware
│   │   ├── /config
│   │   └── /scripts
│   └── server.js
└── /docs             # 项目文档
```

## 数据库设计

### 核心表结构
- **workers**: 工人信息表
- **companies**: 企业信息表
- **projects**: 项目信息表
- **invitations**: 工作邀请表
- **job_records**: 工作记录表
- **skills**: 技能表
- **worker_skills**: 工人技能关联表

## API 规范

### RESTful 设计
- GET /api/workers - 获取工人列表
- POST /api/projects - 创建项目
- PUT /api/invitations/:id/respond - 响应邀请
- DELETE /api/projects/:id - 删除项目

### 响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误处理
```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

## 开发流程

### 1. 功能开发步骤
1. 设计数据库表结构
2. 实现后端 API
3. 编写 API 测试脚本
4. 实现前端界面
5. 连接前后端
6. 测试完整流程
7. 优化用户体验

### 2. 测试要求 🧪

#### 必须进行的测试
- **字段验证**：开发前必须验证数据库表结构，确保使用正确的字段名
- **单元测试**：每个新功能必须包含单元测试
- **API 测试**：所有端点必须有对应的测试用例
- **数据映射测试**：验证前后端字段映射的一致性
- **集成测试**：完整用户流程测试

#### 常见错误预防
1. **数据库字段错误**
   - ❌ 错误示例：`i.wage_offer`（不存在）
   - ✅ 正确示例：`i.wage_amount`
   - 预防方法：先运行 `checkTables.js` 脚本验证表结构

2. **前后端字段不匹配**
   - ❌ 错误：后端返回 `daily_wage`，前端使用 `budgetRange` 显示时薪
   - ✅ 正确：时薪用 `original_wage`，日薪用 `daily_wage`
   - 预防方法：创建字段映射文档和测试

3. **工资计算错误**
   - 必须明确区分：
     - `original_wage`: 原始时薪（如 ¥50/小时）
     - `daily_wage`: 日薪（如 ¥400/天）
     - `wage_amount`: 最终工资金额
   - 测试用例：验证时薪×8=日薪

#### 测试脚本位置
- 单元测试：`/backend/tests/`
- API 测试脚本：`/backend/src/scripts/test*.js`
- 字段验证：`/backend/tests/fieldMapping.test.js`

### 3. 部署流程
- 开发环境：本地开发
- 测试环境：内部测试
- 生产环境：正式发布

## 当前进度

### 已完成功能 ✅
- 工人/企业注册登录
- 项目创建和管理
- 工作邀请系统
- 工人响应邀请
- 基础 API 架构

### 待开发功能 📋
- 实时通知系统
- 工作完成确认
- 评价系统
- 支付结算
- 消息聊天
- 位置服务
- 技能认证

## 测试账号

### 企业端
- 手机号：13900139000
- 验证码：123456

### 工人端
- 张师傅：13800138001 / 123455
- 李师傅：13800138002 / 123456
- 王师傅：13800138003 / 123457
- 赵师傅：13800138004 / 123458
- 刘师傅：13800138005 / 123451

## 注意事项

### ⚠️ 重要提醒
1. **不要使用硬编码数据**
2. **不要跳过错误处理**
3. **不要在前端存储敏感信息**
4. **不要直接操作数据库，使用 API**
5. **不要忽略用户体验细节**
6. **不要简化 UI 设计**
7. **不要使用粗糙的界面**
8. **不要为了开发速度牺牲设计质量**

### 💡 最佳实践
1. 每个功能都要有 loading 状态
2. 每个错误都要有友好提示
3. 每个操作都要有成功反馈
4. 每个列表都要有空状态处理
5. 每个表单都要有验证逻辑
6. 每个界面都要精心设计
7. 每个交互都要流畅自然
8. 每个组件都要考虑复用性

## 命令速查

### 启动项目
```bash
# 启动后端
cd backend && NODE_ENV=development npm run dev

# 启动工人端
cd apps/worker && npm start

# 启动企业端
cd apps/company && npm start
```

### 数据库操作
```bash
# 测试数据库连接
node src/scripts/testDatabase.js

# 创建测试数据
node src/scripts/createTestWorkers.js
node src/scripts/createTestCompany.js
node src/scripts/createTestInvitations.js
```

## 联系方式
- 项目负责人：Mengyi
- 技术支持：Claude AI Assistant
- 更新时间：2025-08-07