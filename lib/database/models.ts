import { Pool, PoolClient } from 'pg';

/**
 * PostgreSQL 数据库连接池
 */
class DatabasePool {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'postgres',
      user: 'myuser',
      password: '12345678',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * 获取数据库连接
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// 创建全局数据库连接池实例
const dbPool = new DatabasePool();

/**
 * 文件元数据接口
 */
export interface FileMetadata {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  upload_time: Date;
  vector_id: string;
  content_hash: string;
  domain?: string;
  tags?: string[];
  ownership_type: 'private' | 'shared';
  owner_id?: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * 知识项接口
 */
export interface KnowledgeItem {
  id: string;
  type: 'terminology' | 'rule' | 'case' | 'style';
  domain: string;
  content: string;
  context: string;
  source: string;
  confidence: number;
  tags: string[];
  vector_id: string;
  ownership_type?: 'private' | 'shared';
  owner_id?: string;
  created_at: Date;
  updated_at: Date;
  relevance_score?: number;
}

/**
 * 数据库模型类
 */
export class DatabaseModels {
  private pool: DatabasePool;

  constructor() {
    this.pool = dbPool;
  }

  /**
   * 初始化数据库表
   */
  async initializeTables(): Promise<void> {
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

      // 创建索引
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_file_metadata_domain ON file_metadata(domain);
        CREATE INDEX IF NOT EXISTS idx_file_metadata_upload_time ON file_metadata(upload_time);
        CREATE INDEX IF NOT EXISTS idx_knowledge_items_domain ON knowledge_items(domain);
        CREATE INDEX IF NOT EXISTS idx_knowledge_items_type ON knowledge_items(type);
        CREATE INDEX IF NOT EXISTS idx_knowledge_items_vector_id ON knowledge_items(vector_id);
      `);

      console.log('数据库表初始化完成');
    } catch (error) {
      console.error('数据库表初始化失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 添加文件元数据
   */
  async addFileMetadata(metadata: FileMetadata): Promise<void> {
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
    } catch (error) {
      console.error('添加文件元数据失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 添加知识项
   */
  async addKnowledgeItem(item: KnowledgeItem): Promise<void> {
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
    } catch (error) {
      console.error('添加知识项失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 根据向量ID获取知识项
   */
  async getKnowledgeItemByVectorId(vectorId: string): Promise<KnowledgeItem | null> {
    const client = await this.pool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM knowledge_items WHERE vector_id = $1
      `, [vectorId]);

