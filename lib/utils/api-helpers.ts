/**
 * API帮助工具
 * 提供安全的fetch和JSON解析，避免"Unexpected token '<'"错误
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 安全的API调用工具
 */
export async function safeApiCall<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API错误 ${response.status}: ${response.statusText}`, errorText);
      
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    // 检查响应类型
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('API返回非JSON响应:', responseText.substring(0, 200));
      
      return {
        success: false,
        error: '服务器返回了非JSON响应，可能是错误页面',
      };
    }

    // 安全解析JSON
    try {
      const data = await response.json();
      return data;
    } catch (jsonError) {
      const responseText = await response.text();
      console.error('JSON解析失败:', jsonError);
      console.error('响应内容:', responseText.substring(0, 200));
      
      return {
        success: false,
        error: 'JSON解析失败，响应格式无效',
      };
    }

  } catch (networkError) {
    console.error('网络请求失败:', networkError);
    
    return {
      success: false,
      error: `网络请求失败: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
    };
  }
}

/**
 * 用于文档分析的API调用
 */
export async function analyzeDocument(content: string, useRAG: boolean = false) {
  const endpoint = useRAG ? '/api/analyze-document-rag' : '/api/analyze-document';
  
  return safeApiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

/**
 * 用于知识库操作的API调用
 */
export async function knowledgeBaseAPI(action: string, data?: any) {
  const method = action === 'get' ? 'GET' : 'POST';
  const body = action === 'get' ? undefined : JSON.stringify(data);
  
  return safeApiCall('/api/knowledge-base', {
    method,
    body,
  });
}

/**
 * 用于用户反馈学习的API调用
 */
export async function submitFeedback(feedback: {
  original: string;
  suggestion: string;
  feedback: 'accept' | 'reject' | 'modify';
  domain: string;
  finalVersion?: string;
}) {
  return safeApiCall('/api/knowledge-base', {
    method: 'PUT',
    body: JSON.stringify(feedback),
  });
}

/**
 * 错误信息美化工具
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (error && typeof error === 'object') {
    return error.message || error.error || JSON.stringify(error);
  }
  
  return '未知错误';
}

/**
 * 检查响应是否为HTML错误页面
 */
export function isHtmlResponse(text: string): boolean {
  return text.trim().startsWith('<!DOCTYPE') || 
         text.trim().startsWith('<html') ||
         text.includes('<title>') ||
         text.includes('<body>');
}

/**
 * 从HTML错误页面提取有用信息
 */
export function extractErrorFromHtml(html: string): string {
  // 尝试提取错误标题
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch) {
    return titleMatch[1];
  }
  
  // 尝试提取错误信息
  const errorMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (errorMatch) {
    return errorMatch[1];
  }
  
  return '服务器返回了错误页面';
} 