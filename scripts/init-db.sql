-- PostgreSQL 数据库初始化脚本
-- 用于 RAG 知识库系统

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建文件元数据表
CREATE TABLE IF NOT EXISTS file_metadata (
    id VARCHAR(255) PRIMARY KEY,
    filename VARCHAR(500) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    upload_time TIMESTAMP NOT NULL,
    vector_id VARCHAR(255) NOT NULL,
    content_hash VARCHAR(255) NOT NULL,
    domain VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建知识项表
CREATE TABLE IF NOT EXISTS knowledge_items (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    context TEXT,
    source VARCHAR(255) NOT NULL,
    confidence DECIMAL(3,2) NOT NULL,
    tags TEXT[],
    vector_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_file_metadata_domain ON file_metadata(domain);
CREATE INDEX IF NOT EXISTS idx_file_metadata_upload_time ON file_metadata(upload_time);
CREATE INDEX IF NOT EXISTS idx_file_metadata_vector_id ON file_metadata(vector_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_domain ON knowledge_items(domain);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_type ON knowledge_items(type);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_vector_id ON knowledge_items(vector_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_confidence ON knowledge_items(confidence);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表添加更新时间触发器
DROP TRIGGER IF EXISTS update_file_metadata_updated_at ON file_metadata;
CREATE TRIGGER update_file_metadata_updated_at
    BEFORE UPDATE ON file_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_items_updated_at ON knowledge_items;
CREATE TRIGGER update_knowledge_items_updated_at
    BEFORE UPDATE ON knowledge_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入一些示例数据（可选）
INSERT INTO knowledge_items (id, type, domain, content, context, source, confidence, tags, vector_id) VALUES
('sample_1', 'terminology', 'academic', '研究方法', '学术写作中的研究方法描述', '系统预设', 0.9, ARRAY['学术', '方法'], 'sample_vector_1'),
('sample_2', 'rule', 'technical', '代码规范', '编程代码的命名和格式规范', '系统预设', 0.8, ARRAY['技术', '规范'], 'sample_vector_2'),
('sample_3', 'case', 'business', '市场分析', '商业文档中的市场分析方法', '系统预设', 0.85, ARRAY['商业', '分析'], 'sample_vector_3')
ON CONFLICT (id) DO NOTHING;

-- 创建视图用于统计查询
CREATE OR REPLACE VIEW knowledge_stats AS
SELECT 
    COUNT(*) as total_knowledge_items,
    COUNT(DISTINCT domain) as unique_domains,
    COUNT(DISTINCT type) as unique_types,
    AVG(confidence) as avg_confidence,
    MAX(created_at) as last_created,
    MAX(updated_at) as last_updated
FROM knowledge_items;

-- 创建视图用于文件统计
CREATE OR REPLACE VIEW file_stats AS
SELECT 
    COUNT(*) as total_files,
    COUNT(DISTINCT domain) as unique_domains,
    COUNT(DISTINCT file_type) as unique_file_types,
    SUM(file_size) as total_size,
    MAX(upload_time) as last_upload
FROM file_metadata;

-- 显示创建结果
SELECT 'Database initialization completed successfully!' as status; 