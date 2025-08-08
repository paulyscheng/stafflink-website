-- ===========================
-- 邀请表 (Invitations Table)
-- ===========================
-- 用于记录公司向工人发送的工作邀请

CREATE TABLE IF NOT EXISTS invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- 关联信息
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    
    -- 邀请状态
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, expired, cancelled
    
    -- 邀请详情
    message TEXT, -- 公司发送的邀请消息
    wage_offer DECIMAL(10, 2), -- 提供的工资
    wage_type VARCHAR(20), -- hourly, daily, fixed
    
    -- 工人响应
    response_message TEXT, -- 工人的回复消息
    responded_at TIMESTAMP, -- 响应时间
    
    -- 时间戳
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- 邀请过期时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 确保同一个项目不会重复邀请同一个工人
    UNIQUE(project_id, worker_id)
);

-- 创建索引以优化查询
CREATE INDEX idx_invitations_project_id ON invitations(project_id);
CREATE INDEX idx_invitations_company_id ON invitations(company_id);
CREATE INDEX idx_invitations_worker_id ON invitations(worker_id);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_sent_at ON invitations(sent_at DESC);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);

-- 添加触发器自动更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invitations_updated_at 
    BEFORE UPDATE ON invitations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE invitations IS '工作邀请表';
COMMENT ON COLUMN invitations.id IS '邀请ID';
COMMENT ON COLUMN invitations.project_id IS '项目ID';
COMMENT ON COLUMN invitations.company_id IS '公司ID';
COMMENT ON COLUMN invitations.worker_id IS '工人ID';
COMMENT ON COLUMN invitations.status IS '邀请状态: pending(待响应), accepted(已接受), rejected(已拒绝), expired(已过期), cancelled(已取消)';
COMMENT ON COLUMN invitations.message IS '公司发送的邀请消息';
COMMENT ON COLUMN invitations.wage_offer IS '提供的工资金额';
COMMENT ON COLUMN invitations.wage_type IS '工资类型: hourly(按小时), daily(按天), fixed(固定)';
COMMENT ON COLUMN invitations.response_message IS '工人的回复消息';
COMMENT ON COLUMN invitations.responded_at IS '工人响应时间';
COMMENT ON COLUMN invitations.sent_at IS '邀请发送时间';
COMMENT ON COLUMN invitations.expires_at IS '邀请过期时间';
COMMENT ON COLUMN invitations.created_at IS '记录创建时间';
COMMENT ON COLUMN invitations.updated_at IS '记录更新时间';