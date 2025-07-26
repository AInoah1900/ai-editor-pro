"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModels = void 0;
const pg_1 = require("pg");
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// 从环境变量读取PostgreSQL配置
const getPostgreSQLConfig = () => {
    return {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DB || 'postgres',
        user: process.env.POSTGRES_USER || 'myuser',
        password: process.env.POSTGRES_PASSWORD || '12345678',
        max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
        idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '2000'),
    };
};
/**
 * PostgreSQL 数据库连接池
 */
class DatabasePool {
    constructor() {
        this.pool = new pg_1.Pool(getPostgreSQLConfig());
        // 错误处理
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }
    /**
     * 获取数据库连接
     */
    async getClient() {
        return await this.pool.connect();
    }
    /**
     * 关闭连接池
     */
    async close() {
        await this.pool.end();
    }
}
// 创建全局数据库连接池实例
const dbPool = new DatabasePool();
/**
 * 数据库模型类
 */
class DatabaseModels {
    constructor() {
        this.pool = dbPool;
    }
    /**
     * 初始化数据库表
     */
    async initializeTables() {
        const client = await this.pool.getClient();
        try {
            // 创建文件元数据表
            await client.query(`
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
          ownership_type VARCHAR(10) NOT NULL,
          owner_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 创建知识项表
            await client.query(`
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
          ownership_type VARCHAR(10) DEFAULT 'shared',
          owner_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 创建用户角色表
            await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          display_name VARCHAR(200) NOT NULL,
          description TEXT,
          permissions TEXT[] DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 创建用户表
            await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          nickname VARCHAR(200) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          avatar_url TEXT,
          password_hash VARCHAR(255) NOT NULL,
          role_id VARCHAR(255) REFERENCES roles(id),
          publisher_name VARCHAR(500),
          publisher_website TEXT,
          publisher_submission_template TEXT,
          journal_domain VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          phone_verified BOOLEAN DEFAULT false,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 创建会话表
            await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          access_token TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 创建用户配置表
            await client.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          bio TEXT,
          preferences JSONB DEFAULT '{}',
          notification_settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
            // 更新现有表，添加用户关联
            await client.query(`
        ALTER TABLE file_metadata 
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) REFERENCES users(id)
      `);
            await client.query(`
        ALTER TABLE knowledge_items 
        ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) REFERENCES users(id)
      `);
            // 创建索引
            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_file_metadata_domain ON file_metadata(domain);
        CREATE INDEX IF NOT EXISTS idx_file_metadata_upload_time ON file_metadata(upload_time);
        CREATE INDEX IF NOT EXISTS idx_knowledge_items_domain ON knowledge_items(domain);
        CREATE INDEX IF NOT EXISTS idx_knowledge_items_type ON knowledge_items(type);
        CREATE INDEX IF NOT EXISTS idx_knowledge_items_vector_id ON knowledge_items(vector_id);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
      `);
            // 初始化默认角色
            await this.initializeDefaultRoles();
            console.log('数据库表初始化完成（包含用户认证系统）');
        }
        catch (error) {
            console.error('数据库表初始化失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 初始化默认角色
     */
    async initializeDefaultRoles() {
        const defaultRoles = [
            {
                id: 'role_author',
                name: 'author',
                display_name: '作者',
                description: '文章作者，可以上传和编辑自己的文档',
                permissions: ['document:create', 'document:read_own', 'document:update_own', 'document:delete_own']
            },
            {
                id: 'role_editor',
                name: 'editor',
                display_name: '编辑',
                description: '期刊编辑，可以编辑和审核文档',
                permissions: [
                    'document:create', 'document:read', 'document:update', 'document:delete',
                    'knowledge:read', 'knowledge:create', 'review:create', 'review:update'
                ]
            },
            {
                id: 'role_chief_editor',
                name: 'chief_editor',
                display_name: '主编',
                description: '主编，拥有期刊管理权限',
                permissions: [
                    'document:*', 'knowledge:*', 'review:*', 'user:read', 'user:update',
                    'analytics:read', 'settings:update'
                ]
            },
            {
                id: 'role_reviewer',
                name: 'reviewer',
                display_name: '审稿专家',
                description: '审稿专家，可以审阅和评论文档',
                permissions: ['document:read', 'review:create', 'review:update', 'comment:create']
            },
            {
                id: 'role_admin',
                name: 'admin',
                display_name: '系统管理员',
                description: '系统管理员，拥有所有权限',
                permissions: ['*']
            }
        ];
        for (const role of defaultRoles) {
            await this.createRole(role);
        }
    }
    /**
     * 添加文件元数据
     */
    async addFileMetadata(metadata) {
        const client = await this.pool.getClient();
        try {
            await client.query(`
        INSERT INTO file_metadata (
          id, filename, file_path, file_size, file_type, upload_time,
          vector_id, content_hash, domain, tags, ownership_type, owner_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (id) DO UPDATE SET
          filename = EXCLUDED.filename,
          file_path = EXCLUDED.file_path,
          file_size = EXCLUDED.file_size,
          file_type = EXCLUDED.file_type,
          upload_time = EXCLUDED.upload_time,
          vector_id = EXCLUDED.vector_id,
          content_hash = EXCLUDED.content_hash,
          domain = EXCLUDED.domain,
          tags = EXCLUDED.tags,
          ownership_type = EXCLUDED.ownership_type,
          owner_id = EXCLUDED.owner_id,
          updated_at = CURRENT_TIMESTAMP
      `, [
                metadata.id,
                metadata.filename,
                metadata.file_path,
                metadata.file_size,
                metadata.file_type,
                metadata.upload_time,
                metadata.vector_id,
                metadata.content_hash,
                metadata.domain,
                metadata.tags,
                metadata.ownership_type,
                metadata.owner_id,
                metadata.created_at,
                metadata.updated_at,
            ]);
            console.log(`文件元数据 ${metadata.id} 添加成功`);
        }
        catch (error) {
            console.error('添加文件元数据失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 添加知识项
     */
    async addKnowledgeItem(item) {
        const client = await this.pool.getClient();
        try {
            await client.query(`
        INSERT INTO knowledge_items (
          id, type, domain, content, context, source, confidence,
          tags, vector_id, ownership_type, owner_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          type = EXCLUDED.type,
          domain = EXCLUDED.domain,
          content = EXCLUDED.content,
          context = EXCLUDED.context,
          source = EXCLUDED.source,
          confidence = EXCLUDED.confidence,
          tags = EXCLUDED.tags,
          vector_id = EXCLUDED.vector_id,
          ownership_type = EXCLUDED.ownership_type,
          owner_id = EXCLUDED.owner_id,
          updated_at = CURRENT_TIMESTAMP
      `, [
                item.id,
                item.type,
                item.domain,
                item.content,
                item.context,
                item.source,
                item.confidence,
                item.tags,
                item.vector_id,
                item.ownership_type || 'shared',
                item.owner_id || null,
                item.created_at,
                item.updated_at,
            ]);
            console.log(`知识项 ${item.id} 添加成功`);
        }
        catch (error) {
            console.error('添加知识项失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 根据向量ID获取知识项
     */
    async getKnowledgeItemByVectorId(vectorId) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM knowledge_items WHERE vector_id = $1
      `, [vectorId]);
            if (result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        }
        catch (error) {
            console.error('获取知识项失败:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取知识库统计信息
     */
    async getKnowledgeStats() {
        var _a;
        const client = await this.pool.getClient();
        try {
            // 首先确保表存在
            await this.initializeTables();
            // 获取文件统计
            const fileStats = await client.query(`
        SELECT COUNT(*) as total_files FROM file_metadata
      `);
            // 获取知识项统计
            const knowledgeStats = await client.query(`
        SELECT COUNT(*) as total_knowledge_items FROM knowledge_items
      `);
            // 获取领域分布
            const domainStats = await client.query(`
        SELECT domain, COUNT(*) as count 
        FROM knowledge_items 
        GROUP BY domain
      `);
            // 获取类型分布
            const typeStats = await client.query(`
        SELECT type, COUNT(*) as count 
        FROM knowledge_items 
        GROUP BY type
      `);
            // 获取最后更新时间
            const lastUpdated = await client.query(`
        SELECT MAX(updated_at) as last_updated FROM knowledge_items
      `);
            const domains = {};
            domainStats.rows.forEach((row) => {
                domains[row.domain] = parseInt(row.count);
            });
            const types = {};
            typeStats.rows.forEach((row) => {
                types[row.type] = parseInt(row.count);
            });
            return {
                total_files: parseInt(fileStats.rows[0].total_files),
                total_knowledge_items: parseInt(knowledgeStats.rows[0].total_knowledge_items),
                domains,
                types,
                last_updated: ((_a = lastUpdated.rows[0]) === null || _a === void 0 ? void 0 : _a.last_updated) || new Date().toISOString(),
            };
        }
        catch (error) {
            console.error('获取知识库统计失败:', error);
            return {
                total_files: 0,
                total_knowledge_items: 0,
                domains: {},
                types: {},
                last_updated: new Date().toISOString(),
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 删除知识项
     */
    async deleteKnowledgeItem(id) {
        const client = await this.pool.getClient();
        try {
            await client.query(`
        DELETE FROM knowledge_items WHERE id = $1
      `, [id]);
            console.log(`知识项 ${id} 删除成功`);
        }
        catch (error) {
            console.error('删除知识项失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 删除文件元数据
     */
    async deleteFileMetadata(id) {
        const client = await this.pool.getClient();
        try {
            await client.query(`
        DELETE FROM file_metadata WHERE id = $1
      `, [id]);
            console.log(`文件元数据 ${id} 删除成功`);
        }
        catch (error) {
            console.error('删除文件元数据失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 根据领域获取相关文档
     */
    async getFilesByDomain(domain) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM file_metadata 
        WHERE domain = $1 
        ORDER BY upload_time DESC
      `, [domain]);
            return result.rows;
        }
        catch (error) {
            console.error('获取领域文档失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 根据向量ID获取文件元数据
     */
    async getFileByVectorId(vectorId) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM file_metadata WHERE vector_id = $1
      `, [vectorId]);
            if (result.rows.length > 0) {
                return result.rows[0];
            }
            return null;
        }
        catch (error) {
            console.error('获取文件元数据失败:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    /**
     * 搜索相关文档 (基于关键词和领域)
     */
    async searchRelatedFiles(query, domain, limit = 10) {
        const client = await this.pool.getClient();
        try {
            let sql = `
        SELECT * FROM file_metadata 
        WHERE (filename ILIKE $1 OR tags && ARRAY[$2])
      `;
            const params = [`%${query}%`, query];
            if (domain) {
                sql += ` AND domain = $3`;
                params.push(domain);
                sql += ` ORDER BY upload_time DESC LIMIT $4`;
                params.push(limit);
            }
            else {
                sql += ` ORDER BY upload_time DESC LIMIT $3`;
                params.push(limit);
            }
            const result = await client.query(sql, params);
            return result.rows;
        }
        catch (error) {
            console.error('搜索相关文档失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取所有文档
     */
    async getAllFiles(limit = 50) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM file_metadata 
        ORDER BY upload_time DESC 
        LIMIT $1
      `, [limit]);
            return result.rows;
        }
        catch (error) {
            console.error('获取所有文档失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取专属知识库文档
     */
    async getPrivateFiles(ownerId, limit = 50) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM file_metadata 
        WHERE ownership_type = 'private' AND owner_id = $1
        ORDER BY upload_time DESC 
        LIMIT $2
      `, [ownerId, limit]);
            return result.rows;
        }
        catch (error) {
            console.error('获取专属知识库文档失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取共享知识库文档
     */
    async getSharedFiles(limit = 50) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM file_metadata 
        WHERE ownership_type = 'shared'
        ORDER BY upload_time DESC 
        LIMIT $1
      `, [limit]);
            return result.rows;
        }
        catch (error) {
            console.error('获取共享知识库文档失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取专属知识项
     */
    async getPrivateKnowledgeItems(ownerId, limit = 50) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM knowledge_items 
        WHERE ownership_type = 'private' AND owner_id = $1
        ORDER BY created_at DESC 
        LIMIT $2
      `, [ownerId, limit]);
            return result.rows;
        }
        catch (error) {
            console.error('获取专属知识项失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取共享知识项
     */
    async getSharedKnowledgeItems(limit = 50) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM knowledge_items 
        WHERE ownership_type = 'shared' OR ownership_type IS NULL
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);
            return result.rows;
        }
        catch (error) {
            console.error('获取共享知识项失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取知识库文档统计
     */
    async getKnowledgeLibraryStats() {
        const client = await this.pool.getClient();
        try {
            // 获取专属文档统计
            const privateStats = await client.query(`
        SELECT COUNT(*) as total_private FROM file_metadata 
        WHERE ownership_type = 'private'
      `);
            // 获取共享文档统计
            const sharedStats = await client.query(`
        SELECT COUNT(*) as total_shared FROM file_metadata 
        WHERE ownership_type = 'shared'
      `);
            // 获取专属文档按领域分布
            const privateDomainStats = await client.query(`
        SELECT domain, COUNT(*) as count 
        FROM file_metadata 
        WHERE ownership_type = 'private' AND domain IS NOT NULL
        GROUP BY domain
      `);
            // 获取共享文档按领域分布
            const sharedDomainStats = await client.query(`
        SELECT domain, COUNT(*) as count 
        FROM file_metadata 
        WHERE ownership_type = 'shared' AND domain IS NOT NULL
        GROUP BY domain
      `);
            const private_by_domain = {};
            privateDomainStats.rows.forEach((row) => {
                private_by_domain[row.domain] = parseInt(row.count);
            });
            const shared_by_domain = {};
            sharedDomainStats.rows.forEach((row) => {
                shared_by_domain[row.domain] = parseInt(row.count);
            });
            return {
                total_private: parseInt(privateStats.rows[0].total_private),
                total_shared: parseInt(sharedStats.rows[0].total_shared),
                private_by_domain,
                shared_by_domain,
            };
        }
        catch (error) {
            console.error('获取知识库统计失败:', error);
            return {
                total_private: 0,
                total_shared: 0,
                private_by_domain: {},
                shared_by_domain: {},
            };
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取所有知识项（按创建时间排序）
     */
    async getAllKnowledgeItems(limit = 50) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM knowledge_items 
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);
            return result.rows;
        }
        catch (error) {
            console.error('获取所有知识项失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取知识项统计（按所有权类型）
     */
    async getKnowledgeItemsStats() {
        const client = await this.pool.getClient();
        try {
            // 获取专属知识项统计
            const privateStats = await client.query(`
        SELECT COUNT(*) as total_private FROM knowledge_items 
        WHERE ownership_type = 'private'
      `);
            // 获取共享知识项统计
            const sharedStats = await client.query(`
        SELECT COUNT(*) as total_shared FROM knowledge_items 
        WHERE ownership_type = 'shared' OR ownership_type IS NULL
      `);
            // 获取专属知识项按领域分布
            const privateDomainStats = await client.query(`
        SELECT domain, COUNT(*) as count 
        FROM knowledge_items 
        WHERE ownership_type = 'private' AND domain IS NOT NULL
        GROUP BY domain
      `);
            // 获取共享知识项按领域分布
            const sharedDomainStats = await client.query(`
        SELECT domain, COUNT(*) as count 
        FROM knowledge_items 
        WHERE (ownership_type = 'shared' OR ownership_type IS NULL) AND domain IS NOT NULL
        GROUP BY domain
      `);
            const private_by_domain = {};
            privateDomainStats.rows.forEach((row) => {
                private_by_domain[row.domain] = parseInt(row.count);
            });
            const shared_by_domain = {};
            sharedDomainStats.rows.forEach((row) => {
                shared_by_domain[row.domain] = parseInt(row.count);
            });
            return {
                total_private: parseInt(privateStats.rows[0].total_private),
                total_shared: parseInt(sharedStats.rows[0].total_shared),
                private_by_domain,
                shared_by_domain,
            };
        }
        catch (error) {
            console.error('获取知识项统计失败:', error);
            return {
                total_private: 0,
                total_shared: 0,
                private_by_domain: {},
                shared_by_domain: {},
            };
        }
        finally {
            client.release();
        }
    }
    // =========================== 用户管理方法 ===========================
    /**
     * 创建用户
     */
    async createUser(userData) {
        const client = await this.pool.getClient();
        try {
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const passwordHash = await (0, bcryptjs_1.hash)(userData.password, 12);
            const now = new Date();
            const result = await client.query(`
        INSERT INTO users (
          id, username, nickname, email, phone, avatar_url, password_hash,
          role_id, publisher_name, publisher_website, publisher_submission_template,
          journal_domain, is_active, email_verified, phone_verified, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
                userId, userData.username, userData.nickname, userData.email, userData.phone || null,
                userData.avatar_url || null, passwordHash, userData.role_id, userData.publisher_name || null,
                userData.publisher_website || null, userData.publisher_submission_template || null,
                userData.journal_domain || null, userData.is_active, userData.email_verified,
                userData.phone_verified, now, now
            ]);
            // 创建用户配置
            await this.createUserProfile(userId);
            console.log(`用户 ${userId} 创建成功`);
            return result.rows[0];
        }
        catch (error) {
            console.error('创建用户失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 通过邮箱获取用户
     */
    async getUserByEmail(email) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM users WHERE email = $1 AND is_active = true
      `, [email]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        catch (error) {
            console.error('获取用户失败:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    /**
     * 通过用户名获取用户
     */
    async getUserByUsername(username) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM users WHERE username = $1 AND is_active = true
      `, [username]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        catch (error) {
            console.error('获取用户失败:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    /**
     * 通过ID获取用户
     */
    async getUserById(id) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT u.*, r.name as role_name, r.display_name as role_display_name, r.permissions
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1 AND u.is_active = true
      `, [id]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        catch (error) {
            console.error('获取用户失败:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    /**
     * 验证用户密码
     */
    async validateUserPassword(email, password) {
        const user = await this.getUserByEmail(email);
        if (!user)
            return null;
        const isValid = await (0, bcryptjs_1.compare)(password, user.password_hash);
        if (!isValid)
            return null;
        // 更新最后登录时间
        await this.updateLastLoginTime(user.id);
        return user;
    }
    /**
     * 更新最后登录时间
     */
    async updateLastLoginTime(userId) {
        const client = await this.pool.getClient();
        try {
            await client.query(`
        UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [userId]);
        }
        catch (error) {
            console.error('更新登录时间失败:', error);
        }
        finally {
            client.release();
        }
    }
    // =========================== 角色管理方法 ===========================
    /**
     * 创建角色
     */
    async createRole(roleData) {
        const client = await this.pool.getClient();
        try {
            const now = new Date();
            await client.query(`
        INSERT INTO roles (id, name, display_name, description, permissions, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          permissions = EXCLUDED.permissions,
          updated_at = CURRENT_TIMESTAMP
      `, [
                roleData.id, roleData.name, roleData.display_name,
                roleData.description, roleData.permissions, now, now
            ]);
            console.log(`角色 ${roleData.name} 创建/更新成功`);
        }
        catch (error) {
            console.error('创建角色失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取所有角色
     */
    async getAllRoles() {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM roles ORDER BY name
      `);
            return result.rows;
        }
        catch (error) {
            console.error('获取角色失败:', error);
            return [];
        }
        finally {
            client.release();
        }
    }
    // =========================== 会话管理方法 ===========================
    /**
     * 创建会话
     */
    async createSession(userId) {
        const client = await this.pool.getClient();
        try {
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const accessToken = jsonwebtoken_1.default.sign({ userId, sessionId, type: 'access' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '24h' });
            const refreshToken = jsonwebtoken_1.default.sign({ userId, sessionId, type: 'refresh' }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
            const now = new Date();
            const result = await client.query(`
        INSERT INTO sessions (id, user_id, access_token, refresh_token, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [sessionId, userId, accessToken, refreshToken, expiresAt, now, now]);
            return result.rows[0];
        }
        catch (error) {
            console.error('创建会话失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 验证会话
     */
    async validateSession(accessToken) {
        try {
            const decoded = jsonwebtoken_1.default.verify(accessToken, process.env.JWT_SECRET || 'your-secret-key');
            const client = await this.pool.getClient();
            try {
                const result = await client.query(`
          SELECT s.*, u.* FROM sessions s
          JOIN users u ON s.user_id = u.id
          WHERE s.access_token = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = true
        `, [accessToken]);
                if (result.rows.length === 0)
                    return null;
                const row = result.rows[0];
                const session = {
                    id: row.id,
                    user_id: row.user_id,
                    access_token: row.access_token,
                    refresh_token: row.refresh_token,
                    expires_at: row.expires_at,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };
                const user = {
                    id: row.user_id,
                    username: row.username,
                    nickname: row.nickname,
                    email: row.email,
                    phone: row.phone,
                    avatar_url: row.avatar_url,
                    password_hash: row.password_hash,
                    role_id: row.role_id,
                    publisher_name: row.publisher_name,
                    publisher_website: row.publisher_website,
                    publisher_submission_template: row.publisher_submission_template,
                    journal_domain: row.journal_domain,
                    is_active: row.is_active,
                    email_verified: row.email_verified,
                    phone_verified: row.phone_verified,
                    last_login_at: row.last_login_at,
                    created_at: row.created_at,
                    updated_at: row.updated_at
                };
                return { user, session };
            }
            finally {
                client.release();
            }
        }
        catch (error) {
            console.error('验证会话失败:', error);
            return null;
        }
    }
    /**
     * 删除会话（登出）
     */
    async deleteSession(accessToken) {
        const client = await this.pool.getClient();
        try {
            await client.query(`
        DELETE FROM sessions WHERE access_token = $1
      `, [accessToken]);
        }
        catch (error) {
            console.error('删除会话失败:', error);
        }
        finally {
            client.release();
        }
    }
    // =========================== 用户配置管理方法 ===========================
    /**
     * 创建用户配置
     */
    async createUserProfile(userId) {
        const client = await this.pool.getClient();
        try {
            const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const now = new Date();
            await client.query(`
        INSERT INTO user_profiles (id, user_id, preferences, notification_settings, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                profileId, userId,
                JSON.stringify({
                    theme: 'light',
                    language: 'zh-CN',
                    timezone: 'Asia/Shanghai',
                    editor_mode: 'standard'
                }),
                JSON.stringify({
                    email_notifications: true,
                    document_updates: true,
                    review_reminders: true,
                    system_announcements: true
                }),
                now, now
            ]);
        }
        catch (error) {
            console.error('创建用户配置失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取用户配置
     */
    async getUserProfile(userId) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT * FROM user_profiles WHERE user_id = $1
      `, [userId]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        catch (error) {
            console.error('获取用户配置失败:', error);
            return null;
        }
        finally {
            client.release();
        }
    }
    // =========================== 权限验证方法 ===========================
    /**
     * 检查用户权限
     */
    async hasPermission(userId, permission) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT r.permissions FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1 AND u.is_active = true
      `, [userId]);
            if (result.rows.length === 0)
                return false;
            const permissions = result.rows[0].permissions;
            // 管理员拥有所有权限
            if (permissions.includes('*'))
                return true;
            // 检查具体权限
            return permissions.includes(permission) ||
                permissions.some(p => {
                    const [resource, action] = p.split(':');
                    const [reqResource, reqAction] = permission.split(':');
                    return resource === reqResource && (action === '*' || action === reqAction);
                });
        }
        catch (error) {
            console.error('权限检查失败:', error);
            return false;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取所有期刊领域
     */
    async getAllJournalDomains() {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT id, code, name, category, category_name, description, 
               sort_order, is_active, created_at, updated_at
        FROM journal_domains 
        WHERE is_active = true
        ORDER BY sort_order, name
      `);
            return result.rows;
        }
        catch (error) {
            console.error('获取期刊领域失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 根据类别获取期刊领域
     */
    async getJournalDomainsByCategory(category) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT id, code, name, category, category_name, description, 
               sort_order, is_active, created_at, updated_at
        FROM journal_domains 
        WHERE category = $1 AND is_active = true
        ORDER BY sort_order, name
      `, [category]);
            return result.rows;
        }
        catch (error) {
            console.error('按类别获取期刊领域失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 搜索期刊领域
     */
    async searchJournalDomains(searchTerm) {
        const client = await this.pool.getClient();
        try {
            const result = await client.query(`
        SELECT id, code, name, category, category_name, description, 
               sort_order, is_active, created_at, updated_at
        FROM journal_domains 
        WHERE (name ILIKE $1 OR description ILIKE $1 OR code ILIKE $1) 
        AND is_active = true
        ORDER BY 
          CASE 
            WHEN name ILIKE $1 THEN 1
            WHEN code ILIKE $1 THEN 2
            ELSE 3
          END,
          sort_order, name
      `, [`%${searchTerm}%`]);
            return result.rows;
        }
        catch (error) {
            console.error('搜索期刊领域失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 获取期刊领域统计信息
     */
    async getJournalDomainsStats() {
        const client = await this.pool.getClient();
        try {
            // 获取总数统计
            const totalResult = await client.query(`
        SELECT 
          COUNT(*) as total_domains,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_domains
        FROM journal_domains
      `);
            // 获取按类别统计
            const categoryResult = await client.query(`
        SELECT category, category_name, COUNT(*) as domain_count
        FROM journal_domains 
        WHERE is_active = true
        GROUP BY category, category_name
        ORDER BY MIN(sort_order)
      `);
            return {
                total_domains: parseInt(totalResult.rows[0].total_domains),
                active_domains: parseInt(totalResult.rows[0].active_domains),
                categories: categoryResult.rows.map(row => ({
                    category: row.category,
                    category_name: row.category_name,
                    domain_count: parseInt(row.domain_count)
                }))
            };
        }
        catch (error) {
            console.error('获取期刊领域统计失败:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
}
exports.DatabaseModels = DatabaseModels;
