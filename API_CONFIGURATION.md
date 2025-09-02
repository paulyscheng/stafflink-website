# API配置说明

## 问题描述
当点击工人端的工作详情时，可能会显示"API request failed"错误。这通常是由于API URL配置不正确导致的。

## 解决方案

### 1. 检查API服务器地址
确保后端服务器正在运行：
```bash
cd backend
NODE_ENV=development npm run dev
```

### 2. 配置正确的API地址

#### 本地开发（模拟器）
如果使用iOS模拟器或Android模拟器：
- iOS模拟器：使用 `http://localhost:3000/api`
- Android模拟器：使用 `http://10.0.2.2:3000/api`

#### 本地开发（真机）
如果使用真机调试：
1. 确保手机和电脑在同一个网络
2. 查找电脑的IP地址：
   - Mac: `ifconfig | grep inet`
   - Windows: `ipconfig`
3. 使用你的电脑IP地址，例如：`http://192.168.1.100:3000/api`

### 3. 更新配置文件

#### 工人端应用
编辑 `/apps/worker/src/config.js`:
```javascript
export const API_URL = 'http://你的IP地址:3000/api';
```

#### 企业端应用
编辑 `/apps/company/src/config/index.js`:
```javascript
export const API_URL = 'http://你的IP地址:3000/api';
```

### 4. 重启应用
修改配置后，需要重启React Native应用：
1. 停止Metro bundler (Ctrl+C)
2. 重新启动：`npm start`
3. 在模拟器/真机上重新加载应用

## 常见问题

### "Network request failed" 错误
- 检查后端服务器是否正在运行
- 检查防火墙设置
- 确保使用正确的IP地址和端口

### "无法连接到服务器" 错误
- 检查网络连接
- 确保手机/模拟器能访问到服务器地址
- 尝试在浏览器中访问 `http://你的IP地址:3000/api` 看是否能连接

### 验证码错误
开发环境的测试账号验证码是动态生成的，可以通过以下命令查看：
```bash
cd backend
NODE_ENV=development node -e "
const config = require('./src/config/environment');
console.log('Test accounts:', JSON.stringify(config.testAccounts, null, 2));
"
```

## 生产环境部署
在生产环境中，应该：
1. 使用环境变量配置API地址
2. 使用HTTPS而不是HTTP
3. 配置正确的域名和SSL证书