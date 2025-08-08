# StaffLink Platform

蓝领工人调度平台 - 连接企业与技能工人

## 项目结构

```
├── backend/           # 统一的后端API服务
├── apps/              
│   ├── company/       # 企业端应用 (React Native/Expo)
│   └── worker/        # 工人端应用 (React Native/Expo)
├── shared/            # 共享代码库
├── database/          # 数据库schema和迁移脚本
└── docs/              # 项目文档
```

## 快速开始

### 安装依赖
```bash
npm install:all
```

### 启动后端服务
```bash
npm run backend
```

### 启动企业端应用
```bash
npm run company
```

### 启动工人端应用
```bash
npm run worker
```

### 同时启动后端和企业端
```bash
npm run dev
```

## 环境要求

- Node.js 16+
- PostgreSQL 14+
- Expo CLI
- React Native development environment

## 数据库设置

1. 创建数据库
```bash
createdb blue_collar_platform
```

2. 导入schema
```bash
psql -d blue_collar_platform -f database/schema.sql
```

## API文档

请查看 `docs/API.md` 了解API详情

## 开发指南

请查看 `docs/CLAUDE.md` 了解项目架构和开发规范