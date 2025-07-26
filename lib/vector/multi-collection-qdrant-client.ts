import { QdrantClient } from '@qdrant/js-client-rest';

// 从环境变量读取Qdrant配置
const getQdrantConfig = () => {
  return {
    url: process.env.QDRANT_URL || 'http://localhost:6333',
    timeout: parseInt(process.env.QDRANT_TIMEOUT || '600000'), // 10分钟超时
  };
};

const VECTOR_SIZE = parseInt(process.env.QDRANT_VECTOR_SIZE || '4096');

// 集合名称生成规则
const COLLECTION_PREFIX = 'knowledge_';
const GENERAL_COLLECTION = 'knowledge_general'; // 通用知识库集合

/**
 * 期刊领域代码列表（基于数据库中的62个领域）
 */
const JOURNAL_DOMAIN_CODES = [
  'mathematics', 'physics', 'chemistry', 'astronomy', 'earth_science', 'biology', 
  'agriculture', 'medicine', 'engineering', 'energy_science', 'environmental_science',
  'philosophy', 'religion', 'linguistics', 'literature', 'arts', 'history', 'archaeology',
  'economics', 'political_science', 'law', 'sociology', 'ethnology', 'journalism',
  'education', 'psychology', 'sports_science', 'management_science', 'business_management',
  'public_administration', 'library_information', 'statistics', 'systems_science',
  'safety_science', 'military_science', 'computer_science', 'information_engineering',
  'control_engineering', 'surveying_mapping', 'chemical_engineering', 'textile_engineering',
  'food_engineering', 'architecture', 'civil_engineering', 'transportation', 'aerospace',
  'nuclear_science', 'weapon_science', 'data_science', 'artificial_intelligence',
  'biomedical_engineering', 'nanotechnology', 'quantum_science', 'marine_science',
  'materials_science', 'mechanical_engineering', 'electrical_engineering', 'forestry',
  'veterinary', 'finance', 'tourism_management', 'general'
];

/**
 * 多集合Qdrant向量数据库客户端
 * 支持63个领域集合：62个学科领域 + 1个通用集合
 */
export class MultiCollectionQdrantClient {
  private client: QdrantClient;
  private pointIdCounters: Map<string, number> = new Map();
  private initializedCollections: Set<string> = new Set();

  constructor() {
    this.client = new QdrantClient(getQdrantConfig());
    console.log('🚀 多集合Qdrant客户端初始化完成');
  }

  /**
   * 根据领域代码生成集合名称
   */
  private getCollectionName(domainCode: string): string {
    if (domainCode === 'general' || !domainCode) {
      return GENERAL_COLLECTION;
    }
    return `${COLLECTION_PREFIX}${domainCode}`;
  }

  /**
   * 获取所有可能的集合名称
   */
  public getAllCollectionNames(): string[] {
    return JOURNAL_DOMAIN_CODES.map(code => this.getCollectionName(code));
  }

  /**
   * 生成有效的点 ID
   */
  private generatePointId(collectionName: string): number {
    const current = this.pointIdCounters.get(collectionName) || 0;
    const newId = current + 1;
    this.pointIdCounters.set(collectionName, newId);
    return newId;
  }

