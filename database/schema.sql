-- Blue Collar Platform - Complete Database Schema
-- Based on Enterprise App + Worker App Analysis

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- 用户管理表
-- ===========================

-- 企业用户表 (Enterprise App)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    address TEXT,
    business_license VARCHAR(100),
    rating DECIMAL(2,1) DEFAULT 0.0,
    total_projects INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, inactive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工人用户表 (Worker App)
CREATE TABLE workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    id_card VARCHAR(20),
    age INTEGER,
    gender VARCHAR(10), -- male, female, other
    address TEXT,
    rating DECIMAL(2,1) DEFAULT 0.0,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'offline', -- online, offline, busy
    experience_years INTEGER DEFAULT 0,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- 技能管理表 (143个技能)
-- ===========================

-- 技能表
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL, -- construction, food_beverage, manufacturing, logistics, general_services
    icon VARCHAR(10), -- emoji icon
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 工人技能关联表
CREATE TABLE worker_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level INTEGER DEFAULT 1, -- 1-5熟练度
    years_experience INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(worker_id, skill_id)
);

-- ===========================
-- 项目管理表 (Enterprise App 5-Step Wizard)
-- ===========================

-- 项目表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Step 1: Project Basic
    project_name VARCHAR(255) NOT NULL,
    project_address TEXT NOT NULL,
    project_type VARCHAR(50) NOT NULL, -- home_renovation, office_cleaning, etc.
    priority VARCHAR(20) DEFAULT 'normal', -- urgent, normal, low
    
    -- Step 2: Work Requirements
    required_workers INTEGER NOT NULL,
    work_description TEXT,
    experience_level VARCHAR(20) DEFAULT 'intermediate', -- beginner, intermediate, expert
    
    -- Step 3: Time Schedule & Salary
    time_nature VARCHAR(20) DEFAULT 'onetime', -- onetime, recurring
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    working_days JSONB, -- array of weekdays if recurring
    time_notes TEXT,
    payment_type VARCHAR(20) NOT NULL, -- hourly, daily, fixed
    budget_range VARCHAR(50) NOT NULL,
    estimated_duration VARCHAR(50),
    
    -- Step 4 & 5: Workers & Notification
    selected_workers JSONB, -- array of worker IDs
    notification_methods JSONB, -- SMS, push, etc.
    
    -- Project Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, in_progress, completed, cancelled
    urgency VARCHAR(20) DEFAULT 'normal', -- urgent, normal, low (from priority)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 项目技能要求表
CREATE TABLE project_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    required_level INTEGER DEFAULT 1, -- 1-5要求熟练度
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- 工作邀请系统 (Worker App Job Invitations)
-- ===========================

-- 工作邀请表
CREATE TABLE job_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    
    -- Invitation Details
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, expired
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP,
    worker_message TEXT, -- 工人回复的消息
    
    -- Location & Logistics
    distance DECIMAL(5,2), -- 距离(km)
    
    -- Company Contact Info (from CreateProjectWizard)
    company_contact JSONB, -- {name, phone}
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, worker_id)
);

-- ===========================
-- 工作执行记录 (HistoryScreen Data)
-- ===========================

-- 工作记录表 (实际工作执行记录)
CREATE TABLE job_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID REFERENCES job_invitations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Work Execution Details
    work_date DATE NOT NULL,
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    actual_duration_hours DECIMAL(4,2),
    actual_duration_text VARCHAR(50), -- "6小时" format
    
    -- Payment Details
    payment_amount DECIMAL(10,2),
    payment_type VARCHAR(20), -- hourly, daily, fixed
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, dispute
    
    -- Rating & Comments (Both directions)
    worker_rating DECIMAL(2,1), -- 企业对工人的评分
    company_rating DECIMAL(2,1), -- 工人对企业的评分
    worker_comment TEXT, -- 企业对工人的评价
    company_comment TEXT, -- 工人对企业的评价
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    completed_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- 认证与通知系统
-- ===========================

-- 认证token表
CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- company, worker
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, user_type)
);

-- 短信验证码表
CREATE TABLE sms_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(10) NOT NULL,
    purpose VARCHAR(20) NOT NULL, -- login, register, reset_password
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 通知表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL, -- company, worker
    type VARCHAR(50) NOT NULL, -- job_invitation, job_response, payment, etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,
    data JSONB, -- 额外的数据
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================
-- 索引优化
-- ===========================