      if (result.rows.length > 0) {
        return result.rows[0] as KnowledgeItem;
      }
      return null;
    } catch (error) {
      console.error('获取知识项失败:', error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * 获取知识库统计信息
   */
  async getKnowledgeStats(): Promise<{
    total_files: number;
    total_knowledge_items: number;
    domains: { [key: string]: number };
    types: { [key: string]: number };
    last_updated: string;
  }> {
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

      const domains: { [key: string]: number } = {};
      domainStats.rows.forEach((row: { domain: string; count: string }) => {
        domains[row.domain] = parseInt(row.count);
      });

      const types: { [key: string]: number } = {};
      typeStats.rows.forEach((row: { type: string; count: string }) => {
        types[row.type] = parseInt(row.count);
      });

      return {
        total_files: parseInt(fileStats.rows[0].total_files),
        total_knowledge_items: parseInt(knowledgeStats.rows[0].total_knowledge_items),
        domains,
        types,
        last_updated: lastUpdated.rows[0]?.last_updated || new Date().toISOString(),
      };
    } catch (error) {
      console.error('获取知识库统计失败:', error);
      return {
        total_files: 0,
        total_knowledge_items: 0,
        domains: {},
        types: {},
        last_updated: new Date().toISOString(),
      };
    } finally {
      client.release();
    }
  }

  /**
   * 删除知识项
   */
  async deleteKnowledgeItem(id: string): Promise<void> {
    const client = await this.pool.getClient();
    
    try {
      await client.query(`
        DELETE FROM knowledge_items WHERE id = $1
      `, [id]);

      console.log(`知识项 ${id} 删除成功`);
    } catch (error) {
      console.error('删除知识项失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 删除文件元数据
   */
  async deleteFileMetadata(id: string): Promise<void> {
    const client = await this.pool.getClient();
    
    try {
      await client.query(`
        DELETE FROM file_metadata WHERE id = $1
      `, [id]);

      console.log(`文件元数据 ${id} 删除成功`);
    } catch (error) {
      console.error('删除文件元数据失败:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 根据领域获取相关文档
   */
  async getFilesByDomain(domain: string): Promise<FileMetadata[]> {
    const client = await this.pool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM file_metadata 
        WHERE domain = $1 
        ORDER BY upload_time DESC
      `, [domain]);

      return result.rows as FileMetadata[];
    } catch (error) {
      console.error('获取领域文档失败:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 根据向量ID获取文件元数据
   */
  async getFileByVectorId(vectorId: string): Promise<FileMetadata | null> {
    const client = await this.pool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM file_metadata WHERE vector_id = $1
      `, [vectorId]);

      if (result.rows.length > 0) {
        return result.rows[0] as FileMetadata;
      }
      return null;
    } catch (error) {
      console.error('获取文件元数据失败:', error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * 搜索相关文档 (基于关键词和领域)
   */
  async searchRelatedFiles(query: string, domain?: string, limit: number = 10): Promise<FileMetadata[]> {
    const client = await this.pool.getClient();
    
    try {
      let sql = `
        SELECT * FROM file_metadata 
        WHERE (filename ILIKE $1 OR tags && ARRAY[$2])
      `;
      const params: any[] = [`%${query}%`, query];
      
      if (domain) {
        sql += ` AND domain = $3`;
        params.push(domain);
        sql += ` ORDER BY upload_time DESC LIMIT $4`;
        params.push(limit);
      } else {
        sql += ` ORDER BY upload_time DESC LIMIT $3`;
        params.push(limit);
      }

      const result = await client.query(sql, params);
      return result.rows as FileMetadata[];
    } catch (error) {
      console.error('搜索相关文档失败:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 获取所有文档
   */
  async getAllFiles(limit: number = 50): Promise<FileMetadata[]> {
    const client = await this.pool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM file_metadata 
        ORDER BY upload_time DESC 
        LIMIT $1
      `, [limit]);

      return result.rows as FileMetadata[];
    } catch (error) {
      console.error('获取所有文档失败:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 获取专属知识库文档
   */
  async getPrivateFiles(ownerId: string, limit: number = 50): Promise<FileMetadata[]> {
    const client = await this.pool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM file_metadata 
        WHERE ownership_type = 'private' AND owner_id = $1
        ORDER BY upload_time DESC 
        LIMIT $2
      `, [ownerId, limit]);

      return result.rows as FileMetadata[];
    } catch (error) {
      console.error('获取专属知识库文档失败:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 获取共享知识库文档
   */
  async getSharedFiles(limit: number = 50): Promise<FileMetadata[]> {
    const client = await this.pool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM file_metadata 
        WHERE ownership_type = 'shared'
        ORDER BY upload_time DESC 
        LIMIT $1
      `, [limit]);

      return result.rows as FileMetadata[];
    } catch (error) {
      console.error('获取共享知识库文档失败:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 获取专属知识项
   */
  async getPrivateKnowledgeItems(ownerId: string, limit: number = 50): Promise<KnowledgeItem[]> {
    const client = await this.pool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM knowledge_items 
        WHERE ownership_type = 'private' AND owner_id = $1
        ORDER BY created_at DESC 
        LIMIT $2
      `, [ownerId, limit]);

      return result.rows as KnowledgeItem[];
    } catch (error) {
      console.error('获取专属知识项失败:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 获取共享知识项
   */
  async getSharedKnowledgeItems(limit: number = 50): Promise<KnowledgeItem[]> {
    const client = await this.pool.getClient();
    
    try {
      const result = await client.query(`
        SELECT * FROM knowledge_items 
        WHERE ownership_type = 'shared' OR ownership_type IS NULL
        ORDER BY created_at DESC 
        LIMIT $1
      `, [limit]);

      return result.rows as KnowledgeItem[];
    } catch (error) {
      console.error('获取共享知识项失败:', error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * 获取知识库文档统计
   */
  async getKnowledgeLibraryStats(): Promise<{
    total_private: number;
    total_shared: number;
    private_by_domain: { [key: string]: number };
    shared_by_domain: { [key: string]: number };
  }> {
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

      const private_by_domain: { [key: string]: number } = {};
      privateDomainStats.rows.forEach((row: { domain: string; count: string }) => {
        private_by_domain[row.domain] = parseInt(row.count);
      });

      const shared_by_domain: { [key: string]: number } = {};
      sharedDomainStats.rows.forEach((row: { domain: string; count: string }) => {
        shared_by_domain[row.domain] = parseInt(row.count);
      });

      return {
        total_private: parseInt(privateStats.rows[0].total_private),
        total_shared: parseInt(sharedStats.rows[0].total_shared),
        private_by_domain,
        shared_by_domain,
      };
    } catch (error) {
      console.error('获取知识库统计失败:', error);
      return {
        total_private: 0,
        total_shared: 0,
        private_by_domain: {},
        shared_by_domain: {},
      };
    } finally {
      client.release();
    }
  }

  /**
   * 获取知识项统计（按所有权类型）
   */
  async getKnowledgeItemsStats(): Promise<{
    total_private: number;
    total_shared: number;
    private_by_domain: { [key: string]: number };
    shared_by_domain: { [key: string]: number };
  }> {
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

      const private_by_domain: { [key: string]: number } = {};
      privateDomainStats.rows.forEach((row: { domain: string; count: string }) => {
        private_by_domain[row.domain] = parseInt(row.count);
      });

      const shared_by_domain: { [key: string]: number } = {};
      sharedDomainStats.rows.forEach((row: { domain: string; count: string }) => {
        shared_by_domain[row.domain] = parseInt(row.count);
      });

      return {
        total_private: parseInt(privateStats.rows[0].total_private),
        total_shared: parseInt(sharedStats.rows[0].total_shared),
        private_by_domain,
        shared_by_domain,
      };
    } catch (error) {
      console.error('获取知识项统计失败:', error);
      return {
        total_private: 0,
        total_shared: 0,
        private_by_domain: {},
        shared_by_domain: {},
      };
    } finally {
      client.release();
    }
  }
}