  /**
   * 清理 payload 数据，确保只包含 Qdrant 支持的类型
   */
  private cleanPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(payload)) {
      if (value === null || value === undefined) {
        continue;
      }
      
      if (typeof value === 'string' || 
          typeof value === 'number' || 
          typeof value === 'boolean') {
        clean[key] = value;
      } else if (Array.isArray(value)) {
        const cleanArray = value.filter(item => 
          typeof item === 'string' || 
          typeof item === 'number' || 
          typeof item === 'boolean'
        );
        if (cleanArray.length > 0) {
          clean[key] = cleanArray;
        }
      } else if (typeof value === 'object') {
        const cleanNested = this.cleanPayload(value as Record<string, unknown>);
        if (Object.keys(cleanNested).length > 0) {
          clean[key] = cleanNested;
        }
      }
    }
    
    return clean;
  }

  /**
   * 初始化单个集合
   */
  async initializeCollection(domainCode: string): Promise<void> {
    const collectionName = this.getCollectionName(domainCode);
    
    if (this.initializedCollections.has(collectionName)) {
      return; // 已经初始化过
    }

    try {
      // 检查集合是否存在
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        (collection) => collection.name === collectionName
      );

      if (!collectionExists) {
        // 创建新集合
        await this.client.createCollection(collectionName, {
          vectors: {
            size: VECTOR_SIZE,
            distance: 'Cosine',
          },
        });
        console.log(`✅ Qdrant集合创建成功: ${collectionName} (领域: ${domainCode})`);
      }

      this.initializedCollections.add(collectionName);
      console.log(`📋 集合初始化完成: ${collectionName}`);
    } catch (error) {
      console.error(`❌ 集合初始化失败: ${collectionName}`, error);
      throw error;
    }
  }

  /**
   * 初始化所有63个集合
   */
  async initializeAllCollections(): Promise<{
    success: number;
    failed: number;
    details: Array<{domain: string, collection: string, status: 'success' | 'failed', error?: string}>
  }> {
    console.log('🚀 开始初始化63个领域集合...');
    
    const results = {
      success: 0,
      failed: 0,
      details: [] as Array<{domain: string, collection: string, status: 'success' | 'failed', error?: string}>
    };

    for (const domainCode of JOURNAL_DOMAIN_CODES) {
      const collectionName = this.getCollectionName(domainCode);
      
      try {
        await this.initializeCollection(domainCode);
        results.success++;
        results.details.push({
          domain: domainCode,
          collection: collectionName,
          status: 'success'
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          domain: domainCode,
          collection: collectionName,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
        console.error(`❌ 领域集合初始化失败: ${domainCode}`, error);
      }
    }

    console.log(`✅ 集合初始化完成: 成功${results.success}个, 失败${results.failed}个`);
    return results;
  }

  /**
   * 添加向量点到指定领域集合
   */
  async upsertPoint(
    domainCode: string,
    id: string,
    vector: number[],
    payload: Record<string, unknown>
  ): Promise<void> {
    try {
      // 确保目标集合存在
      await this.initializeCollection(domainCode);
      
      const collectionName = this.getCollectionName(domainCode);
      const cleanPayload = this.cleanPayload(payload);
      const pointId = this.generatePointId(collectionName);
      
      await this.client.upsert(collectionName, {
        points: [
          {
            id: pointId,
            vector: vector,
            payload: {
              ...cleanPayload,
              original_id: id,
              domain_code: domainCode, // 添加领域标识
              collection_name: collectionName,
            },
          },
        ],
      });
      
      console.log(`✅ 向量添加成功: ${id} → ${collectionName} (点ID: ${pointId})`);
    } catch (error) {
      console.error(`❌ 向量添加失败: ${id} → ${domainCode}`, error);
      throw error;
    }
  }

  /**
   * 在指定领域集合中搜索相似向量
   */
  async searchInDomain(
    domainCode: string,
    queryVector: number[],
    limit: number = 5,
    filter?: Record<string, unknown>
  ): Promise<Array<{
    id: string;
    score: number;
    payload: Record<string, unknown>;
    domain: string;
    collection: string;
  }>> {
    try {
      await this.initializeCollection(domainCode);
      const collectionName = this.getCollectionName(domainCode);
      
      // 验证向量维度
      if (queryVector.length !== VECTOR_SIZE) {
        console.error(`向量维度不匹配: 期望${VECTOR_SIZE}，实际${queryVector.length}`);
        return [];
      }
      
      // 检查集合是否有数据
      const collectionInfo = await this.getCollectionInfo(domainCode);
      if (collectionInfo.points_count === 0) {
        console.warn(`集合为空: ${collectionName}`);
        return [];
      }
      
      console.log(`🔍 搜索相似向量: ${collectionName} (${collectionInfo.points_count}个数据点)`);
      
      const searchParams: {
        vector: number[];
        limit: number;
        with_payload: boolean;
        filter?: Record<string, unknown>;
      } = {
        vector: queryVector,
        limit: limit,
        with_payload: true,
      };
      
      if (filter && Object.keys(filter).length > 0) {
        searchParams.filter = filter;
      }
      
      const searchResponse = await this.client.search(collectionName, searchParams);
      
      return searchResponse.map((result) => ({
        id: (result.payload?.original_id as string) || String(result.id),
        score: result.score,
        payload: result.payload || {},
        domain: domainCode,
        collection: collectionName,
      }));
    } catch (error) {
      console.error(`❌ 领域搜索失败: ${domainCode}`, error);
      return [];
    }
  }

  /**
   * 在多个领域集合中并行搜索（用于文章编辑时的高效检索）
   */
  async searchInMultipleDomains(
    domainCodes: string[],
    queryVector: number[],
    limitPerDomain: number = 5,
    filter?: Record<string, unknown>
  ): Promise<Array<{
    id: string;
    score: number;
    payload: Record<string, unknown>;
    domain: string;
    collection: string;
  }>> {
    console.log(`🔍 多领域并行搜索: ${domainCodes.join(', ')}`);
    
    // 并行搜索所有指定领域
    const searchPromises = domainCodes.map(domainCode => 
      this.searchInDomain(domainCode, queryVector, limitPerDomain, filter)
    );
    
    try {
      const results = await Promise.all(searchPromises);
      
      // 合并所有结果并按得分排序
      const allResults = results.flat();
      allResults.sort((a, b) => b.score - a.score);
      
      console.log(`✅ 多领域搜索完成: 共找到${allResults.length}个结果`);
      return allResults;
    } catch (error) {
      console.error('❌ 多领域搜索失败:', error);
      return [];
    }
  }

  /**
   * 智能搜索：自动包含通用集合
   */
  async smartSearch(
    primaryDomainCode: string,
    queryVector: number[],
    limitPerDomain: number = 5,
    filter?: Record<string, unknown>
  ): Promise<Array<{
    id: string;
    score: number;
    payload: Record<string, unknown>;
    domain: string;
    collection: string;
  }>> {
    // 搜索主要领域和通用集合
    const searchDomains = [primaryDomainCode];
    if (primaryDomainCode !== 'general') {
      searchDomains.push('general');
    }
    
    return this.searchInMultipleDomains(searchDomains, queryVector, limitPerDomain, filter);
  }

  /**
   * 删除指定领域集合中的向量点
   */
  async deletePoint(domainCode: string, id: string): Promise<void> {
    try {
      const collectionName = this.getCollectionName(domainCode);
      await this.client.delete(collectionName, {
        points: [id],
      });
      console.log(`✅ 向量删除成功: ${id} from ${collectionName}`);
    } catch (error) {
      console.error(`❌ 向量删除失败: ${id} from ${domainCode}`, error);
      throw error;
    }
  }

  /**
   * 获取指定领域集合的统计信息
   */
  async getCollectionInfo(domainCode: string): Promise<{
    domain: string;
    collection_name: string;
    vectors_count: number;
    points_count: number;
  }> {
    try {
      await this.initializeCollection(domainCode);
      const collectionName = this.getCollectionName(domainCode);
      
      const info = await this.client.getCollection(collectionName);
      return {
        domain: domainCode,
        collection_name: collectionName,
        vectors_count: info.vectors_count || 0,
        points_count: info.points_count || 0,
      };
    } catch (error) {
      console.error(`❌ 获取集合信息失败: ${domainCode}`, error);
      return {
        domain: domainCode,
        collection_name: this.getCollectionName(domainCode),
        vectors_count: 0,
        points_count: 0,
      };
    }
  }

  /**
   * 获取所有集合的统计信息
   */
  async getAllCollectionsInfo(): Promise<Array<{
    domain: string;
    collection_name: string;
    vectors_count: number;
    points_count: number;
  }>> {
    console.log('📊 获取所有集合统计信息...');
    
    const promises = JOURNAL_DOMAIN_CODES.map(domainCode => 
      this.getCollectionInfo(domainCode)
    );
    
    try {
      const results = await Promise.all(promises);
      console.log(`✅ 获取${results.length}个集合统计信息完成`);
      return results;
    } catch (error) {
      console.error('❌ 获取集合统计信息失败:', error);
      return [];
    }
  }

  /**
   * 健康检查：验证所有集合状态
   */
  async healthCheck(): Promise<{
    total_collections: number;
    active_collections: number;
    empty_collections: number;
    total_points: number;
    collections_status: Array<{
      domain: string;
      collection: string;
      status: 'active' | 'empty' | 'error';
      points: number;
    }>
  }> {
    console.log('🏥 执行健康检查...');
    
    const allCollectionsInfo = await this.getAllCollectionsInfo();
    
    let activeCollections = 0;
    let emptyCollections = 0;
    let totalPoints = 0;
    
    const collectionsStatus = allCollectionsInfo.map(info => {
      const points = info.points_count || 0;
      totalPoints += points;
      
      let status: 'active' | 'empty' | 'error' = 'empty';
      if (points > 0) {
        status = 'active';
        activeCollections++;
      } else {
        emptyCollections++;
      }
      
      return {
        domain: info.domain,
        collection: info.collection_name,
        status,
        points
      };
    });
    
    const result = {
      total_collections: JOURNAL_DOMAIN_CODES.length,
      active_collections: activeCollections,
      empty_collections: emptyCollections,
      total_points: totalPoints,
      collections_status: collectionsStatus
    };
    
    console.log(`✅ 健康检查完成: ${activeCollections}个活跃集合, ${emptyCollections}个空集合, 总计${totalPoints}个数据点`);
    return result;
  }
} 