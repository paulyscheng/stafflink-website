require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 判断是否需要SSL
const needsSSL = process.env.DB_SSLMODE === 'require';
const sslPath = path.join(__dirname, '../../ssl/ca.pem');
const sslExists = fs.existsSync(sslPath);

// PostgreSQL连接配置
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'blue_collar_platform',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 60000,
  application_name: 'blue-collar-migration',
};

// 如果需要SSL且证书存在，使用SSL连接
if (needsSSL && sslExists) {
  poolConfig.ssl = {
    ca: fs.readFileSync(sslPath),
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined
  };
} else if (needsSSL && !sslExists) {
  // 如果需要SSL但证书不存在，使用简单的SSL配置（腾讯云）
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

async function addIndustryColumn() {
    const client = await pool.connect();
    
    try {
        console.log('开始添加 industry 字段到 companies 表...');
        
        // 添加 industry 列
        await client.query(`
            ALTER TABLE companies 
            ADD COLUMN IF NOT EXISTS industry VARCHAR(50);
        `);
        
        console.log('✅ industry 字段添加成功');
        
        // 为现有记录设置默认值
        const updateResult = await client.query(`
            UPDATE companies 
            SET industry = 'other' 
            WHERE industry IS NULL;
        `);
        
        console.log(`✅ 更新了 ${updateResult.rowCount} 条现有记录的 industry 字段`);
        
        // 显示所有行业选项
        console.log('\n可用的行业类型：');
        console.log('- construction: 建筑装修业');
        console.log('- foodservice: 餐饮服务业');
        console.log('- manufacturing: 制造业');
        console.log('- logistics: 物流仓储');
        console.log('- other: 其他服务');
        
    } catch (error) {
        console.error('添加 industry 字段失败:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function checkCompaniesWithIndustry() {
    const client = await pool.connect();
    
    try {
        console.log('\n检查 companies 表结构...');
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'companies' 
            ORDER BY ordinal_position;
        `);
        
        console.log('\ncompanies 表字段：');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name}: ${row.data_type}`);
        });
        
        // 查看现有公司数据
        const companies = await client.query('SELECT id, company_name, industry FROM companies LIMIT 5');
        console.log('\n现有公司示例：');
        companies.rows.forEach(company => {
            console.log(`- ${company.company_name}: ${company.industry || '(未设置)'}`);
        });
        
    } finally {
        client.release();
    }
}

// 执行迁移
(async () => {
    try {
        await addIndustryColumn();
        await checkCompaniesWithIndustry();
        console.log('\n✅ 数据库迁移完成！');
        process.exit(0);
    } catch (error) {
        console.error('迁移失败:', error);
        process.exit(1);
    }
})();