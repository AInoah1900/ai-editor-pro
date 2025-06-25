/**
 * DeepSeek双API客户端
 * 严格按照配置中心设置调用对应API，不进行智能切换
 */

import { DeepSeekConfigManager, DeepSeekProvider } from './deepseek-config';

// 在Node.js环境中使用undici处理长时间HTTP请求
let undiciRequest: ((url: string, options?: any) => Promise<any>) | null = null;
try {
  if (typeof global !== 'undefined') {
    undiciRequest = require('undici').request;
  }
} catch {
  console.log('📝 undici不可用，使用标准fetch');
}

// 扩展ChatCompletionRequest接口以支持response_format
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: { type: 'json_object' };
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model?: string;
  provider?: DeepSeekProvider;
}



/**
 * 双DeepSeek API客户端 - 严格按配置调用
 */
export class DualDeepSeekClient {
  private configManager: DeepSeekConfigManager;

  constructor() {
    this.configManager = DeepSeekConfigManager.getInstance();
  }

  /**
   * 创建聊天完成 - 严格按照配置中心设置调用
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const provider = this.configManager.getProvider();
    
    console.log(`🎯 使用配置的提供商: ${provider === 'cloud' ? '云端API' : '本地API'}`);
    
    try {
      if (provider === 'cloud') {
        return await this.createCloudChatCompletion(request);
      } else {
        return await this.createLocalChatCompletion(request);
      }
    } catch (error) {
      console.error(`${provider === 'cloud' ? '云端' : '本地'}API调用失败:`, error);
      
      // 直接抛出错误，不进行切换
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`${provider === 'cloud' ? '云端' : '本地'}API调用失败: ${errorMessage}`);
    }
  }

  /**
   * 云端API调用
   */
  private async createCloudChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const activeConfig = this.configManager.getActiveConfig();
    
    if (!activeConfig.apiKey) {
      throw new Error('云端API密钥未配置，请在配置中心或.env.local文件中设置DEEPSEEK_API_KEY');
    }

    const url = activeConfig.baseURL.endsWith('/v1') 
      ? `${activeConfig.baseURL}/chat/completions`
      : `${activeConfig.baseURL}/v1/chat/completions`;
    
    const requestBody = {
      model: request.model || activeConfig.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.max_tokens ?? 32000,
      stream: request.stream ?? false,
      ...(request.response_format && { response_format: request.response_format })
    };

    console.log('🌐 调用云端DeepSeek API...');
    console.log(`📍 API地址: ${url}`);
    console.log(`🤖 使用模型: ${requestBody.model}`);
    
