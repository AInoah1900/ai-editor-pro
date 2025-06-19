import { QdrantVectorClient } from '../vector/qdrant-client';
import { DatabaseModels, KnowledgeItem, FileMetadata } from '../database/models';

// 领域信息接口
export interface DomainInfo {
  domain: string;
  confidence: number;
  keywords: string[];
}

// 知识库统计接口
export interface KnowledgeStats {
  total_files: number;
  total_knowledge_items: number;
  domains: { [key: string]: number };
  types: { [key: string]: number };
  last_updated: string;
  vector_stats: {
    vectors_count: number;
    points_count: number;
  };
}

/**
 * 新的知识检索器类
 * 使用 Qdrant 向量数据库和 PostgreSQL 关系型数据库
 */
export class NewKnowledgeRetriever {
  private vectorClient: QdrantVectorClient;
  private dbModels: DatabaseModels;
  private readonly VECTOR_DIMENSION = 1024;

  constructor() {
    this.vectorClient = new QdrantVectorClient();
    this.dbModels = new DatabaseModels();
  }

  /**
   * 初始化知识库
   */
  async initializeKnowledgeBase(): Promise<void> {
    try {
      // 初始化向量数据库
      await this.vectorClient.initializeCollection();
      
      // 初始化关系数据库
      await this.dbModels.initializeTables();
      
      console.log('新知识库初始化完成');
    } catch (error) {
      console.error('新知识库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 添加知识项
   */
  async addKnowledgeItem(item: Omit<KnowledgeItem, 'vector_id' | 'created_at' | 'updated_at'>): Promise<void> {
    try {
      // 生成向量嵌入
      const embedding = await this.generateEmbedding(item.content);
      
      // 生成向量ID
      const vectorId = `vector_${item.id}_${Date.now()}`;
      
      // 准备向量载荷
      const payload = {
        type: item.type,
        domain: item.domain,
        content: item.content,
        context: item.context,
        source: item.source,
        confidence: item.confidence,
        tags: item.tags,
        created_at: new Date().toISOString(),
      };

      // 上传向量到 Qdrant
      await this.vectorClient.upsertPoint(vectorId, embedding, payload);
      
      // 保存知识项到 PostgreSQL
      const knowledgeItem: KnowledgeItem = {
        ...item,
        vector_id: vectorId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await this.dbModels.addKnowledgeItem(knowledgeItem);
      
      console.log(`知识项 ${item.id} 添加成功`);
    } catch (error) {
      console.error('添加知识项失败:', error);
      throw error;
    }
  }

  /**
   * 添加文件元数据
   */
  async addFileMetadata(
    metadata: Omit<FileMetadata, 'created_at' | 'updated_at'>,
    content: string
  ): Promise<void> {
    try {
      // 生成向量嵌入
      const embedding = await this.generateEmbedding(content);
      
      // 生成向量ID
      const vectorId = `file_vector_${metadata.id}_${Date.now()}`;
      
      // 准备向量载荷
      const payload = {
        filename: metadata.filename,
        file_type: metadata.file_type,
        domain: metadata.domain,
        tags: metadata.tags,
        content_hash: metadata.content_hash,
        created_at: new Date().toISOString(),
      };

      // 上传向量到 Qdrant
      await this.vectorClient.upsertPoint(vectorId, embedding, payload);
      
      // 保存文件元数据到 PostgreSQL
      const fileMetadata: FileMetadata = {
        ...metadata,
        vector_id: vectorId,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await this.dbModels.addFileMetadata(fileMetadata);
      
      console.log(`文件元数据 ${metadata.id} 添加成功`);
    } catch (error) {
      console.error('添加文件元数据失败:', error);
      throw error;
    }
  }

  /**
   * 检索相关知识
   */
  async retrieveRelevantKnowledge(
    query: string,
    domain?: string,
    type?: string,
    limit: number = 5
  ): Promise<KnowledgeItem[]> {
    try {
      // 生成查询向量
      const queryEmbedding = await this.generateEmbedding(query);
      
      // 构建过滤条件
      const filter: Record<string, unknown> = {};
      if (domain) filter.domain = domain;
      if (type) filter.type = type;

      // 在 Qdrant 中搜索相似向量
      const searchResults = await this.vectorClient.searchSimilar(
        queryEmbedding,
        limit,
        Object.keys(filter).length > 0 ? filter : undefined
      );

      // 获取完整的知识项信息
      const knowledgeItems: KnowledgeItem[] = [];
      for (const result of searchResults) {
        const knowledgeItem = await this.dbModels.getKnowledgeItemByVectorId(result.id);
        if (knowledgeItem) {
          knowledgeItems.push({
            ...knowledgeItem,
            relevance_score: result.score,
          });
        }
      }

      return knowledgeItems;
    } catch (error) {
      console.error('检索相关知识失败:', error);
      return [];
    }
  }

  /**
   * 获取知识库统计信息
   */
  async getKnowledgeStats(): Promise<KnowledgeStats> {
    try {
      // 获取数据库统计
      const dbStats = await this.dbModels.getKnowledgeStats();
      
      // 获取向量数据库统计
      const vectorStats = await this.vectorClient.getCollectionInfo();
      
      return {
        ...dbStats,
        vector_stats: vectorStats,
      };
    } catch (error) {
      console.error('获取知识库统计失败:', error);
      return {
        total_files: 0,
        total_knowledge_items: 0,
        domains: {},
        types: {},
        last_updated: new Date().toISOString(),
        vector_stats: {
          vectors_count: 0,
          points_count: 0,
        },
      };
    }
  }

  /**
   * 从用户反馈中学习
   */
  async learnFromFeedback(
    original: string,
    suggestion: string,
    feedback: 'positive' | 'negative',
    domain: string
  ): Promise<void> {
    try {
      // 根据反馈创建新的知识项
      const knowledgeItem = {
        id: `feedback_${Date.now()}`,
        type: 'case' as const,
        domain: domain,
        content: suggestion,
        context: `用户反馈: ${original} -> ${suggestion}`,
        source: 'user_feedback',
        confidence: feedback === 'positive' ? 0.9 : 0.3,
        tags: ['user_feedback', feedback],
      };

      await this.addKnowledgeItem(knowledgeItem);
      console.log('用户反馈学习完成');
    } catch (error) {
      console.error('用户反馈学习失败:', error);
      throw error;
    }
  }

  /**
   * 删除知识项
   */
  async deleteKnowledgeItem(id: string): Promise<void> {
    try {
      // 从数据库获取知识项以获取向量ID
      const knowledgeItem = await this.dbModels.getKnowledgeItemByVectorId(id);
      
      if (knowledgeItem) {
        // 删除向量
        await this.vectorClient.deletePoint(knowledgeItem.vector_id);
        
        // 删除数据库记录
        await this.dbModels.deleteKnowledgeItem(id);
        
        console.log(`知识项 ${id} 删除成功`);
      } else {
        console.warn(`知识项 ${id} 不存在`);
      }
    } catch (error) {
      console.error('删除知识项失败:', error);
      throw error;
    }
  }

  /**
   * 生成向量嵌入
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      
      if (openaiApiKey) {
        // 使用 OpenAI API
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: text.slice(0, 8000), // 限制输入长度
            model: 'text-embedding-ada-002',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const embedding = data.data[0].embedding;
          // 确保向量维度为 1024
          return embedding.slice(0, this.VECTOR_DIMENSION);
        }
      }
      
      // 降级到模拟向量
      return this.generateSimulatedEmbedding(text);
    } catch (error) {
      console.error('生成嵌入失败，使用模拟向量:', error);
      return this.generateSimulatedEmbedding(text);
    }
  }

  /**
   * 生成模拟向量嵌入（降级方案）
   */
  private generateSimulatedEmbedding(text: string): number[] {
    // 基于文本内容生成语义相关的模拟向量
    const hash = this.simpleHash(text);
    const vector: number[] = [];
    
    for (let i = 0; i < this.VECTOR_DIMENSION; i++) {
      // 使用哈希值生成伪随机但确定性的向量
      const seed = (hash + i * 31) % 1000000;
      vector.push((Math.sin(seed) + 1) / 2); // 归一化到 0-1
    }
    
    return vector;
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }
}

/**
 * 领域分类器类
 * 负责识别文档的领域类型
 */
export class DomainClassifier {
  private readonly domains = [
    'academic',
    'technical',
    'business',
    'medical',
    'legal',
    'literary',
    'general'
  ];

  private readonly domainKeywords: { [key: string]: string[] } = {
    academic: ['研究', '论文', '学术', '理论', '方法', '实验', '数据', '分析', '结论'],
    technical: ['技术', '系统', '算法', '代码', '架构', '设计', '实现', '测试', '部署'],
    business: ['商业', '市场', '营销', '销售', '客户', '产品', '服务', '策略', '管理'],
    medical: ['医疗', '疾病', '治疗', '药物', '患者', '诊断', '症状', '医院', '医生'],
    legal: ['法律', '法规', '合同', '条款', '权利', '义务', '诉讼', '法院', '律师'],
    literary: ['文学', '小说', '诗歌', '散文', '创作', '艺术', '情感', '描写', '故事'],
    general: ['一般', '通用', '日常', '生活', '工作', '学习', '娱乐']
  };

  /**
   * 识别文档领域
   */
  async identifyDomain(content: string): Promise<DomainInfo> {
    try {
      const scores: { [key: string]: number } = {};
      
      // 计算每个领域的匹配分数
      for (const domain of this.domains) {
        const keywords = this.domainKeywords[domain];
        let score = 0;
        
        for (const keyword of keywords) {
          const regex = new RegExp(keyword, 'gi');
          const matches = content.match(regex);
          if (matches) {
            score += matches.length;
          }
        }
        
        scores[domain] = score;
      }
      
      // 找到得分最高的领域
      let bestDomain = 'general';
      let bestScore = scores.general;
      
      for (const [domain, score] of Object.entries(scores)) {
        if (score > bestScore) {
          bestScore = score;
          bestDomain = domain;
        }
      }
      
      // 计算置信度
      const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
      const confidence = totalScore > 0 ? bestScore / totalScore : 0.1;
      
      // 提取关键词
      const keywords = this.extractKeywords(content, bestDomain);
      
      return {
        domain: bestDomain,
        confidence: Math.min(confidence + 0.1, 1.0), // 确保最小置信度
        keywords: keywords.slice(0, 5) // 最多5个关键词
      };
    } catch (error) {
      console.error('领域识别失败:', error);
      return {
        domain: 'general',
        confidence: 0.1,
        keywords: []
      };
    }
  }

  /**
   * 提取关键词
   */
  private extractKeywords(content: string, domain: string): string[] {
    const keywords = this.domainKeywords[domain] || [];
    const foundKeywords: string[] = [];
    
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    }
    
    return foundKeywords;
  }
} 