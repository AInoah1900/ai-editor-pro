-- 更新数据库结构，添加缺失的字段
-- 用于支持多知识库功能

-- 为 knowledge_items 表添加所有权类型和所有者ID字段
ALTER TABLE knowledge_items 
ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(20) DEFAULT 'shared',
ADD COLUMN IF NOT EXISTS owner_id VARCHAR(255) DEFAULT NULL;

-- 为 file_metadata 表添加所有权类型和所有者ID字段
ALTER TABLE file_metadata 
ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(20) DEFAULT 'shared',
ADD COLUMN IF NOT EXISTS owner_id VARCHAR(255) DEFAULT NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_knowledge_items_ownership ON knowledge_items(ownership_type);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_owner ON knowledge_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_file_metadata_ownership ON file_metadata(ownership_type);
CREATE INDEX IF NOT EXISTS idx_file_metadata_owner ON file_metadata(owner_id);

-- 更新现有示例数据的所有权类型
UPDATE knowledge_items 
SET ownership_type = 'shared', owner_id = NULL 
WHERE ownership_type IS NULL;

-- 更新现有文件元数据的所有权类型
UPDATE file_metadata 
SET ownership_type = 'shared', owner_id = NULL 
WHERE ownership_type IS NULL;

-- 创建更新后的统计视图
CREATE OR REPLACE VIEW knowledge_stats_extended AS
SELECT 
    COUNT(*) as total_knowledge_items,
    COUNT(DISTINCT domain) as unique_domains,
    COUNT(DISTINCT type) as unique_types,
    COUNT(DISTINCT ownership_type) as unique_ownership_types,
    AVG(confidence) as avg_confidence,
    MAX(created_at) as last_created,
    MAX(updated_at) as last_updated,
    COUNT(CASE WHEN ownership_type = 'private' THEN 1 END) as private_items,
    COUNT(CASE WHEN ownership_type = 'shared' THEN 1 END) as shared_items
FROM knowledge_items;

-- 创建更新后的文件统计视图
CREATE OR REPLACE VIEW file_stats_extended AS
SELECT 
    COUNT(*) as total_files,
    COUNT(DISTINCT domain) as unique_domains,
    COUNT(DISTINCT file_type) as unique_file_types,
    COUNT(DISTINCT ownership_type) as unique_ownership_types,
    SUM(file_size) as total_size,
    MAX(upload_time) as last_upload,
    COUNT(CASE WHEN ownership_type = 'private' THEN 1 END) as private_files,
    COUNT(CASE WHEN ownership_type = 'shared' THEN 1 END) as shared_files
FROM file_metadata;

-- 显示更新结果
SELECT 'Database schema update completed successfully!' as status;

-- 显示更新后的统计信息
SELECT * FROM knowledge_stats_extended;
SELECT * FROM file_stats_extended; 