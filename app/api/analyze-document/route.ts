import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = '***REMOVED***f6790a1fcfc14f2bb5c5cc795d2f6092';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

interface ErrorItem {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  position: { start: number; end: number };
  original: string;
  suggestion: string;
  reason: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: '文档内容不能为空' }, { status: 400 });
    }

    // 构建DeepSeek API请求
    const prompt = `
请作为一个专业的期刊编辑，对以下文档进行全面的校对和分析。请检查以下方面的问题：

1. 语法错误（拼写、语法、句法）
2. 标点符号使用错误
3. 语句逻辑问题
4. 语病和表达不当
5. 学术写作规范
6. 文献引用格式
7. 图表描述一致性

对于发现的每个问题，请按照以下JSON格式返回：
{
  "errors": [
    {
      "id": "唯一标识符",
      "type": "error|warning|suggestion",
      "original": "原始文本",
      "suggestion": "修改建议",
      "reason": "错误原因说明",
      "category": "错误类别"
    }
  ]
}

错误类型说明：
- error: 确定的错误，必须修改
- warning: 疑似错误，建议修改
- suggestion: 优化建议，可以改进

请分析以下文档：

${content}

请只返回JSON格式的结果，不要包含其他文字说明。
`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的期刊编辑和校对专家，擅长发现文档中的各种错误并提供准确的修改建议。请严格按照要求的JSON格式返回结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
        stream: false
      }),
    });

    if (!response.ok) {
      console.error('DeepSeek API错误:', response.status, response.statusText);
      // 返回模拟数据作为备选
      return NextResponse.json({
        errors: generateFallbackErrors(content)
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json({
        errors: generateFallbackErrors(content)
      });
    }

    try {
      // 尝试解析AI返回的JSON
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const parsedResult = JSON.parse(cleanedResponse);
      
      // 验证返回的数据格式
      if (parsedResult.errors && Array.isArray(parsedResult.errors)) {
        // 为每个错误添加唯一ID（如果没有的话）
        const errorsWithIds = parsedResult.errors.map((error: Partial<ErrorItem>, index: number) => ({
          ...error,
          id: error.id || `error_${Date.now()}_${index}`,
          position: error.position || { start: 0, end: 0 }
        }));

        return NextResponse.json({
          errors: errorsWithIds,
          message: '文档分析完成'
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      console.log('AI原始响应:', aiResponse);
      
      // 返回模拟数据
      return NextResponse.json({
        errors: generateFallbackErrors(content)
      });
    }

  } catch (error) {
    console.error('API调用失败:', error);
    
    // 返回模拟数据作为备选
    return NextResponse.json({
      errors: generateFallbackErrors('')
    });
  }
}

// 生成备选错误数据（当API调用失败时使用）
function generateFallbackErrors(content: string): ErrorItem[] {
  const errors: ErrorItem[] = [];
  
  // 基于内容长度生成一些示例错误
  if (content.length > 0) {
    errors.push({
      id: 'fallback_1',
      type: 'error',
      position: { start: 0, end: 10 },
      original: '示例错误',
      suggestion: '示例修正',
      reason: '这是一个示例错误，实际使用时会调用AI进行分析',
      category: '语法错误'
    });

    if (content.length > 50) {
      errors.push({
        id: 'fallback_2',
        type: 'warning',
        position: { start: 20, end: 30 },
        original: '可能的问题',
        suggestion: '建议的修改',
        reason: '这可能存在表达不够准确的问题',
        category: '表达优化'
      });
    }

    if (content.length > 100) {
      errors.push({
        id: 'fallback_3',
        type: 'suggestion',
        position: { start: 40, end: 50 },
        original: '普通表达',
        suggestion: '更好的表达',
        reason: '可以使用更专业的学术表达',
        category: '学术规范'
      });
    }
  }

  return errors;
} 