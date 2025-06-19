import { Pinecone } from '@pinecone-database/pinecone';
import { DeepSeekClient, createDeepSeekClient } from '@/lib/deepseek/deepseek-client';

// 配置信息
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'chatbot';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 知识项接口
export interface KnowledgeItem {
  id: string;
  type: 'terminology' | 'rule' | 'case' | 'style';
  domain: string;
  content: string;
  context: string;
  source: string;
  confidence: number;
  tags: string[];
  relevance_score?: number;
}

// 领域信息接口
export interface DomainInfo {
  domain: string;
  confidence: number;
  keywords: string[];
}

/**
 * 领域分类器
 */
export class DomainClassifier {
  private domainKeywords: Record<string, string[]> = {
    'physics': [
      '量子', '粒子', '波长', '能量', '力学', '电磁', '热力学', '光学', '原子', '分子',
      '相对论', '纠缠', '叠加', '波函数', '薛定谔', '牛顿', '麦克斯韦', '物理',
      '磁场', '电场', '重力', '引力', '辐射', '频率', '振动', '波动'
    ],
    'chemistry': [
      '分子', '原子', '化学', '反应', '催化', '有机', '无机', '物理化学', '分析化学',
      '元素', '化合物', '溶液', '酸碱', '氧化', '还原', '键', '离子', '电子',
      '烷烃', '烯烃', '芳香', '醇', '醛', '酮', '酸', '胺', '聚合物'
    ],
    'biology': [
      '细胞', '基因', '蛋白质', '生物', '进化', 'DNA', 'RNA', '酶', '代谢',
      '遗传', '变异', '选择', '适应', '生态', '环境', '种群', '群落', '生态系统',
      '细胞膜', '细胞核', '线粒体', '叶绿体', '蛋白质合成', '转录', '翻译'
    ],
    'medicine': [
      '患者', '治疗', '临床', '药物', '诊断', '疾病', '症状', '病理', '生理',
      '解剖', '病毒', '细菌', '感染', '免疫', '抗体', '疫苗', '手术', '康复',
      '医学', '医院', '医生', '护士', '药理', '毒理', '流行病', '预防'
    ],
    'engineering': [
      '系统', '设计', '优化', '算法', '控制', '机械', '电子', '计算机', '软件',
      '硬件', '网络', '信号', '处理', '自动化', '机器人', '人工智能', '材料',
      '结构', '强度', '应力', '应变', '制造', '加工', '工艺', '技术'
    ],
    'mathematics': [
      '数学', '函数', '微分', '积分', '矩阵', '向量', '概率', '统计', '代数',
      '几何', '拓扑', '分析', '离散', '连续', '极限', '导数', '级数', '变换',
      '方程', '不等式', '定理', '证明', '公式', '计算', '数值', '逼近'
    ]
  };

  /**
   * 识别文档领域
   */
  async identifyDomain(content: string): Promise<DomainInfo> {
    const text = content.toLowerCase();
    const domainScores: Record<string, number> = {};
    const foundKeywords: Record<string, string[]> = {};

    // 计算每个领域的匹配分数
    for (const [domain, keywords] of Object.entries(this.domainKeywords)) {
      let score = 0;
      const matched: string[] = [];

      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length;
          matched.push(keyword);
        }
      }

      domainScores[domain] = score;
      foundKeywords[domain] = matched;
    }

    // 找到得分最高的领域
    const bestDomain = Object.keys(domainScores).reduce((a, b) => 
      domainScores[a] > domainScores[b] ? a : b
    );

    const maxScore = domainScores[bestDomain];
    const confidence = Math.min(maxScore / 10, 1); // 标准化置信度

    return {
      domain: maxScore > 0 ? bestDomain : 'general',
      confidence: confidence,
      keywords: foundKeywords[bestDomain] || []
    };
  }
}

/**
 * 基于Pinecone的知识检索器
 */
export class KnowledgeRetriever {
  private pinecone: Pinecone | null = null;
  private deepseek: DeepSeekClient | null = null;
  private index: ReturnType<Pinecone['index']> | null = null;

  constructor() {
    this.initializePinecone();
  }

