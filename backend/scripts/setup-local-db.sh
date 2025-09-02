#!/bin/bash

echo "🚀 设置本地数据库环境..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker Desktop"
    echo "👉 https://www.docker.com/products/docker-desktop"
    exit 1
fi

# 停止并删除旧容器（如果存在）
echo "🧹 清理旧环境..."
docker-compose down 2>/dev/null

# 启动数据库
echo "🐘 启动 PostgreSQL..."
docker-compose up -d postgres

# 等待数据库就绪
echo "⏳ 等待数据库启动..."
sleep 5

# 检查连接
echo "🔍 检查数据库连接..."
docker exec stafflink-db pg_isready -U stafflink

if [ $? -eq 0 ]; then
    echo "✅ 数据库启动成功！"
    
    # 运行初始化脚本
    echo "📝 初始化数据库表..."
    
    # 复制 .env.local 为 .env
    cp .env.local .env
    
    # 运行所有创建表的脚本
    echo "创建基础表..."
    node src/scripts/createTables.js 2>/dev/null || echo "表可能已存在"
    
    echo "创建验证码表..."
    node src/scripts/createVerificationTable.js 2>/dev/null || echo "表可能已存在"
    
    echo "创建测试数据..."
    node src/scripts/createTestWorkers.js
    node src/scripts/createTestCompany.js
    
    echo ""
    echo "✅ 本地数据库设置完成！"
    echo ""
    echo "📊 数据库信息："
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: blue_collar_platform"
    echo "   Username: stafflink"
    echo "   Password: stafflink2024"
    echo ""
    echo "🔧 pgAdmin 管理界面："
    echo "   URL: http://localhost:5050"
    echo "   Email: admin@stafflink.com"
    echo "   Password: admin123"
    echo ""
    echo "🚀 启动后端服务："
    echo "   npm run dev"
else
    echo "❌ 数据库启动失败，请检查 Docker"
fi