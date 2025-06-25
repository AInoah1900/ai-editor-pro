/**
 * 本地API嵌入向量客户端
 * 使用Ollama本地API服务生成嵌入向量
 */
export class LocalApiEmbeddingClient {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(
    baseUrl: string = 'http://localhost:11434',
    model: string = 'deepseek-r1:8b',
    timeout: number = 30000
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.timeout = timeout;
  }

  /**
   * 生成单个文本的嵌入向量
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 检查空文本
      if (!text || text.trim() === '') {
        console.log('⚠️  检测到空文本，跳过本地API调用');
        throw new Error('空文本无法生成嵌入向量');
      }
      
      console.log(`🔗 调用本地API生成嵌入向量: ${text.substring(0, 50)}...`);
      
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: text.slice(0, 2000), // 限制文本长度避免超时
        }),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('API返回数据格式错误：缺少embedding字段');
      }

      const embedding = data.embedding;
      console.log(`✅ 本地API嵌入向量生成成功: ${embedding.length}维`);
      
      return embedding;
    } catch (error: unknown) {
      console.error('本地API嵌入向量生成失败:', error);
      throw error;
    }
  }

  /**
   * 批量生成多个文本的嵌入向量
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    console.log(`🔗 批量生成 ${texts.length} 个嵌入向量`);
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const embedding = await this.generateEmbedding(texts[i]);
        embeddings.push(embedding);
        
        // 添加延迟避免API过载
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error: unknown) {
        console.error(`文本 ${i + 1} 嵌入向量生成失败:`, error);
        throw error;
      }
    }
    
    console.log(`✅ 批量嵌入向量生成完成: ${embeddings.length} 个向量`);
    return embeddings;
  }

  /**
   * 检查本地API服务状态
   */
  async checkApiStatus(): Promise<boolean> {
    try {
      console.log('🔍 检查本地API服务状态...');
      
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ 本地API服务正常: Ollama版本: ${data.version || 'unknown version'}`);
        return true;
      } else {
        console.log(`❌ 本地API服务异常: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error: unknown) {
      console.log(`❌ 本地API服务不可用:`, error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
      return false;
    }
  }

  /**
   * 检查指定模型是否可用
   */
  async checkModelAvailability(): Promise<boolean> {
    try {
      console.log(`🔍 检查模型 ${this.model} 可用性...`);
      
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        console.log(`❌ 无法获取模型列表: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      const models = data.models || [];
      
      const modelExists = models.some((model: { name: string }) => 
        model.name === this.model || model.name.startsWith(this.model)
      );

      if (modelExists) {
        console.log(`✅ 模型 ${this.model} 可用`);
        return true;
      } else {
        console.log(`❌ 模型 ${this.model} 不可用`);
        console.log(`可用模型: ${models.map((m: { name: string }) => m.name).join(', ')}`);
        return false;
      }
    } catch (error: unknown) {
      console.log(`❌ 检查模型可用性失败:`, error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error));
      return false;
    }
  }

  /**
   * 获取API配置信息
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      model: this.model,
      timeout: this.timeout,
    };
  }
}