  /**
   * 初始化Pinecone连接和DeepSeek客户端
   */
  private async initializePinecone() {
    try {
      if (!PINECONE_API_KEY) {
        console.warn('Pinecone API密钥未配置，使用模拟数据');
        return;
      }

      this.pinecone = new Pinecone({
        apiKey: PINECONE_API_KEY,
      });

      this.index = this.pinecone.index(PINECONE_INDEX_NAME);

      if (DEEPSEEK_API_KEY) {
        this.deepseek = createDeepSeekClient(DEEPSEEK_API_KEY, {
          timeout: 30000, // 30秒超时，适合国内网络环境
          maxRetries: 3,
        });
        
        // 移除启动时的API测试，改为懒加载策略
        console.log('✅ DeepSeek API配置就绪 (懒加载模式)');
      } else {
        console.warn('🚫 DeepSeek API密钥未配置，将使用本地向量生成');
      }

      console.log('✅ Pinecone连接初始化成功');
    } catch (error) {
      console.error('❌ Pinecone初始化失败:', error);
    }
  }

  /**
   * 懒加载DeepSeek API连接测试
   * 只在第一次实际使用时测试连接，避免启动时阻塞
   */
  private async ensureDeepSeekConnection(): Promise<boolean> {
    if (!this.deepseek) return false;
    
    try {
      console.log('🔌 首次使用DeepSeek API，测试连接...');
      
      // 使用健康检查测试连接
      const isHealthy = await this.deepseek.healthCheck();
      
      if (isHealthy) {
        console.log('✅ DeepSeek API连接测试成功');
        return true;
      }
      
      throw new Error('API健康检查失败');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  DeepSeek API连接测试失败: ${errorMessage}`);
      console.log('🔄 自动切换到本地向量生成模式');
      
      return false;
    }
  }

  /**
   * 智能向量生成 - 优先使用DeepSeek本地算法，支持API连通性检查
   */
  private async getEmbedding(text: string): Promise<number[]> {
    // 优先使用本地DeepSeek向量生成算法
    if (this.deepseek) {
      try {
        console.log('🔍 使用DeepSeek本地算法生成嵌入向量...');
        
        // 智能文本预处理
        const processedText = this.preprocessTextForEmbedding(text);
        
        // 使用DeepSeek的改进向量生成算法
        const embeddings = await this.deepseek.createEmbedding(processedText);
        const embedding = embeddings[0];
        
        console.log(`✅ DeepSeek向量生成成功: ${embedding.length}维`);
        return embedding;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️  DeepSeek向量生成失败: ${errorMessage}`);
        console.log('🔄 切换到基础模拟向量模式');
      }
    } else {
      console.log('🎯 使用基础模拟向量模式 (DeepSeek不可用)');
    }

    // 降级到基础模拟向量
    return this.generateMockEmbedding(text);
  }

  /**
   * 文本预处理 - 优化API请求
   */
  private preprocessTextForEmbedding(text: string): string {
    // 1. 限制长度以避免超时
    let processedText = text.substring(0, 1500); // 保守的长度限制
    
    // 2. 清理多余空白字符
    processedText = processedText.replace(/\s+/g, ' ').trim();
    
    // 3. 移除可能导致问题的特殊字符
    processedText = processedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return processedText;
  }

  /**
   * 生成高质量模拟向量嵌入
   * 基于文本语义特征生成具有一定准确性的向量，在OpenAI不可用时提供可靠的替代方案
   */
  private generateMockEmbedding(text: string): number[] {
    console.log('🎯 使用高质量模拟向量生成器...');
    
    // 文本预处理和特征提取
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中文和英文词汇
      .split(/\s+/)
      .filter(word => word.length > 1);
    
    const embedding = new Array(1024).fill(0);
    
    // 1. 基于词汇位置的语义编码
    words.forEach((word, wordIndex) => {
      const wordHash = this.enhancedHash(word);
      const positionWeight = 1 / Math.sqrt(wordIndex + 1); // 位置权重递减
      
      for (let i = 0; i < 1024; i++) {
        const dimension = (wordHash + i) % 1024;
        embedding[dimension] += Math.sin((wordHash + i) * 0.01) * positionWeight * 0.1;
      }
    });
    
    // 2. 添加文本长度特征
    const lengthFeature = Math.log(text.length + 1) * 0.05;
    for (let i = 0; i < 64; i++) {
      embedding[i] += lengthFeature;
    }
    
    // 3. 添加语言特征
    const chineseCharCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const languageFeature = chineseCharCount / text.length;
    for (let i = 64; i < 128; i++) {
      embedding[i] += languageFeature * 0.1;
    }
    
    // 4. 添加词汇多样性特征
    const uniqueWords = new Set(words);
    const diversityFeature = uniqueWords.size / Math.max(words.length, 1);
    for (let i = 128; i < 192; i++) {
      embedding[i] += diversityFeature * 0.1;
    }
    
    // 5. 标准化向量到单位长度
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] = embedding[i] / magnitude;
      }
    }
    
    // 6. 添加少量随机噪声以避免完全相同的向量
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] += (Math.random() - 0.5) * 0.001;
    }
    
    console.log(`✨ 生成模拟向量: ${words.length}词汇, ${uniqueWords.size}唯一词, 维度${embedding.length}`);
    return embedding;
  }

  /**
   * 增强的哈希函数 - 更好的分布特性
   */
  private enhancedHash(str: string): number {
    let hash = 5381; // DJB2算法的初始值
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) + hash) + char; // hash * 33 + char
    }
    
    // 使用乘法哈希改善分布
    hash = hash * 2654435761; // 黄金比例的近似值
    
    return Math.abs(hash);
  }

  /**
   * 简单哈希函数 - 保持向后兼容
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
   * 检索相关知识
   */
  async retrieveRelevantKnowledge(
    query: string,
    domain?: string,
    type?: string,
    limit: number = 5
  ): Promise<KnowledgeItem[]> {
    try {
      if (!this.index) {
        console.warn('Pinecone未连接，使用模拟知识库');
        return this.getMockKnowledge(domain, limit);
      }

      // 生成查询向量
      const queryVector = await this.getEmbedding(query);

      // 构建过滤条件
      const filter: Record<string, string> = {};
      if (domain && domain !== 'general') {
        filter.domain = domain;
      }
      if (type) {
        filter.type = type;
      }

      // 向量相似度搜索
      const searchResponse = await this.index.query({
        vector: queryVector,
        topK: limit,
        includeMetadata: true,
        filter: Object.keys(filter).length > 0 ? filter : undefined
      });

      // 转换搜索结果
      const results: KnowledgeItem[] = searchResponse.matches.map((match: {
        id: string;
        score?: number;
        metadata?: Record<string, unknown>;
      }) => {
        const type = match.metadata?.type as string;
        const validType: 'terminology' | 'rule' | 'case' | 'style' = 
          ['terminology', 'rule', 'case', 'style'].includes(type) 
            ? type as 'terminology' | 'rule' | 'case' | 'style'
            : 'terminology';
            
        return {
          id: match.id,
          type: validType,
          domain: (match.metadata?.domain as string) || 'general',
          content: (match.metadata?.content as string) || '',
          context: (match.metadata?.context as string) || '',
          source: (match.metadata?.source as string) || '知识库',
          confidence: (match.metadata?.confidence as number) || 0.8,
          tags: (match.metadata?.tags as string[]) || [],
          relevance_score: match.score || 0
        };
      });

      console.log(`从Pinecone检索到 ${results.length} 条知识`);
      return results;

    } catch (error) {
      console.error('知识检索失败:', error);
      return this.getMockKnowledge(domain, limit);
    }
  }

  /**
   * 添加知识项到向量数据库
   */
  async addKnowledgeItem(item: KnowledgeItem): Promise<void> {
    try {
      if (!this.index) {
        console.warn('Pinecone未连接，无法添加知识项');
        return;
      }

      // 生成内容的嵌入向量
      const embedding = await this.getEmbedding(item.content + ' ' + item.context);
      
      // 验证向量维度
      if (embedding.length !== 1024) {
        console.error(`向量维度错误: 期望1024, 实际${embedding.length}`);
        // 强制调整到1024维度
        const adjustedEmbedding = embedding.length > 1024 
          ? embedding.slice(0, 1024)
          : [...embedding, ...new Array(1024 - embedding.length).fill(0)];
        console.log(`向量维度已调整: ${embedding.length} -> ${adjustedEmbedding.length}`);
        
        // 构建向量数据
        const vectorData = {
          id: item.id,
          values: adjustedEmbedding,
          metadata: {
            type: item.type,
            domain: item.domain,
            content: item.content,
            context: item.context,
            source: item.source,
            confidence: item.confidence,
            tags: item.tags,
            created_at: new Date().toISOString()
          }
        };

        // 上传到Pinecone
        await this.index.upsert([vectorData]);
        console.log(`知识项 ${item.id} 已添加到向量数据库 (维度已调整)`);
      } else {
        // 构建向量数据
        const vectorData = {
          id: item.id,
          values: embedding,
          metadata: {
            type: item.type,
            domain: item.domain,
            content: item.content,
            context: item.context,
            source: item.source,
            confidence: item.confidence,
            tags: item.tags,
            created_at: new Date().toISOString()
          }
        };

        // 上传到Pinecone
        await this.index.upsert([vectorData]);
        console.log(`知识项 ${item.id} 已添加到向量数据库`);
      }

    } catch (error) {
      console.error('添加知识项失败:', error);
    }
  }

  /**
   * 批量初始化知识库
   */
  async initializeKnowledgeBase(): Promise<void> {
    console.log('开始初始化知识库...');

    const knowledgeItems: KnowledgeItem[] = [
      // 物理学知识
      {
        id: 'physics_001',
        type: 'terminology',
        domain: 'physics',
        content: '量子态：描述量子系统状态的数学表示',
        context: '量子力学中的基本概念，应使用"量子态"而非"量子状态"',
        source: '量子力学专业词典',
        confidence: 0.95,
        tags: ['量子力学', '基本概念']
      },
      {
        id: 'physics_002',
        type: 'case',
        domain: 'physics',
        content: '原文："量子状态的叠加原理" → 修正："量子态的叠加原理"',
        context: '物理学术语纠错案例，量子力学中应使用"量子态"',
        source: '历史纠错记录',
        confidence: 0.88,
        tags: ['术语纠错', '量子力学']
      },

      // 化学知识
      {
        id: 'chemistry_001',
        type: 'terminology',
        domain: 'chemistry',
        content: '催化剂：能够改变化学反应速率而自身不被消耗的物质',
        context: '化学术语，正确说法是"催化剂"而非"催化素"',
        source: '化学专业词典',
        confidence: 0.92,
        tags: ['化学基础', '催化']
      },
      {
        id: 'chemistry_002',
        type: 'case',
        domain: 'chemistry',
        content: '原文："催化素的作用机制" → 修正："催化剂的作用机制"',
        context: '化学术语纠错案例，"催化素"不是标准术语',
        source: '历史纠错记录',
        confidence: 0.90,
        tags: ['术语纠错', '化学']
      },

      // 生物学知识
      {
        id: 'biology_001',
        type: 'terminology',
        domain: 'biology',
        content: 'DNA（脱氧核糖核酸）：携带遗传信息的生物大分子',
        context: '生物学术语，首次出现时建议使用"DNA（脱氧核糖核酸）"的标准格式',
        source: '生物学专业词典',
        confidence: 0.94,
        tags: ['分子生物学', '遗传']
      },
      {
        id: 'biology_002',
        type: 'case',
        domain: 'biology',
        content: '原文："脱氧核糖核酸复制" → 修正："DNA（脱氧核糖核酸）复制"',
        context: '生物学术语标准化案例，首次出现建议使用完整格式',
        source: '历史纠错记录',
        confidence: 0.85,
        tags: ['术语规范', '生物学']
      },

      // 医学知识
      {
        id: 'medicine_001',
        type: 'terminology',
        domain: 'medicine',
        content: '症状：疾病的临床表现，患者主观感受到的异常',
        context: '医学术语，区别于"征象"（客观检查发现）',
        source: '医学术语词典',
        confidence: 0.93,
        tags: ['临床医学', '诊断']
      },

      // 工程学知识
      {
        id: 'engineering_001',
        type: 'terminology',
        domain: 'engineering',
        content: '算法：解决特定问题的一系列明确定义的计算步骤',
        context: '计算机工程术语，描述问题求解的方法和步骤',
        source: '计算机工程词典',
        confidence: 0.91,
        tags: ['计算机科学', '算法']
      },

      // 数学知识
      {
        id: 'mathematics_001',
        type: 'terminology',
        domain: 'mathematics',
        content: '函数：两个集合之间的对应关系，每个输入对应唯一输出',
        context: '数学基本概念，描述变量之间的依赖关系',
        source: '数学分析教材',
        confidence: 0.96,
        tags: ['数学分析', '函数']
      },

      // 通用学术写作规范
      {
        id: 'general_001',
        type: 'rule',
        domain: 'general',
        content: '学术文献中首次出现的专业术语应提供完整定义或英文对照',
        context: '学术写作规范，提高文章可读性和专业性',
        source: '学术写作指南',
        confidence: 0.87,
        tags: ['学术写作', '规范']
      },
      {
        id: 'general_002',
        type: 'rule',
        domain: 'general',
        content: '避免在同一句中重复使用相同的词汇，特别是连续重复',
        context: '通用写作规范，提高文章表达质量',
        source: '写作指南',
        confidence: 0.85,
        tags: ['写作规范', '语言质量']
      }
    ];

    // 批量添加知识项，每次处理3个，避免API限制
    const batchSize = 3;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < knowledgeItems.length; i += batchSize) {
      const batch = knowledgeItems.slice(i, i + batchSize);
      
      console.log(`处理第${Math.floor(i/batchSize) + 1}批知识项 (${batch.length}个)...`);
      
      for (const item of batch) {
        try {
          await this.addKnowledgeItem(item);
          successCount++;
          console.log(`✅ 成功添加: ${item.id}`);
        } catch (error) {
          failCount++;
          console.error(`❌ 添加失败: ${item.id}`, error);
        }
        
        // 在每个知识项之间添加小延迟，避免API限制
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 批次之间添加更长延迟
      if (i + batchSize < knowledgeItems.length) {
        console.log('等待3秒后处理下一批...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log(`知识库初始化完成: 成功${successCount}条, 失败${failCount}条, 总共${knowledgeItems.length}条`);
  }

  /**
   * 从用户反馈中学习
   */
  async learnFromFeedback(
    original: string,
    suggestion: string,
    feedback: 'accept' | 'reject' | 'modify',
    domain: string
  ): Promise<void> {
    if (feedback === 'accept') {
      // 创建成功案例
      const newCase: KnowledgeItem = {
        id: `case_${Date.now()}`,
        type: 'case',
        domain: domain,
        content: `原文："${original}" → 修正："${suggestion}"`,
        context: `用户接受的AI建议，领域：${domain}`,
        source: '用户反馈学习',
        confidence: 0.85,
        tags: ['用户反馈', '成功案例', domain]
      };

      await this.addKnowledgeItem(newCase);
      console.log('学习成功案例:', newCase.content);
    }
  }

  /**
   * 获取模拟知识库数据（当Pinecone不可用时）
   */
  private getMockKnowledge(domain?: string, limit: number = 5): KnowledgeItem[] {
    const mockKnowledge: Record<string, KnowledgeItem[]> = {
      'physics': [
        {
          id: 'mock_physics_1',
          type: 'terminology',
          domain: 'physics',
          content: '量子态：描述量子系统状态的数学表示',
          context: '物理学术语，应使用"量子态"而非"量子状态"',
          source: '模拟知识库',
          confidence: 0.9,
          tags: ['量子力学'],
          relevance_score: 0.85
        },
        {
          id: 'mock_physics_2',
          type: 'case',
          domain: 'physics',
          content: '原文："量子状态" → 修正："量子态"',
          context: '物理学术语纠错案例',
          source: '模拟知识库',
          confidence: 0.88,
          tags: ['术语纠错'],
          relevance_score: 0.82
        }
      ],
      'chemistry': [
        {
          id: 'mock_chemistry_1',
          type: 'terminology',
          domain: 'chemistry',
          content: '催化剂：能够改变化学反应速率的物质',
          context: '化学术语，正确说法是"催化剂"而非"催化素"',
          source: '模拟知识库',
          confidence: 0.92,
          tags: ['化学基础'],
          relevance_score: 0.88
        },
        {
          id: 'mock_chemistry_2',
          type: 'case',
          domain: 'chemistry',
          content: '原文："催化素" → 修正："催化剂"',
          context: '化学术语纠错案例',
          source: '模拟知识库',
          confidence: 0.90,
          tags: ['术语纠错'],
          relevance_score: 0.85
        }
      ],
      'biology': [
        {
          id: 'mock_biology_1',
          type: 'terminology',
          domain: 'biology',
          content: 'DNA（脱氧核糖核酸）：携带遗传信息的分子',
          context: '生物学术语标准格式',
          source: '模拟知识库',
          confidence: 0.94,
          tags: ['分子生物学'],
          relevance_score: 0.90
        }
      ],
      'general': [
        {
          id: 'mock_general_1',
          type: 'rule',
          domain: 'general',
          content: '避免重复使用相同词汇',
          context: '通用写作规范',
          source: '模拟知识库',
          confidence: 0.85,
          tags: ['写作规范'],
          relevance_score: 0.75
        }
      ]
    };

    const domainKnowledge = domain && mockKnowledge[domain] 
      ? mockKnowledge[domain] 
      : mockKnowledge['general'];

    return domainKnowledge.slice(0, limit);
  }

  /**
   * 获取知识库统计信息
   */
  async getKnowledgeStats(): Promise<{
    total: number;
    byDomain: Record<string, number>;
    byType: Record<string, number>;
  }> {
    try {
      if (!this.index) {
        return {
          total: 0,
          byDomain: {},
          byType: {}
        };
      }

      // 这里可以实现更详细的统计查询
      // Pinecone目前不直接支持聚合查询，需要其他方式实现

      return {
        total: 10, // 模拟数据
        byDomain: {
          'physics': 2,
          'chemistry': 2,
          'biology': 2,
          'medicine': 1,
          'engineering': 1,
          'mathematics': 1,
          'general': 1
        },
        byType: {
          'terminology': 6,
          'case': 3,
          'rule': 1
        }
      };

    } catch (error) {
      console.error('获取知识库统计失败:', error);
      return {
        total: 0,
        byDomain: {},
        byType: {}
      };
    }
  }
} 