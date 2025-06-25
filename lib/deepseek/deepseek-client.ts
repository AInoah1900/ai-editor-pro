/**
 * DeepSeek API客户端
 * 专为中国国内网络环境设计，提供完整的AI分析和向量生成功能
 */

interface DeepSeekConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * DeepSeek API客户端类
 */
export class DeepSeekClient {
  private config: DeepSeekConfig;
  private baseURL: string;

  constructor(config: DeepSeekConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      baseURL: 'https://api.deepseek.com/v1',
      ...config
    };
    this.baseURL = this.config.baseURL!;
  }

  /**
   * 创建聊天完成
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.baseURL}/chat/completions`;
    
    const requestBody = {
      model: request.model || 'deepseek-r1:8b',
      messages: request.messages,
      temperature: request.temperature ?? 0.1,
      max_tokens: request.max_tokens ?? 4000,
      stream: request.stream ?? false
    };

    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API错误: ${response.status} - ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * 生成文本嵌入向量 - 使用本地算法
   * 由于DeepSeek暂无embedding API，使用改进的本地算法
   */
  async createEmbedding(input: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(input) ? input : [input];
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = this.generateAdvancedEmbedding(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * 改进的本地嵌入向量生成算法
   * 基于语义特征和统计特征的混合方法
   */
  private generateAdvancedEmbedding(text: string): number[] {
    const dimension = 4096;
    const embedding = new Array(dimension).fill(0);
    
    // 1. 基础文本特征
    const textFeatures = this.extractTextFeatures(text);
    
    // 2. 语义特征映射
    const semanticFeatures = this.extractSemanticFeatures(text);
    
    // 3. 领域特征
    const domainFeatures = this.extractDomainFeatures(text);
    
    // 4. 统计特征
    const statisticalFeatures = this.extractStatisticalFeatures(text);
    
    // 5. 组合特征到向量空间
    for (let i = 0; i < dimension; i++) {
      const featureIndex = i % 4;
      let value = 0;
      
      switch (featureIndex) {
        case 0: // 基础特征 (0-255维)
          value = textFeatures[i % textFeatures.length];
          break;
        case 1: // 语义特征 (256-511维)
          value = semanticFeatures[i % semanticFeatures.length];
          break;
        case 2: // 领域特征 (512-767维)
          value = domainFeatures[i % domainFeatures.length];
          break;
        case 3: // 统计特征 (768-1023维)
          value = statisticalFeatures[i % statisticalFeatures.length];
          break;
      }
      
      // 添加位置权重和随机噪声
      const positionWeight = Math.sin(i / dimension * Math.PI);
      const noise = (Math.random() - 0.5) * 0.1;
      
      embedding[i] = value * positionWeight + noise;
    }
    
    // 标准化向量
    return this.normalizeVector(embedding);
  }

  /**
   * 提取基础文本特征
   */
  private extractTextFeatures(text: string): number[] {
    const features: number[] = [];
    const normalizedText = text.toLowerCase();
    
    // 字符频率特征
    const charFreq: Record<string, number> = {};
    for (const char of normalizedText) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }
    
    // 转换为特征向量
    for (let i = 0; i < 256; i++) {
      const char = String.fromCharCode(i);
      features.push((charFreq[char] || 0) / text.length);
    }
    
    return features;
  }

  /**
   * 提取语义特征
   */
  private extractSemanticFeatures(text: string): number[] {
    const features: number[] = [];
    
    // 关键词权重映射
    const keywordWeights: Record<string, number> = {
      // 学术词汇
      '研究': 0.9, '分析': 0.8, '实验': 0.85, '理论': 0.8, '方法': 0.7,
      '结果': 0.75, '结论': 0.8, '数据': 0.7, '模型': 0.75, '算法': 0.8,
      
      // 专业术语
      '量子': 0.95, '分子': 0.9, '蛋白质': 0.9, '基因': 0.9, '细胞': 0.85,
      '物理': 0.8, '化学': 0.8, '生物': 0.8, '医学': 0.8, '工程': 0.75,
      
      // 动作词汇
      '增强': 0.6, '减少': 0.6, '提高': 0.65, '改善': 0.65, '优化': 0.7,
      '控制': 0.65, '调节': 0.6, '影响': 0.6, '促进': 0.6, '抑制': 0.6
    };
    
    // 计算语义权重
    for (let i = 0; i < 256; i++) {
      let semanticScore = 0;
      
      for (const [keyword, weight] of Object.entries(keywordWeights)) {
        if (text.includes(keyword)) {
          semanticScore += weight * Math.sin(i / 256 * Math.PI * 2);
        }
      }
      
      features.push(Math.tanh(semanticScore));
    }
    
    return features;
  }

  /**
   * 提取领域特征
   */
  private extractDomainFeatures(text: string): number[] {
    const features: number[] = [];
    
    const domainKeywords = {
      physics: ['量子', '粒子', '波长', '能量', '力学', '电磁', '热力学'],
      chemistry: ['分子', '原子', '化学', '反应', '催化', '有机', '无机'],
      biology: ['细胞', '基因', '蛋白质', 'DNA', 'RNA', '酶', '代谢'],
      medicine: ['患者', '治疗', '临床', '药物', '诊断', '疾病', '症状'],
      engineering: ['系统', '设计', '优化', '算法', '控制', '机械', '电子'],
      mathematics: ['数学', '函数', '微分', '积分', '矩阵', '向量', '概率']
    };
    
    for (let i = 0; i < 256; i++) {
      let domainScore = 0;
      
      Object.entries(domainKeywords).forEach(([domain, keywords], domainIndex) => {
        const domainWeight = keywords.filter(keyword => text.includes(keyword)).length;
        domainScore += domainWeight * Math.cos(i / 256 * Math.PI * (domainIndex + 1));
      });
      
      features.push(Math.tanh(domainScore));
    }
    
    return features;
  }

  /**
   * 提取统计特征
   */
  private extractStatisticalFeatures(text: string): number[] {
    const features: number[] = [];
    
    // 文本统计信息
    const textLength = text.length;
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[。！？.!?]/).length;
    const avgWordLength = textLength / wordCount;
    const avgSentenceLength = wordCount / sentenceCount;
    
    // 字符分布
    const chineseCharCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishCharCount = (text.match(/[a-zA-Z]/g) || []).length;
    const numberCount = (text.match(/\d/g) || []).length;
    const punctuationCount = (text.match(/[，。！？；：""''（）]/g) || []).length;
    
    // 生成统计特征向量
    for (let i = 0; i < 256; i++) {
      let statValue = 0;
      
      switch (i % 8) {
        case 0: statValue = textLength / 1000; break;
        case 1: statValue = wordCount / 100; break;
        case 2: statValue = avgWordLength / 10; break;
        case 3: statValue = avgSentenceLength / 20; break;
        case 4: statValue = chineseCharCount / textLength; break;
        case 5: statValue = englishCharCount / textLength; break;
        case 6: statValue = numberCount / textLength; break;
        case 7: statValue = punctuationCount / textLength; break;
      }
      
      features.push(Math.tanh(statValue));
    }
    
    return features;
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
   * 通用请求方法
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.createChatCompletion({
        model: 'deepseek-r1:8b',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      });
      
      return response.choices && response.choices.length > 0;
    } catch (error) {
      console.warn('DeepSeek API健康检查失败:', error);
      return false;
    }
  }
}

/**
 * 创建DeepSeek客户端实例
 */
export function createDeepSeekClient(apiKey: string, config?: Partial<DeepSeekConfig>): DeepSeekClient {
  return new DeepSeekClient({
    apiKey,
    ...config
  });
}

/**
 * 默认配置
 */
export const DEFAULT_DEEPSEEK_CONFIG = {
  baseURL: 'https://api.deepseek.com/v1',
  timeout: 30000,
  maxRetries: 3,
  model: 'deepseek-r1:8b'
} as const; 