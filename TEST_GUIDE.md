# 新结构测试指南

## 测试准备
确保已安装：
- Node.js 16+
- PostgreSQL 14+
- Expo CLI (`npm install -g expo-cli`)

## 测试步骤

### 步骤1：测试后端API
```bash
# 1.1 进入后端目录
cd backend

# 1.2 安装依赖（如果尚未安装）
npm install

# 1.3 确保PostgreSQL服务正在运行
# Mac: brew services start postgresql
# 或者手动启动

# 1.4 检查数据库连接（可选）
psql -d blue_collar_platform -c "SELECT COUNT(*) FROM skills;"

# 1.5 启动后端服务
npm run dev
```

**预期结果：**
- 服务应该在 http://localhost:3000 启动
- 应该看到 "Server is running on port 3000" 的消息
- 应该看到 "Database connected" 的消息

**测试API：**
```bash
# 新开一个终端窗口测试
curl http://localhost:3000/api/skills
```

### 步骤2：测试公司端应用
```bash
# 2.1 新开终端，进入公司端目录
cd apps/company

# 2.2 安装依赖（如果尚未安装）
npm install

# 2.3 启动应用
npm start
# 或者
npx expo start
```

**预期结果：**
- Expo开发服务器启动
- 可以通过Expo Go app或模拟器访问应用
- 登录功能正常
- 创建项目向导正常
- 技能选择功能正常

### 步骤3：测试工人端应用
```bash
# 3.1 新开终端，进入工人端目录
cd apps/worker

# 3.2 安装依赖（如果尚未安装）
npm install

# 3.3 启动应用
npm start
# 或者
npx expo start
```

**预期结果：**
- Expo开发服务器启动
- 可以看到工作邀请界面
- 工作详情页面正常显示

### 步骤4：测试核心功能

#### 4.1 公司端核心功能
1. **登录注册**
   - 手机号发送验证码
   - 验证码登录

2. **创建项目**
   - 填写项目基本信息
   - 选择技能要求（测试52个技能是否正常显示）
   - 设置时间安排
   - 选择工人
   - 确认发送

3. **项目详情**
   - 4个标签页正常切换
   - 工人进度显示

#### 4.2 工人端核心功能
1. **查看邀请**
   - 邀请列表显示
   - 筛选功能（新邀请/已接受）

2. **查看详情**
   - 工作详情完整显示
   - 接受/拒绝按钮显示（pending状态）

### 步骤5：对比测试（可选）
如果想确保新旧结构功能一致，可以：

1. 先在旧结构（MVP目录）运行：
```bash
cd MVP/backend-api && npm run dev
cd MVP && npm start
```
记录功能表现

2. 再在新结构运行：
```bash
cd backend && npm run dev
cd apps/company && npm start
```
对比功能是否一致

## 问题排查

### 如果后端启动失败：
1. 检查端口3000是否被占用：`lsof -i :3000`
2. 检查数据库连接：确认.env文件配置正确
3. 查看日志：`backend/logs/error.log`

### 如果前端启动失败：
1. 清理缓存：`npx expo start -c`
2. 检查API地址配置是否正确（应指向localhost:3000）
3. 重新安装依赖：`rm -rf node_modules && npm install`

## 测试完成标准
✅ 后端API正常启动并响应请求
✅ 公司端应用正常启动和运行
✅ 工人端应用正常启动和运行
✅ 核心功能（创建项目、查看邀请）正常工作
✅ 数据库连接和数据操作正常

## 注意事项
- 测试时保持旧目录（MVP、WorkerApp等）暂时不删除
- 如果测试全部通过，再删除旧目录
- 建议先备份数据库：`pg_dump blue_collar_platform > backup.sql`