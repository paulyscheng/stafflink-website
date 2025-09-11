# 开发环境配置指南

## 🚀 快速开始

### 1. 配置本地IP地址

每个开发者需要配置自己的本地IP地址才能在真机上测试。

#### 查看本机IP地址

**Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```cmd
ipconfig
```

**Linux:**
```bash
ip addr show | grep "inet " | grep -v 127.0.0.1
```

#### 配置环境变量

1. **工人端应用**
```bash
cd apps/worker
cp .env.example .env
# 编辑 .env 文件，修改 API_URL 为你的IP地址
# 例如: API_URL=http://192.168.1.100:3000/api
```

2. **企业端应用**
```bash
cd apps/company
cp .env.example .env
# 编辑 .env 文件，修改 API_URL 为你的IP地址
# 例如: API_URL=http://192.168.1.100:3000/api
```

3. **后端服务**
```bash
cd backend
cp .env.example .env
# 编辑 .env 文件，配置数据库等信息
```

### 2. 启动服务

#### 启动后端
```bash
cd backend
npm run dev
```

#### 启动工人端
```bash
cd apps/worker
npm start
```

#### 启动企业端
```bash
cd apps/company
npm start
```

## 📱 真机测试

1. 确保手机和电脑在**同一个Wi-Fi网络**
2. 手机上安装 Expo Go 应用
3. 扫描终端显示的二维码
4. 如果无法连接，检查：
   - 防火墙是否阻止了3000端口
   - .env文件中的IP地址是否正确
   - 是否需要重启Expo（Ctrl+C 后重新 npm start）

## 🧪 测试账号

### 工人端
- 手机号：13800138001-13800138010
- 验证码：123456

### 企业端
- 手机号：13900139000
- 验证码：123456

## ⚠️ 注意事项

1. **.env文件不要提交到Git**（已在.gitignore中配置）
2. 每次修改.env后需要**重启Expo**
3. IP地址可能会变化（如切换网络后），需要重新配置
4. 生产环境会自动使用正式的API地址

## 🤝 团队协作

当你的同事需要运行项目时：

1. 克隆代码
2. 安装依赖：`npm install`
3. **重要**：复制.env.example为.env并修改成自己的IP
4. 启动项目

## 🐛 常见问题

### Q: 手机无法连接到API
A: 检查：
- 手机和电脑是否在同一网络
- .env中的IP地址是否正确
- 防火墙设置
- 是否重启了Expo

### Q: Network request failed
A: 通常是IP地址配置错误，检查.env文件

### Q: 如何查看当前使用的API地址
A: 在开发模式下，打开应用会在console中打印当前API地址