    const response = await this.makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeConfig.apiKey}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`云端API错误: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    result.provider = 'cloud';
    console.log('✅ 云端API调用成功');
    
    return result;
  }

  /**
   * 本地API调用
   */
  private async createLocalChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const activeConfig = this.configManager.getActiveConfig();
    
    // 检查本地API是否可用
    const isAvailable = await this.configManager.isLocalAPIAvailable();
    if (!isAvailable) {
      throw new Error('本地API不可用，请检查本地服务状态或配置');
    }
    
    const url = activeConfig.baseURL.endsWith('/v1') 
      ? `${activeConfig.baseURL}/chat/completions`
      : `${activeConfig.baseURL}/v1/chat/completions`;
    
    const requestBody = {
      model: request.model || activeConfig.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.max_tokens ?? 32000,
      stream: request.stream ?? false
    };

    console.log(`🏠 调用本地API聊天接口...`);
    console.log(`📍 API地址: ${url}`);
    console.log(`🤖 使用模型: ${requestBody.model}`);
    console.log(`📝 消息数量: ${requestBody.messages.length}`);
    console.log(`⏳ 本地API调用，不设置超时限制，等待完成...`);
    
    const response = await this.makeLocalRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ollama'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // 如果是404错误，可能是模型名称问题
      if (response.status === 404 || errorText.includes('model') || errorText.includes('not found')) {
        const availableModels = await this.configManager.getAvailableLocalModels();
        
        if (availableModels.length > 0) {
          throw new Error(`本地模型 "${requestBody.model}" 不存在。可用模型: ${availableModels.join(', ')}`);
        } else {
          throw new Error('本地API没有可用的模型，请检查本地服务配置');
        }
      }
      
      throw new Error(`本地API错误: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    result.provider = 'local';
    console.log(`✅ 本地API调用成功`);
    
    return result;
  }

  /**
   * 切换提供商 - 由配置中心调用
   */
  async switchProvider(provider: DeepSeekProvider): Promise<boolean> {
    try {
      // 测试提供商连接
      await this.testProviderConnection(provider);
      
      // 更新配置
      this.configManager.setProvider(provider);
      
      console.log(`✅ 成功切换到${provider === 'cloud' ? '云端' : '本地'}API`);
      return true;
    } catch (error) {
      console.error(`切换到${provider === 'cloud' ? '云端' : '本地'}API失败:`, error);
      throw error;
    }
  }

  /**
   * 获取当前提供商
   */
  getCurrentProvider(): DeepSeekProvider {
    return this.configManager.getProvider();
  }

  /**
   * 测试提供商连接 - 优化版本，减少日志输出
   */
  async testProviderConnection(provider: DeepSeekProvider): Promise<void> {
    const testMessage = {
      role: 'user' as const,
      content: '测试连接'
    };

    const testRequest: ChatCompletionRequest = {
      messages: [testMessage],
      max_tokens: 10,
      temperature: 0.1
    };

    // 临时切换提供商进行测试（不输出切换日志）
    const originalProvider = this.configManager.getProvider();
    const originalConsoleLog = console.log;
    
    // 临时禁用切换日志
    console.log = (...args: any[]) => {
      const message = args[0];
      if (typeof message === 'string' && message.includes('DeepSeek API提供商设置为')) {
        return; // 跳过提供商切换日志
      }
      originalConsoleLog.apply(console, args);
    };
    
    this.configManager.setProvider(provider);
    
    try {
      console.log = originalConsoleLog; // 恢复日志功能
      console.log(`🔗 测试${provider === 'cloud' ? '云端' : '本地'}API连接...`);
      
      if (provider === 'cloud') {
        await this.createCloudChatCompletion(testRequest);
      } else {
        await this.createLocalChatCompletion(testRequest);
      }
      console.log(`✅ ${provider === 'cloud' ? '云端' : '本地'}API连接测试成功`);
    } catch (error) {
      console.log = originalConsoleLog; // 确保恢复日志功能
      throw new Error(`${provider === 'cloud' ? '云端' : '本地'}API连接测试失败: ${error instanceof Error ? error.message : error}`);
    } finally {
      // 恢复原始提供商设置（不输出切换日志）
      console.log = (...args: any[]) => {
        const message = args[0];
        if (typeof message === 'string' && message.includes('DeepSeek API提供商设置为')) {
          return; // 跳过提供商切换日志
        }
        originalConsoleLog.apply(console, args);
      };
      
      this.configManager.setProvider(originalProvider);
      console.log = originalConsoleLog; // 最终恢复日志功能
    }
  }

  /**
   * 健康检查 - 只检查当前选择的API提供商
   */
  async healthCheck(): Promise<{
    cloud: { available: boolean; error?: string };
    local: { available: boolean; error?: string };
    current: DeepSeekProvider;
  }> {
    const currentProvider = this.configManager.getProvider();
    const results = {
      cloud: { available: false, error: undefined as string | undefined },
      local: { available: false, error: undefined as string | undefined },
      current: currentProvider
    };

    console.log(`🔍 健康检查 - 仅检查当前API提供商: ${currentProvider === 'cloud' ? '云端API' : '本地API'}`);

    // 只检查当前选择的API提供商
    if (currentProvider === 'cloud') {
      try {
        if (this.configManager.isCloudAPIConfigured()) {
          await this.testProviderConnection('cloud');
          results.cloud.available = true;
          console.log('✅ 云端API健康检查通过');
        } else {
          results.cloud.error = '云端API未配置';
          console.log('❌ 云端API未配置');
        }
      } catch (error) {
        results.cloud.error = error instanceof Error ? error.message : String(error);
        console.log('❌ 云端API健康检查失败:', results.cloud.error);
      }
      
      // 本地API标记为未检查
      results.local.error = '当前使用云端API，未检查本地API状态';
    } else {
      try {
        if (this.configManager.isLocalAPIConfigured()) {
          const isAvailable = await this.configManager.isLocalAPIAvailable();
          if (isAvailable) {
            await this.testProviderConnection('local');
            results.local.available = true;
            console.log('✅ 本地API健康检查通过');
          } else {
            results.local.error = '本地API服务不可用';
            console.log('❌ 本地API服务不可用');
          }
        } else {
          results.local.error = '本地API未配置';
          console.log('❌ 本地API未配置');
        }
      } catch (error) {
        results.local.error = error instanceof Error ? error.message : String(error);
        console.log('❌ 本地API健康检查失败:', results.local.error);
      }
      
      // 云端API标记为未检查
      results.cloud.error = '当前使用本地API，未检查云端API状态';
    }

    return results;
  }

  /**
   * 获取状态报告
   */
  async getStatusReport(): Promise<{
    currentProvider: DeepSeekProvider;
    cloudStatus: { available: boolean; configured: boolean };
    localStatus: { available: boolean; configured: boolean };
    recommendations: string[];
  }> {
    return await this.configManager.getStatusReport();
  }

  /**
   * 创建嵌入向量
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
   * 生成高级嵌入向量 (4096维)
   */
  private generateAdvancedEmbedding(text: string): number[] {
    const vector = new Array(4096).fill(0);
    
    // 提取不同类型的特征
    const textFeatures = this.extractTextFeatures(text);
    const semanticFeatures = this.extractSemanticFeatures(text);
    const domainFeatures = this.extractDomainFeatures(text);
    const statisticalFeatures = this.extractStatisticalFeatures(text);
    
    // 分配特征到不同的维度段
    // 词汇特征：0-1023维 (4段，每段256维)
    for (let i = 0; i < 4; i++) {
      const start = i * 256;
      for (let j = 0; j < 256; j++) {
        vector[start + j] = textFeatures[j % textFeatures.length] || 0;
      }
    }
    
    // 语义特征：1024-2047维 (4段，每段256维)
    for (let i = 0; i < 4; i++) {
      const start = 1024 + i * 256;
      for (let j = 0; j < 256; j++) {
        vector[start + j] = semanticFeatures[j % semanticFeatures.length] || 0;
      }
    }
    
    // 句法特征：2048-3071维 (4段，每段256维)
    for (let i = 0; i < 4; i++) {
      const start = 2048 + i * 256;
      for (let j = 0; j < 256; j++) {
        vector[start + j] = domainFeatures[j % domainFeatures.length] || 0;
      }
    }
    
    // 领域特征：3072-4095维 (4段，每段256维)
    for (let i = 0; i < 4; i++) {
      const start = 3072 + i * 256;
      for (let j = 0; j < 256; j++) {
        vector[start + j] = statisticalFeatures[j % statisticalFeatures.length] || 0;
      }
    }
    
    return this.normalizeVector(vector);
  }

  private extractTextFeatures(text: string): number[] {
    const features: number[] = [];
    const normalizedText = text.toLowerCase();
    
    const charFreq: Record<string, number> = {};
    for (const char of normalizedText) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }
    
    for (let i = 0; i < 256; i++) {
      const char = String.fromCharCode(i);
      features.push((charFreq[char] || 0) / text.length);
    }
    
    return features;
  }

  private extractSemanticFeatures(text: string): number[] {
    const features: number[] = [];
    
    const keywordWeights: Record<string, number> = {
      '研究': 0.9, '分析': 0.8, '实验': 0.85, '理论': 0.8, '方法': 0.7,
      '结果': 0.75, '结论': 0.8, '数据': 0.7, '模型': 0.75, '算法': 0.8,
      '量子': 0.95, '分子': 0.9, '蛋白质': 0.9, '基因': 0.9, '细胞': 0.85,
      '物理': 0.8, '化学': 0.8, '生物': 0.8, '医学': 0.8, '工程': 0.75,
      '增强': 0.6, '减少': 0.6, '提高': 0.65, '改善': 0.65, '优化': 0.7,
      '控制': 0.65, '调节': 0.6, '影响': 0.6, '促进': 0.6, '抑制': 0.6
    };
    
    for (let i = 0; i < 256; i++) {
      let semanticScore = 0;
      for (const [keyword, weight] of Object.entries(keywordWeights)) {
        if (text.includes(keyword)) {
          semanticScore += weight * (text.split(keyword).length - 1) / text.length;
        }
      }
      features.push(Math.tanh(semanticScore + Math.sin(i * 0.1)));
    }
    
    return features;
  }

  private extractDomainFeatures(text: string): number[] {
    const features: number[] = [];
    
    const domainPatterns = {
      academic: /学术|研究|论文|期刊|会议|引用/g,
      medical: /医学|疾病|治疗|药物|临床|病理/g,
      technical: /技术|工程|算法|系统|架构|开发/g,
      legal: /法律|条例|规定|合同|协议|法规/g,
      business: /商业|市场|销售|管理|策略|客户/g,
      science: /科学|实验|数据|假设|验证|观察/g
    };
    
    for (let i = 0; i < 256; i++) {
      let domainScore = 0;
      for (const pattern of Object.values(domainPatterns)) {
        const matches = text.match(pattern);
        if (matches) {
          domainScore += matches.length / text.length;
        }
      }
      features.push(domainScore + Math.cos(i * 0.05));
    }
    
    return features;
  }

  private extractStatisticalFeatures(text: string): number[] {
    const features: number[] = [];
    
    const length = text.length;
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[。！？.!?]/).length;
    const avgWordLength = words > 0 ? length / words : 0;
    const avgSentenceLength = sentences > 0 ? words / sentences : 0;
    
    for (let i = 0; i < 256; i++) {
      let feature = 0;
      switch (i % 5) {
        case 0:
          feature = length / 1000;
          break;
        case 1:
          feature = words / 100;
          break;
        case 2:
          feature = sentences / 10;
          break;
        case 3:
          feature = avgWordLength / 10;
          break;
        case 4:
          feature = avgSentenceLength / 20;
          break;
      }
      features.push(Math.tanh(feature + Math.random() * 0.1));
    }
    
    return features;
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * 发起本地API请求 - 使用undici处理长时间请求
   */
  private async makeLocalRequest(url: string, options: RequestInit): Promise<Response> {
    console.log(`🔄 发起本地API请求，使用增强的超时处理...`);

    try {
      // 如果在Node.js环境且undici可用，使用undici处理长时间请求
      if (undiciRequest && typeof global !== 'undefined') {
        console.log('🚀 使用undici发起请求（支持长时间连接）');
        
        return await this.makeUndiciRequest(url, options);
      } else {
        // 回退使用标准fetch，但设置更长的超时
        console.log('📡 使用标准fetch发起请求');
        
        return await this.makeStandardFetchRequest(url, options);
      }
    } catch (error) {
      console.error('❌ 本地API请求失败:', error);
      
      // 检查是否是超时错误
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('本地API请求被取消（可能是由于响应时间过长）');
        } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          throw new Error('本地API连接超时，请检查Ollama服务是否正常运行');
        } else if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
          throw new Error('无法连接到本地API，请确保Ollama服务在http://localhost:11434运行');
        } else if (error.message.includes('HeadersTimeoutError') || error.message.includes('UND_ERR_HEADERS_TIMEOUT')) {
          throw new Error('本地API响应头超时，这通常表示模型正在加载或处理复杂请求。建议等待片刻后重试，或检查Ollama服务状态');
        }
      }
      
      throw error;
    }
  }
  
  /**
   * 使用undici发起请求（支持长时间连接）
   */
  private async makeUndiciRequest(url: string, options: RequestInit): Promise<Response> {
    try {
      const undiciOptions = {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body,
        // 设置较长的超时时间
        headersTimeout: 10 * 60 * 1000, // 10分钟
        bodyTimeout: 15 * 60 * 1000,    // 15分钟
        connect: {
          timeout: 30000, // 30秒连接超时
        }
      };
      
      const response = undiciRequest ? await undiciRequest(url, undiciOptions) : null;
      
      if (!response) {
        throw new Error('undici请求失败');
      }
      
      // 转换undici响应为标准Response格式
      const headers = new Headers();
      for (const [key, value] of Object.entries(response.headers)) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
      }
      
      // 读取响应体
      const chunks: Buffer[] = [];
      for await (const chunk of response.body) {
        chunks.push(chunk);
      }
      const body = Buffer.concat(chunks);
      
      const standardResponse = new Response(body, {
        status: response.statusCode,
        statusText: response.statusMessage || 'OK',
        headers: headers
      });
      
      console.log('✅ undici请求成功完成');
      return standardResponse;
      
    } catch (error) {
      console.error('❌ undici请求失败:', error);
      throw error;
    }
  }
  
  /**
   * 使用标准fetch发起请求（带增强超时处理）
   */
  private async makeStandardFetchRequest(url: string, options: RequestInit): Promise<Response> {
    // 创建一个AbortController，但不设置自动超时
    const controller = new AbortController();
    
    // 为Node.js fetch设置更长的超时时间（10分钟）
    const timeoutId = setTimeout(() => {
      console.log('⏰ 本地API请求超过10分钟，主动取消...');
      controller.abort();
    }, 10 * 60 * 1000); // 10分钟超时
    
    try {
      const requestOptions: RequestInit = {
        ...options,
        signal: controller.signal,
      };
      
      const response = await fetch(url, requestOptions);
      
      // 清除超时定时器
      clearTimeout(timeoutId);
      console.log('✅ 标准fetch请求成功完成');
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 发起HTTP请求
   */
  private async makeRequest(url: string, options: RequestInit): Promise<Response> {
    const timeout = this.configManager.getTimeout();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    console.log(`🔄 发起请求 (超时: ${timeout/1000}秒)`);

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
}

/**
 * 创建双DeepSeek客户端实例
 */
export function createDualDeepSeekClient(): DualDeepSeekClient {
  return new DualDeepSeekClient();
}

/**
 * 全局客户端实例
 */
let globalClient: DualDeepSeekClient | null = null;

/**
 * 获取全局客户端实例
 * 支持强制刷新配置
 */
export function getDualDeepSeekClient(forceRefresh: boolean = false): DualDeepSeekClient {
  if (!globalClient || forceRefresh) {
    globalClient = new DualDeepSeekClient();
  }
  return globalClient;
}

/**
 * 清除全局客户端缓存
 * 在配置更新后调用，确保使用新配置
 */
export function clearDualDeepSeekClient(): void {
  globalClient = null;
} 