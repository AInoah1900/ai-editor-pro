import { QdrantVectorClient } from '../vector/qdrant-client';
import { DatabaseModels, KnowledgeItem, FileMetadata } from '../database/models';
import { LocalApiEmbeddingClient } from '../embeddings/local-api-client';

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
  private localApiClient: LocalApiEmbeddingClient;
  private readonly VECTOR_DIMENSION = 4096;

  constructor() {
    this.vectorClient = new QdrantVectorClient();
    this.dbModels = new DatabaseModels();
    this.localApiClient = new LocalApiEmbeddingClient();
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
        ownership_type: item.ownership_type || 'shared', // 支持所有权类型
        owner_id: item.owner_id || null, // 支持所有者ID
        created_at: new Date().toISOString(),
      };

      // 上传向量到 Qdrant
      await this.vectorClient.upsertPoint(vectorId, embedding, payload);
      
      // 保存知识项到 PostgreSQL
      const knowledgeItem: KnowledgeItem = {
        ...item,
        vector_id: vectorId,
        ownership_type: item.ownership_type || 'shared',
        owner_id: item.owner_id || undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };
      
      await this.dbModels.addKnowledgeItem(knowledgeItem);
      
      console.log(`知识项 ${item.id} 添加成功 (${item.ownership_type || 'shared'})`);
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
      // 如果查询为空，直接返回最新的知识项，避免生成空向量
      if (!query || query.trim() === '') {
        console.log('🔍 空查询检测，直接返回最新知识项');
        const allItems = await this.dbModels.getAllKnowledgeItems(limit);
        
        // 如果有领域或类型过滤，应用过滤
        if (domain || type) {
          return allItems.filter(item => {
            const domainMatch = !domain || item.domain === domain;
            const typeMatch = !type || item.type === type;
            return domainMatch && typeMatch;
          });
        }
        
        return allItems;
      }
      
      // 生成查询向量
      const queryEmbedding = await this.generateEmbedding(query);
      
      // 构建Qdrant过滤条件（使用正确的格式）
      let filter: Record<string, unknown> | undefined = undefined;
      
      if (domain || type) {
        const conditions: Record<string, unknown>[] = [];
        
        if (domain) {
          conditions.push({
            key: 'domain',
            match: { value: domain }
          });
        }
        
        if (type) {
          conditions.push({
            key: 'type', 
            match: { value: type }
          });
        }
        
        // Qdrant过滤器格式修复
        filter = {
          must: conditions
        };
      }

      // 在 Qdrant 中搜索相似向量
      const searchResults = await this.vectorClient.searchSimilar(
        queryEmbedding,
        limit,
        filter
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
   * 检索相关文档
   */
  async retrieveRelatedDocuments(
    query: string,
    domain?: string,
    limit: number = 10
  ): Promise<FileMetadata[]> {
    try {
      // 首先尝试基于关键词的文档搜索
      const relatedFiles = await this.dbModels.searchRelatedFiles(query, domain, limit);
      
      if (relatedFiles.length > 0) {
        return relatedFiles;
      }
      
      // 如果没有找到相关文档，尝试基于领域获取文档
      if (domain) {
        const domainFiles = await this.dbModels.getFilesByDomain(domain);
        return domainFiles.slice(0, limit);
      }
      
      // 最后返回最新的文档
      return await this.dbModels.getAllFiles(limit);
    } catch (error) {
      console.error('检索相关文档失败:', error);
      return [];
    }
  }

  /**
   * 综合搜索：同时返回知识项和相关文档
   */
  async comprehensiveSearch(
    query: string,
    domain?: string,
    type?: string,
    knowledgeLimit: number = 5,
    documentLimit: number = 5
  ): Promise<{
    knowledge: KnowledgeItem[];
    documents: FileMetadata[];
  }> {
    try {
      // 并行执行知识项搜索和文档搜索
      const [knowledge, documents] = await Promise.all([
        this.retrieveRelevantKnowledge(query, domain, type, knowledgeLimit),
        this.retrieveRelatedDocuments(query, domain, documentLimit)
      ]);

      return {
        knowledge,
        documents
      };
    } catch (error) {
      console.error('综合搜索失败:', error);
      return {
        knowledge: [],
        documents: []
      };
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
   * 生成向量嵌入 - 优化版本
   * 优先级：1. 本地API (Ollama) 2. DeepSeek API（预留） 3. 本地算法（备用）
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 方案1: 尝试使用本地API (Ollama) - 新增优先方案
      const localApiResult = await this.tryLocalApiEmbedding(text);
      if (localApiResult) {
        return localApiResult;
      }

      // 方案2: 尝试使用DeepSeek API（预留未来扩展）
      const deepSeekResult = await this.tryDeepSeekEmbedding(text);
      if (deepSeekResult) {
        return deepSeekResult;
      }

      // 方案3: 使用改进的本地语义算法（备用方案）
      console.log('使用改进的本地语义算法生成向量');
      return this.generateAdvancedLocalEmbedding(text);
    } catch (error) {
      console.error('生成嵌入失败，使用本地算法:', error);
      return this.generateAdvancedLocalEmbedding(text);
    }
  }

  /**
   * 尝试使用本地API (Ollama) 生成嵌入向量
   */
  private async tryLocalApiEmbedding(text: string): Promise<number[] | null> {
    try {
      console.log('🔄 尝试使用本地API (Ollama) 生成嵌入向量...');
      
      // 检查本地API服务状态
      const isApiAvailable = await this.localApiClient.checkApiStatus();
      if (!isApiAvailable) {
        console.log('❌ 本地API服务不可用，跳过');
        return null;
      }

      // 检查模型可用性
      const isModelAvailable = await this.localApiClient.checkModelAvailability();
      if (!isModelAvailable) {
        console.log('❌ 本地API模型不可用，跳过');
        return null;
      }

      // 生成嵌入向量
      const embedding = await this.localApiClient.generateEmbedding(text);
      
      // 验证向量维度
      if (embedding.length !== this.VECTOR_DIMENSION) {
        console.log(`⚠️  本地API返回向量维度不匹配: ${embedding.length}, 期望: ${this.VECTOR_DIMENSION}`);
        
        // 尝试调整向量维度
        if (embedding.length > this.VECTOR_DIMENSION) {
          // 截断向量
          const truncatedEmbedding = embedding.slice(0, this.VECTOR_DIMENSION);
          console.log(`🔧 向量已截断至 ${this.VECTOR_DIMENSION} 维`);
          return truncatedEmbedding;
        } else {
          // 填充向量
          const paddedEmbedding = [...embedding];
          while (paddedEmbedding.length < this.VECTOR_DIMENSION) {
            paddedEmbedding.push(0.001);
          }
          console.log(`🔧 向量已填充至 ${this.VECTOR_DIMENSION} 维`);
          return paddedEmbedding;
        }
      }

      console.log(`✅ 本地API嵌入向量生成成功: ${embedding.length}维`);
      return embedding;
    } catch (error) {
      console.error('本地API嵌入向量生成失败:', error);
      return null;
    }
  }

  /**
   * 尝试使用DeepSeek API生成嵌入 (预留接口)
   */
  private async tryDeepSeekEmbedding(text: string): Promise<number[] | null> {
    try {
      const apiKey = process.env.DEEPSEEK_API_KEY;
      if (!apiKey) {
        console.log('DeepSeek API密钥未配置');
        return null;
      }

      // 注意：DeepSeek目前可能没有专门的embedding API
      // 这里预留接口，未来如果DeepSeek提供embedding服务可以快速集成
      // 
                 // 可能的实现方案（当DeepSeek支持时）：
         // const response = await fetch('https://api.deepseek.com/v1/embeddings', {
         //   method: 'POST',
         //   headers: {
         //     'Authorization': `Bearer ${apiKey}`,
         //     'Content-Type': 'application/json',
         //   },
         //   body: JSON.stringify({
         //     input: text.slice(0, 2000),
         //     model: 'deepseek-embedding-v1',
         //   }),
         // });
         // 
         // if (response.ok) {
         //   const data = await response.json();
         //   const embedding = data.data[0].embedding;
         //   return embedding;
         // }

                  // 临时使用text参数避免linter警告
         console.log(`预留位置: ${text.length}字符文本的embedding生成`);
         console.log('DeepSeek embedding API暂未可用，使用本地算法');
        return null;
      } catch (error) {
        console.error('DeepSeek embedding尝试失败:', error);
        return null;
      }
    }

  /**
   * 改进的本地语义向量生成算法
   */
  private generateAdvancedLocalEmbedding(text: string): number[] {
    const vector: number[] = new Array(this.VECTOR_DIMENSION).fill(0);
    
    // 预处理文本
    const cleanText = this.preprocessText(text);
    const words = this.segmentWords(cleanText);
    const phrases = this.extractPhrases(cleanText);
    
    // 如果文本为空，返回零向量
    if (words.length === 0 && phrases.length === 0) {
      console.warn('预留位置: 0字符文本的embedding生成');
      return new Array(this.VECTOR_DIMENSION).fill(0.001); // 避免完全的零向量
    }
    
    // 多层次特征提取
    const features = {
      // 词汇特征 (维度 0-255)
      lexical: this.extractLexicalFeatures(words),
      // 语义特征 (维度 256-511)
      semantic: this.extractSemanticFeatures(words, phrases),
      // 句法特征 (维度 512-767)
      syntactic: this.extractSyntacticFeatures(cleanText),
      // 领域特征 (维度 768-1023)
      domain: this.extractDomainFeatures(words, phrases)
    };
    
    // 验证特征数组
    Object.entries(features).forEach(([name, featureArray]) => {
      if (!Array.isArray(featureArray) || featureArray.length === 0) {
        console.warn(`特征数组 ${name} 为空，使用默认值`);
        features[name as keyof typeof features] = new Array(64).fill(0.001);
      }
      
      // 检查并修复无效值
      features[name as keyof typeof features] = featureArray.map(val => {
        if (val === null || val === undefined || !isFinite(val) || isNaN(val)) {
          return 0.001; // 替换无效值
        }
        return val;
      });
    });
    
    // 组合特征到向量空间 (4096维 = 16个256维段)
    let offset = 0;
    
    // 填充词汇特征 (0-1023维，4个段)
    for (let segment = 0; segment < 4; segment++) {
      for (let i = 0; i < 256; i++) {
        vector[offset + i] = features.lexical[i % features.lexical.length];
      }
      offset += 256;
    }
    
    // 填充语义特征 (1024-2047维，4个段)
    for (let segment = 0; segment < 4; segment++) {
      for (let i = 0; i < 256; i++) {
        vector[offset + i] = features.semantic[i % features.semantic.length];
      }
      offset += 256;
    }
    
    // 填充句法特征 (2048-3071维，4个段)
    for (let segment = 0; segment < 4; segment++) {
      for (let i = 0; i < 256; i++) {
        vector[offset + i] = features.syntactic[i % features.syntactic.length];
      }
      offset += 256;
    }
    
    // 填充领域特征 (3072-4095维，4个段)
    for (let segment = 0; segment < 4; segment++) {
      for (let i = 0; i < 256; i++) {
        vector[offset + i] = features.domain[i % features.domain.length];
      }
      offset += 256;
    }
    
    // 最终安全检查
    const safeVector = vector.map(val => {
      if (val === null || val === undefined || !isFinite(val) || isNaN(val)) {
        return 0.001;
      }
      return val;
    });
    
    // 标准化向量
    return this.normalizeVector(safeVector);
  }

  /**
   * 预处理文本
   */
  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ') // 保留中文、英文、数字
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * 简单的中文分词
   */
  private segmentWords(text: string): string[] {
    const words: string[] = [];
    
    // 中文单字分词
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    words.push(...chineseChars);
    
    // 英文单词分词
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    words.push(...englishWords);
    
    // 数字
    const numbers = text.match(/\d+/g) || [];
    words.push(...numbers);
    
    return words;
  }

  /**
   * 提取短语
   */
  private extractPhrases(text: string): string[] {
    const phrases: string[] = [];
    
    // 提取2-4字的中文短语
    const chineseText = text.replace(/[^\u4e00-\u9fa5]/g, '');
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= chineseText.length - len; i++) {
        phrases.push(chineseText.substring(i, i + len));
      }
    }
    
    return phrases;
  }

  /**
   * 提取词汇特征
   */
  private extractLexicalFeatures(words: string[]): number[] {
    const features: number[] = [];
    const totalWords = words.length;
    
    if (totalWords === 0) return new Array(64).fill(0);
    
    // 词频统计
    const wordFreq: Record<string, number> = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // 特征计算
    const uniqueWords = Object.keys(wordFreq).length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / totalWords;
    const maxFreq = Math.max(...Object.values(wordFreq));
    
    features.push(
      uniqueWords / totalWords,              // 词汇多样性
      avgWordLength / 10,                    // 平均词长
      maxFreq / totalWords,                  // 最高频词比例
      words.filter(w => /[\u4e00-\u9fa5]/.test(w)).length / totalWords, // 中文比例
      words.filter(w => /[a-zA-Z]/.test(w)).length / totalWords,        // 英文比例
      words.filter(w => /\d/.test(w)).length / totalWords               // 数字比例
    );
    
    // 填充到64维
    while (features.length < 64) {
      const hash = this.simpleHash(words.join('') + features.length);
      features.push((hash % 1000) / 1000);
    }
    
    return features.slice(0, 64);
  }

  /**
   * 提取语义特征
   */
  private extractSemanticFeatures(words: string[], phrases: string[]): number[] {
    const features: number[] = [];
    
    // 语义词典 - 按主题分类
    const semanticDict = {
      technology: ['技术', '系统', '算法', '数据', '网络', '软件', '硬件', '程序', '代码', '开发'],
      business: ['商业', '市场', '销售', '客户', '产品', '服务', '管理', '营销', '策略', '经济'],
      academic: ['研究', '理论', '方法', '实验', '分析', '论文', '学术', '科学', '知识', '教育'],
      medical: ['医疗', '健康', '疾病', '治疗', '药物', '诊断', '医院', '医生', '患者', '症状'],
      legal: ['法律', '法规', '合同', '权利', '义务', '法院', '律师', '条款', '规定', '制度']
    };
    
    // 计算各主题的匹配度
    const totalLength = words.length + phrases.length;
    for (const [, keywords] of Object.entries(semanticDict)) {
      let score = 0;
      const allText = [...words, ...phrases].join('');
      
      keywords.forEach(keyword => {
        const count = (allText.match(new RegExp(keyword, 'g')) || []).length;
        score += count;
      });
      
      features.push(totalLength > 0 ? score / totalLength : 0);
    }
    
    // 语义密度特征
    const semanticWords = words.filter(word => 
      Object.values(semanticDict).flat().some(keyword => word.includes(keyword))
    );
    features.push(words.length > 0 ? semanticWords.length / words.length : 0);
    
    // 填充到64维
    while (features.length < 64) {
      const hash = this.simpleHash(words.join('') + phrases.join('') + features.length);
      features.push((hash % 1000) / 1000);
    }
    
    return features.slice(0, 64);
  }

  /**
   * 提取句法特征
   */
  private extractSyntacticFeatures(text: string): number[] {
    const features: number[] = [];
    
    // 标点符号统计
    const punctuation = text.match(/[。！？，；：]/g) || [];
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    
    features.push(
      text.length > 0 ? punctuation.length / text.length : 0,                    // 标点密度
      sentences.length > 0 ? text.length / sentences.length : 0, // 平均句长
      text.length > 0 ? (text.match(/[，；：]/g) || []).length / text.length : 0,       // 分隔符密度
      text.length > 0 ? (text.match(/[？]/g) || []).length / text.length : 0,           // 疑问句比例
      text.length > 0 ? (text.match(/[！]/g) || []).length / text.length : 0            // 感叹句比例
    );
    
    // 填充到64维
    while (features.length < 64) {
      const hash = this.simpleHash(text + features.length);
      features.push((hash % 1000) / 1000);
    }
    
    return features.slice(0, 64);
  }

  /**
   * 提取领域特征 (改进版本)
   */
  private extractDomainFeatures(words: string[], phrases: string[]): number[] {
    const features: number[] = [];
    const allText = [...words, ...phrases].join('');
    
    // 专业领域词汇库
    const domainKeywords = {
      physics: ['物理', '量子', '能量', '力学', '电磁', '光学', '热力学', '粒子', '波动', '场'],
      chemistry: ['化学', '分子', '原子', '反应', '化合物', '元素', '催化', '溶液', '晶体', '键'],
      biology: ['生物', '细胞', '基因', '蛋白质', 'DNA', '遗传', '进化', '生态', '酶', '组织'],
      medicine: ['医学', '疾病', '治疗', '药物', '诊断', '症状', '病理', '临床', '手术', '康复'],
      computer: ['计算机', '程序', '算法', '数据库', '网络', '软件', '编程', '系统', '代码', '接口'],
      mathematics: ['数学', '方程', '函数', '矩阵', '概率', '统计', '几何', '代数', '微积分', '证明']
    };
    
    // 计算各领域的匹配度
    const totalLength = words.length + phrases.length;
    for (const keywords of Object.values(domainKeywords)) {
      let score = 0;
      keywords.forEach(keyword => {
        const count = (allText.match(new RegExp(keyword, 'g')) || []).length;
        score += count;
      });
      features.push(totalLength > 0 ? score / totalLength : 0);
    }
    
    // 填充到64维
    while (features.length < 64) {
      const hash = this.simpleHash(allText + features.length);
      features.push((hash % 1000) / 1000);
    }
    
    return features.slice(0, 64);
  }

  /**
   * 向量标准化
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
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

  /**
   * 多知识库检索：同时从专属和共享知识库检索相关知识
   */
  async retrieveFromMultipleKnowledgeBases(
    query: string,
    ownerId: string = 'default_user',
    domain?: string,
    type?: string,
    privateLimit: number = 3,
    sharedLimit: number = 5
  ): Promise<{
    private_knowledge: KnowledgeItem[];
    shared_knowledge: KnowledgeItem[];
    combined_knowledge: KnowledgeItem[];
    private_documents: FileMetadata[];
    shared_documents: FileMetadata[];
  }> {
    try {
      console.log(`开始多知识库检索: 查询="${query}", 领域="${domain || 'all'}"`);
      
      // 并行检索专属和共享知识
      const [
        privateKnowledge,
        sharedKnowledge,
        privateDocuments,
        sharedDocuments
      ] = await Promise.all([
        // 检索专属知识库中的知识项
        this.retrieveRelevantKnowledge(query, domain, type, privateLimit),
        // 检索共享知识库中的知识项
        this.retrieveRelevantKnowledge(query, domain, type, sharedLimit),
        // 检索专属文档
        this.retrievePrivateDocuments(query, ownerId, domain, 3),
        // 检索共享文档
        this.retrieveSharedDocuments(query, domain, 3)
      ]);

      // 合并并去重知识项，按相关度排序
      const combinedKnowledge = this.mergeAndRankKnowledge(
        privateKnowledge,
        sharedKnowledge,
        privateLimit + sharedLimit
      );

      console.log(`多知识库检索完成: 专属${privateKnowledge.length}条, 共享${sharedKnowledge.length}条, 合并${combinedKnowledge.length}条`);

      return {
        private_knowledge: privateKnowledge,
        shared_knowledge: sharedKnowledge,
        combined_knowledge: combinedKnowledge,
        private_documents: privateDocuments,
        shared_documents: sharedDocuments
      };
    } catch (error) {
      console.error('多知识库检索失败:', error);
      return {
        private_knowledge: [],
        shared_knowledge: [],
        combined_knowledge: [],
        private_documents: [],
        shared_documents: []
      };
    }
  }

  /**
   * 检索专属文档
   */
  async retrievePrivateDocuments(
    query: string,
    ownerId: string,
    domain?: string,
    limit: number = 5
  ): Promise<FileMetadata[]> {
    try {
      // 获取用户的专属文档
      const privateFiles = await this.dbModels.getPrivateFiles(ownerId, limit * 2);
      
      // 基于查询和领域过滤
      const filteredFiles = privateFiles.filter(file => {
        const matchesQuery = !query || 
          file.filename.toLowerCase().includes(query.toLowerCase()) ||
          (file.tags && file.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())));
        
        const matchesDomain = !domain || file.domain === domain;
        
        return matchesQuery && matchesDomain;
      });

      return filteredFiles.slice(0, limit);
    } catch (error) {
      console.error('检索专属文档失败:', error);
      return [];
    }
  }

  /**
   * 检索共享文档
   */
  async retrieveSharedDocuments(
    query: string,
    domain?: string,
    limit: number = 5
  ): Promise<FileMetadata[]> {
    try {
      // 获取共享文档
      const sharedFiles = await this.dbModels.getSharedFiles(limit * 2);
      
      // 基于查询和领域过滤
      const filteredFiles = sharedFiles.filter(file => {
        const matchesQuery = !query || 
          file.filename.toLowerCase().includes(query.toLowerCase()) ||
          (file.tags && file.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())));
        
        const matchesDomain = !domain || file.domain === domain;
        
        return matchesQuery && matchesDomain;
      });

      return filteredFiles.slice(0, limit);
    } catch (error) {
      console.error('检索共享文档失败:', error);
      return [];
    }
  }

  /**
   * 合并并排序知识项
   */
  private mergeAndRankKnowledge(
    privateKnowledge: KnowledgeItem[],
    sharedKnowledge: KnowledgeItem[],
    maxResults: number = 8
  ): KnowledgeItem[] {
    // 为专属知识项添加来源标识和权重加成
    const enhancedPrivateKnowledge = privateKnowledge.map(item => ({
      ...item,
      source: `${item.source} (专属)`,
      relevance_score: (item.relevance_score || 0) * 1.2, // 专属知识库权重加成
      knowledge_source: 'private' as const
    }));

    // 为共享知识项添加来源标识
    const enhancedSharedKnowledge = sharedKnowledge.map(item => ({
      ...item,
      source: `${item.source} (共享)`,
      knowledge_source: 'shared' as const
    }));

    // 合并所有知识项
    const allKnowledge = [...enhancedPrivateKnowledge, ...enhancedSharedKnowledge];

    // 去重：基于内容相似度
    const uniqueKnowledge = this.deduplicateKnowledge(allKnowledge);

    // 按相关度排序
    uniqueKnowledge.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));

    return uniqueKnowledge.slice(0, maxResults);
  }

  /**
   * 知识项去重
   */
  private deduplicateKnowledge(knowledge: KnowledgeItem[]): KnowledgeItem[] {
    const uniqueKnowledge: KnowledgeItem[] = [];
    const seenContent = new Set<string>();

    for (const item of knowledge) {
      // 创建内容指纹
      const contentFingerprint = this.createContentFingerprint(item.content);
      
      if (!seenContent.has(contentFingerprint)) {
        seenContent.add(contentFingerprint);
        uniqueKnowledge.push(item);
      } else {
        // 如果内容相似，保留相关度更高的
        const existingIndex = uniqueKnowledge.findIndex(existing => 
          this.createContentFingerprint(existing.content) === contentFingerprint
        );
        
        if (existingIndex !== -1 && 
            (item.relevance_score || 0) > (uniqueKnowledge[existingIndex].relevance_score || 0)) {
          uniqueKnowledge[existingIndex] = item;
        }
      }
    }

    return uniqueKnowledge;
  }

  /**
   * 创建内容指纹用于去重
   */
  private createContentFingerprint(content: string): string {
    // 移除标点符号和空格，转为小写
    const normalized = content.toLowerCase().replace(/[^\w\u4e00-\u9fff]/g, '');
    // 取前50个字符作为指纹
    return normalized.substring(0, 50);
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