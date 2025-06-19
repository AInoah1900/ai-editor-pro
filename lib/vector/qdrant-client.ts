import { Api } from 'qdrant-client';

/**
 * Qdrant 向量数据库客户端
 * 负责向量数据的存储和检索
 */
export class QdrantVectorClient {
  private client: Api;
  private readonly COLLECTION_NAME = 'knowledge-base';
  private readonly VECTOR_SIZE = 1024;

  constructor() {
    this.client = new Api({
      baseURL: 'http://localhost:6333',
    });
  }

  /**
   * 初始化向量集合
   */
  async initializeCollection(): Promise<void> {
    try {
      // 检查集合是否存在
      const collections = await this.client.getCollections();
      const collectionExists = collections.data.collections.some(
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
      await this.client.upsert(this.COLLECTION_NAME, {
        points: [
          {
            id: id,
            vector: vector,
            payload: payload,
          },
        ],
      });
      console.log(`向量点 ${id} 添加成功`);
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
      const searchResponse = await this.client.search(this.COLLECTION_NAME, {
        vector: queryVector,
        limit: limit,
        filter: filter,
        with_payload: true,
      });

      return searchResponse.data.map((result) => ({
        id: result.id,
        score: result.score,
        payload: result.payload || {},
      }));
    } catch (error) {
      console.error('搜索相似向量失败:', error);
      return [];
    }
  }

  /**
   * 删除向量点
   */
  async deletePoint(id: string): Promise<void> {
    try {
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
      const info = await this.client.getCollectionInfo(this.COLLECTION_NAME);
      return {
        vectors_count: info.data.vectors_count || 0,
        points_count: info.data.points_count || 0,
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