CREATE INDEX idx_companies_phone ON companies(phone);
CREATE INDEX idx_companies_status ON companies(status);

CREATE INDEX idx_workers_phone ON workers(phone);
CREATE INDEX idx_workers_status ON workers(status);
CREATE INDEX idx_workers_rating ON workers(rating);

CREATE INDEX idx_worker_skills_worker_id ON worker_skills(worker_id);
CREATE INDEX idx_worker_skills_skill_id ON worker_skills(skill_id);

CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_start_date ON projects(start_date);

CREATE INDEX idx_project_skills_project_id ON project_skills(project_id);

CREATE INDEX idx_job_invitations_project_id ON job_invitations(project_id);
CREATE INDEX idx_job_invitations_worker_id ON job_invitations(worker_id);
CREATE INDEX idx_job_invitations_status ON job_invitations(status);

CREATE INDEX idx_job_records_worker_id ON job_records(worker_id);
CREATE INDEX idx_job_records_company_id ON job_records(company_id);
CREATE INDEX idx_job_records_work_date ON job_records(work_date);

CREATE INDEX idx_auth_tokens_user_id ON auth_tokens(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ===========================
-- 插入基础技能数据 (143个技能)
-- ===========================

INSERT INTO skills (name, category, icon) VALUES
-- 建筑装修 (Construction) - 19 skills
('水电安装', 'construction', '🔧'),
('电工', 'construction', '⚡'),
('木工', 'construction', '🪚'),
('油漆工', 'construction', '🎨'),
('铺砖工', 'construction', '🧱'),
('泥瓦工', 'construction', '🏗️'),
('防水工', 'construction', '💧'),
('吊顶安装', 'construction', '🏠'),
('玻璃安装', 'construction', '🪟'),
('水管工', 'construction', '🚰'),
('管道安装', 'construction', '🔧'),
('弱电工', 'construction', '📡'),
('锁匠', 'construction', '🔐'),
('家电维修', 'construction', '🔧'),
('钢筋工', 'construction', '⚙️'),
('混凝土工', 'construction', '🏗️'),
('焊工', 'construction', '🔥'),
('脚手架工', 'construction', '🏗️'),
('测量员', 'construction', '📐'),

-- 餐饮服务 (Food & Beverage) - 30 skills
('咖啡师', 'food_beverage', '☕'),
('服务员', 'food_beverage', '🍽️'),
('收银员', 'food_beverage', '💰'),
('清洁工', 'food_beverage', '🧹'),
('厨师', 'food_beverage', '👨‍🍳'),
('厨房助手', 'food_beverage', '🥘'),
('洗碗工', 'food_beverage', '🍽️'),
('操作员', 'food_beverage', '⚙️'),
('调酒师', 'food_beverage', '🍸'),
('面点师', 'food_beverage', '🥖'),
('配菜员', 'food_beverage', '🥗'),
('传菜员', 'food_beverage', '🏃'),
('迎宾员', 'food_beverage', '🙋'),
('保洁员', 'food_beverage', '🧽'),
('厨房清洁', 'food_beverage', '🧹'),
('食品包装', 'food_beverage', '📦'),
('库房管理', 'food_beverage', '📋'),
('采购助理', 'food_beverage', '🛒'),
('营业员', 'food_beverage', '👥'),
('前台接待', 'food_beverage', '🎫'),
('饮品制作', 'food_beverage', '🧋'),
('烘焙师', 'food_beverage', '🍰'),
('蛋糕装饰', 'food_beverage', '🎂'),
('水果切配', 'food_beverage', '🍓'),
('食材处理', 'food_beverage', '🥬'),
('餐具清洗', 'food_beverage', '🍴'),
('外卖配送', 'food_beverage', '🛵'),
('店面维护', 'food_beverage', '🏪'),
('设备维修', 'food_beverage', '⚙️'),
('卫生检查', 'food_beverage', '✅'),

-- 制造业 (Manufacturing) - 30 skills
('生产操作', 'manufacturing', '⚙️'),
('质检员', 'manufacturing', '🔍'),
('包装工', 'manufacturing', '📦'),
('装配工', 'manufacturing', '🔧'),
('普工', 'manufacturing', '👷'),
('机器操作', 'manufacturing', '🏭'),
('流水线工', 'manufacturing', '⚡'),
('仓库管理', 'manufacturing', '📦'),
('叉车司机', 'manufacturing', '🚛'),
('设备维护', 'manufacturing', '🔧'),
('电子装配', 'manufacturing', '🔌'),
('焊接工', 'manufacturing', '🔥'),
('车床工', 'manufacturing', '⚙️'),
('铣床工', 'manufacturing', '🔧'),
('钳工', 'manufacturing', '🔧'),
('模具工', 'manufacturing', '⚒️'),
('冲压工', 'manufacturing', '⚡'),
('涂装工', 'manufacturing', '🎨'),
('抛光工', 'manufacturing', '✨'),
('检验员', 'manufacturing', '🔍'),
('计量员', 'manufacturing', '📏'),
('实验员', 'manufacturing', '🧪'),
('技术员', 'manufacturing', '👨‍💻'),
('维修工', 'manufacturing', '🔧'),
('电工', 'manufacturing', '⚡'),
('机械师', 'manufacturing', '⚙️'),
('调试员', 'manufacturing', '🎛️'),
('安全员', 'manufacturing', '🦺'),
('环保员', 'manufacturing', '🌱'),
('统计员', 'manufacturing', '📊'),

-- 物流运输 (Logistics) - 32 skills
('搬运工', 'logistics', '📦'),
('装卸工', 'logistics', '🏗️'),
('分拣员', 'logistics', '📋'),
('配送员', 'logistics', '🚚'),
('司机', 'logistics', '🚛'),
('快递员', 'logistics', '📮'),
('仓管员', 'logistics', '📦'),
('理货员', 'logistics', '📋'),
('打包员', 'logistics', '📦'),
('称重员', 'logistics', '⚖️'),
('录单员', 'logistics', '📝'),
('调度员', 'logistics', '📞'),
('货运代理', 'logistics', '🚚'),
('报关员', 'logistics', '📄'),
('验货员', 'logistics', '🔍'),
('客服员', 'logistics', '📞'),
('网点管理', 'logistics', '🏪'),
('路线规划', 'logistics', '🗺️'),
('车辆调度', 'logistics', '🚛'),
('货物跟踪', 'logistics', '📍'),
('库存盘点', 'logistics', '📊'),
('单据处理', 'logistics', '📄'),
('货损处理', 'logistics', '⚠️'),
('退换货', 'logistics', '↩️'),
('物流规划', 'logistics', '📋'),
('成本核算', 'logistics', '💰'),
('供应链', 'logistics', '🔗'),
('采购助理', 'logistics', '🛒'),
('订单处理', 'logistics', '📝'),
('发货员', 'logistics', '📦'),
('收货员', 'logistics', '📥'),
('运输协调', 'logistics', '🚚'),

-- 通用服务 (General Services) - 32 skills
('保安', 'general_services', '👮'),
('门卫', 'general_services', '🚪'),
('维修工', 'general_services', '🔧'),
('园艺工', 'general_services', '🌱'),
('临时工', 'general_services', '👷'),
('保洁员', 'general_services', '🧹'),
('保姆', 'general_services', '👶'),
('护工', 'general_services', '👩‍⚕️'),
('月嫂', 'general_services', '🍼'),
('育儿嫂', 'general_services', '👶'),
('钟点工', 'general_services', '⏰'),
('家政服务', 'general_services', '🏠'),
('管道疏通', 'general_services', '🚰'),
('家具安装', 'general_services', '🪑'),
('家电清洗', 'general_services', '🔌'),
('地毯清洗', 'general_services', '🧽'),
('玻璃清洁', 'general_services', '🪟'),
('外墙清洗', 'general_services', '🏢'),
('空调维修', 'general_services', '❄️'),
('电器维修', 'general_services', '⚡'),
('锁具维修', 'general_services', '🔐'),
('管家服务', 'general_services', '🏠'),
('宠物护理', 'general_services', '🐕'),
('老人陪护', 'general_services', '👴'),
('病人护理', 'general_services', '🏥'),
('接送服务', 'general_services', '🚗'),
('代买代购', 'general_services', '🛒'),
('排队代办', 'general_services', '📝'),
('活动助理', 'general_services', '🎉'),
('礼仪服务', 'general_services', '👔'),
('翻译助理', 'general_services', '🗣️'),
('数据录入', 'general_services', '💻');

-- ===========================
-- 触发器：自动更新时间戳
-- ===========================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为主要表添加自动更新触发器
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_invitations_updated_at BEFORE UPDATE ON job_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_records_updated_at BEFORE UPDATE ON job_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();