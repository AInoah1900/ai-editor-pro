/**
 * 本地API聊天客户端 (兼容OpenAI格式)
 * 使用Ollama的 /v1/chat/completions 接口
 */

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
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 本地API聊天客户端类
 */
export class LocalChatClient {
  private baseURL: string;
  private defaultModel: string;

  constructor(baseURL: string = 'http://localhost:11434', defaultModel: string = 'deepseek-r1:8b') {
    this.baseURL = baseURL;
    this.defaultModel = defaultModel;
  }

  /**
   * 创建聊天完成 - 使用OpenAI兼容接口
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const url = `${this.baseURL}/v1/chat/completions`;
    
    const requestBody = {
      model: request.model || this.defaultModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.3,
      max_tokens: request.max_tokens ?? 4000,
      stream: request.stream ?? false
    };

    console.log(`🏠 调用本地API聊天接口 (模型: ${requestBody.model})...`);
    console.log(`📍 API地址: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ollama'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`本地API错误: ${response.status} - ${errorText}`);
      }

      const result: ChatCompletionResponse = await response.json();
      console.log('✅ 本地API聊天调用成功');
      
      return result;
    } catch (error) {
      console.error('❌ 本地API调用异常:', error);
      throw error;
    }
  }

  /**
   * 学术编辑专用方法
   */
  async editAcademicText(text: string): Promise<string> {
    const request: ChatCompletionRequest = {
      model: this.defaultModel,
      messages: [
        {
          role: 'system',
          content: `你是一名专业的学术编辑，负责优化科研论文。请严格按以下要求操作：
1. 修正语法/拼写错误
2. 提升句式严谨性
3. 保持学术风格
4. 保留专业术语
5. 不改变数据/结论`
        },
        {
          role: 'user',
          content: `请编辑以下论文段落：${text}`
        }
      ],
      temperature: 0.3,
      max_tokens: 8000,
      stream: false
    };

    const response = await this.createChatCompletion(request);
    return response.choices[0]?.message?.content || text;
  }

  /**
   * 检查API状态
   */
  async checkStatus(): Promise<{ available: boolean; error?: string }> {
    try {
      await this.createChatCompletion({
        model: this.defaultModel,
        messages: [{ role: 'user', content: '测试' }],
        max_tokens: 10,
        temperature: 0.1
      });

      return { available: true };
    } catch (error) {
      return {
        available: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

export function createLocalChatClient(): LocalChatClient {
  return new LocalChatClient();
}
