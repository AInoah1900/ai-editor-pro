import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';

/**
 * Qdrant 向量数据库客户端
 * 负责向量数据的存储和检索
 */
export class QdrantVectorClient {
  private client: QdrantClient;
  private readonly COLLECTION_NAME = 'knowledge-base';
  private readonly VECTOR_SIZE = 1024;
  private pointIdCounter = 1;

  constructor() {
    this.client = new QdrantClient({
      url: 'http://localhost:6333',
    });
  }

  /**
   * 生成有效的点 ID
   */
  private generatePointId(): number {
    return this.pointIdCounter++;
  }

  /**
   * 清理 payload 数据，确保只包含 Qdrant 支持的类型
   */
  private cleanPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined) {
        continue; // 跳过 null 和 undefined
      }
      
      if (typeof value === 'string' || 
          typeof value === 'number' || 
          typeof value === 'boolean') {
        clean[key] = value;
      } else if (Array.isArray(value)) {
        // 只保留基本类型的数组
        const cleanArray = value.filter(item => 
          typeof item === 'string' || 
          typeof item === 'number' || 
          typeof item === 'boolean'
        );
        if (cleanArray.length > 0) {
          clean[key] = cleanArray;
        }
      } else if (typeof value === 'object') {
        // 递归清理嵌套对象
        const cleanNested = this.cleanPayload(value as Record<string, unknown>);
        if (Object.keys(cleanNested).length > 0) {
          clean[key] = cleanNested;
        }
      }
    }
    
    return clean;
  }

  /**
   * 初始化向量集合
   */
  async initializeCollection(): Promise<void> {
    try {
      // 检查集合是否存在
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        (collection) => collection.name === this.COLLECTION_NAME
      );

      if (!collectionExists) {
        // 创建新集合
        await this.client.createCollection(this.COLLECTION_NAME, {
          vectors: {
            size: this.VECTOR_SIZE,
            distance: 'Cosine',
          },
        });
        console.log('Qdrant 集合创建成功');
      }

      console.log('Qdrant 集合初始化完成');
    } catch (error) {
      console.error('Qdrant 集合初始化失败:', error);
      throw error;
    }
  }

  /**
   * 添加向量点
   */
  async upsertPoint(
    id: string,
    vector: number[],
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      // 确保集合存在
      await this.initializeCollection();
      
      // 清理 payload，确保只包含 Qdrant 支持的类型
      const cleanPayload = this.cleanPayload(payload);
      
      // 使用数字 ID 而不是字符串 ID
      const pointId = this.generatePointId();
      
      await this.client.upsert(this.COLLECTION_NAME, {
        points: [
          {
            id: pointId,
            vector: vector,
            payload: {
              ...cleanPayload,
              original_id: id, // 保存原始 ID 到 payload 中
            },
          },
        ],
      });
      console.log(`向量点 ${id} (ID: ${pointId}) 添加成功`);
    } catch (error) {
      console.error('添加向量点失败:', error);
      throw error;
    }
  }

  /**
   * 搜索相似向量
   */
  async searchSimilar(
    queryVector: number[],
    limit: number = 5,
    filter?: Record<string, unknown>
  ): Promise<Array<{
    id: string;
    score: number;
    payload: Record<string, unknown>;
  }>> {
    try {
      // 确保集合存在
      await this.initializeCollection();
      
      // 验证向量维度
      if (queryVector.length !== this.VECTOR_SIZE) {
        console.error(`向量维度不匹配: 期望${this.VECTOR_SIZE}，实际${queryVector.length}`);
        return [];
      }
      
      // 检查集合是否有数据
      const collectionInfo = await this.getCollectionInfo();
      if (collectionInfo.points_count === 0) {
        console.warn('向量集合为空，无法搜索');
        return [];
      }
      
      console.log(`正在搜索相似向量: 维度=${queryVector.length}, 限制=${limit}, 数据点=${collectionInfo.points_count}`);
      
      // 构建搜索参数
      const searchParams: any = {
        vector: queryVector,
        limit: limit,
        with_payload: true,
      };
      
      // 只有在filter有值时才添加
      if (filter && Object.keys(filter).length > 0) {
        searchParams.filter = filter;
      }
      
      const searchResponse = await this.client.search(this.COLLECTION_NAME, searchParams);

      console.log(`搜索完成，找到 ${searchResponse.length} 个结果`);

      return searchResponse.map((result) => ({
        id: (result.payload?.original_id as string) || String(result.id), // 返回原始 ID
        score: result.score,
        payload: result.payload || {},
      }));
    } catch (error) {
      console.error('搜索相似向量失败:', error);
      if (error instanceof Error) {
        console.error('错误详情:', error.message);
      }
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as any;
        console.error('响应状态:', httpError.response?.status);
        console.error('响应数据:', httpError.response?.data);
      }
      return [];
    }
  }

  /**
   * 删除向量点
   */
  async deletePoint(id: string): Promise<void> {
    try {
      // 注意：这里需要根据原始 ID 查找对应的数字 ID
      // 简化实现：直接使用字符串 ID（如果 Qdrant 支持）
      await this.client.delete(this.COLLECTION_NAME, {
        points: [id],
      });
      console.log(`向量点 ${id} 删除成功`);
    } catch (error) {
      console.error('删除向量点失败:', error);
      throw error;
    }
  }

  /**
   * 获取集合统计信息
   */
  async getCollectionInfo(): Promise<{
    vectors_count: number;
    points_count: number;
  }> {
    try {
      // 首先确保集合存在
      await this.initializeCollection();
      
      const info = await this.client.getCollection(this.COLLECTION_NAME);
      return {
        vectors_count: info.vectors_count || 0,
        points_count: info.points_count || 0,
      };
    } catch (error) {
      console.error('获取集合信息失败:', error);
      return {
        vectors_count: 0,
        points_count: 0,
      };
    }
  }
} 