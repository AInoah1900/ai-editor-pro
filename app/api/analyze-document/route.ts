import { NextRequest, NextResponse } from 'next/server';

// 从环境变量中获取API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

// 验证必要的环境变量
if (!DEEPSEEK_API_KEY) {
  console.error('错误: DEEPSEEK_API_KEY 环境变量未设置');
}

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
    // 验证API密钥是否可用
    if (!DEEPSEEK_API_KEY) {
      console.error('DeepSeek API密钥未配置，使用备选数据');
      const { content } = await request.json();
      return NextResponse.json({
        errors: generateFallbackErrors(content || ''),
        message: 'API密钥未配置，使用本地分析'
      });
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: '文档内容不能为空' }, { status: 400 });
    }

    // 构建DeepSeek API请求
    const prompt = `
请作为一个专业的期刊编辑，对以下文档进行精确的校对和分析。

重要要求：
1. 只标注具体有问题的词汇或短语，不要标注整个句子
2. 对于重复词汇（如"研究研究"、"的的"），只标注重复的部分
3. 对于标点错误，只标注错误的标点符号
4. 确保original字段包含的是确切需要修改的文字

请检查以下方面的问题：
1. 重复词汇（如"研究研究"→"研究"、"的的"→"的"）
2. 重复标点符号（如"？。"→"？"）
3. 语法错误和用词不当
4. 学术写作规范问题

对于发现的每个问题，请按照以下JSON格式返回：
{
  "errors": [
    {
      "id": "唯一标识符",
      "type": "error|warning|suggestion",
      "original": "确切的错误文字（如'研究研究'）",
      "suggestion": "修改建议（如'研究'）",
      "reason": "错误原因说明",
      "category": "错误类别"
    }
  ]
}

错误类型说明：
- error: 确定的错误，必须修改（如重复词汇、明显语法错误）
- warning: 疑似错误，建议修改（如标点使用、表达方式）
- suggestion: 优化建议，可以改进（如长句分解、表达优化）

示例：
文本："基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述"
应该标注："研究研究" → "研究"，而不是整个句子

请分析以下文档：

${content}

请只返回JSON格式的结果，确保original字段精确匹配文档中的错误文字。
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
        // 为每个错误添加唯一ID和位置信息（如果没有的话）
        const errorsWithIds = parsedResult.errors.map((error: Partial<ErrorItem>, index: number) => {
          // 计算错误在文档中的位置
          const position = calculateErrorPosition(content, error.original || '', index);
          
          return {
            id: error.id || `ai_error_${Date.now()}_${index}`,
            type: error.type || 'warning',
            position: error.position || position,
            original: error.original || '未知错误',
            suggestion: error.suggestion || '请检查此处',
            reason: error.reason || '需要进一步检查',
            category: error.category || '其他问题'
          };
        });

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
    
    // 获取请求内容用于备选数据生成
    let fallbackContent = '';
    try {
      const requestBody = await request.clone().json();
      fallbackContent = requestBody.content || '';
    } catch {
      fallbackContent = '';
    }
    
    // 返回模拟数据作为备选
    return NextResponse.json({
      errors: generateFallbackErrors(fallbackContent)
    });
  }
}

// 计算错误在文档中的位置
function calculateErrorPosition(content: string, original: string, index: number): { start: number; end: number } {
  if (!original || !content) {
    return { start: index * 10, end: index * 10 + 5 };
  }

  // 尝试精确匹配错误文本
  const position = content.indexOf(original);
  if (position !== -1) {
    return {
      start: position,
      end: position + original.length
    };
  }

  // 如果找不到确切位置，尝试查找相似的错误模式
  const errorPatterns = [
    /(\S+)\1+/g, // 重复词汇模式，如"研究研究"、"的的"
    /[？。]{2,}/g, // 重复标点符号
    /\s{2,}/g, // 多余空格
  ];

  for (const pattern of errorPatterns) {
    const matches = Array.from(content.matchAll(pattern));
    for (const match of matches) {
      if (match[0] === original || match[0].includes(original)) {
        return {
          start: match.index!,
          end: match.index! + match[0].length
        };
      }
    }
  }

  // 如果还是找不到，返回估算位置
  const estimatedPosition = Math.min(index * 20, content.length - 10);
  return {
    start: estimatedPosition,
    end: Math.min(estimatedPosition + original.length, content.length)
  };
}

// 生成备选错误数据（当API调用失败时使用）
function generateFallbackErrors(content: string): ErrorItem[] {
  const errors: ErrorItem[] = [];
  
  if (!content || content.length === 0) {
    return [{
      id: 'fallback_empty',
      type: 'error',
      position: { start: 0, end: 0 },
      original: '空文档',
      suggestion: '请提供需要校对的文档内容',
      reason: '文档内容为空，无法进行校对分析',
      category: '内容完整性'
    }];
  }

  // 1. 检测重复词汇（精确定位）
  const duplicatePattern = /(\S+?)\1+/g;
  let match;
  while ((match = duplicatePattern.exec(content)) !== null && errors.length < 10) {
    const duplicateText = match[0];
    const singleText = match[1];
    
    // 跳过单字符重复（可能是正常的）
    if (singleText.length >= 2) {
      errors.push({
        id: `fallback_duplicate_${match.index}`,
        type: 'error',
        position: { start: match.index, end: match.index + duplicateText.length },
        original: duplicateText,
        suggestion: singleText,
        reason: `重复词汇"${singleText}"，建议删除多余部分`,
        category: '语法错误'
      });
    }
  }

  // 2. 检测重复标点符号
  const punctuationPattern = /([？。！，；：])\1+/g;
  while ((match = punctuationPattern.exec(content)) !== null && errors.length < 10) {
    const duplicatePunct = match[0];
    const singlePunct = match[1];
    
    errors.push({
      id: `fallback_punctuation_${match.index}`,
      type: 'warning',
      position: { start: match.index, end: match.index + duplicatePunct.length },
      original: duplicatePunct,
      suggestion: singlePunct,
      reason: `重复标点符号"${singlePunct}"，建议删除多余部分`,
      category: '标点错误'
    });
  }

  // 3. 检测常见错误词汇
  const commonErrors = [
    { pattern: /的的/g, suggestion: '的', reason: '重复使用"的"字' },
    { pattern: /了了/g, suggestion: '了', reason: '重复使用"了"字' },
    { pattern: /在在/g, suggestion: '在', reason: '重复使用"在"字' },
    { pattern: /是是/g, suggestion: '是', reason: '重复使用"是"字' },
    { pattern: /和和/g, suggestion: '和', reason: '重复使用"和"字' },
    { pattern: /或或/g, suggestion: '或', reason: '重复使用"或"字' },
  ];

  commonErrors.forEach(({ pattern, suggestion, reason }) => {
    while ((match = pattern.exec(content)) !== null && errors.length < 10) {
      errors.push({
        id: `fallback_common_${match.index}`,
        type: 'error',
        position: { start: match.index, end: match.index + match[0].length },
        original: match[0],
        suggestion: suggestion,
        reason: reason,
        category: '语法错误'
      });
    }
  });

  // 4. 检测可能的错误表达
  const expressionErrors = [
    { pattern: /错误问题/g, suggestion: '错误', reason: '"错误问题"表达重复，建议简化' },
    { pattern: /问题错误/g, suggestion: '问题', reason: '"问题错误"表达重复，建议简化' },
    { pattern: /毛病问题/g, suggestion: '问题', reason: '"毛病问题"表达不当，建议使用"问题"' },
  ];

  expressionErrors.forEach(({ pattern, suggestion, reason }) => {
    while ((match = pattern.exec(content)) !== null && errors.length < 10) {
      errors.push({
        id: `fallback_expression_${match.index}`,
        type: 'warning',
        position: { start: match.index, end: match.index + match[0].length },
        original: match[0],
        suggestion: suggestion,
        reason: reason,
        category: '表达优化'
      });
    }
  });

  // 5. 检测长句子（建议优化）
  const sentences = content.split(/[。！？]/);
  let currentPos = 0;
  
  sentences.forEach((sentence, index) => {
    if (sentence.length > 50 && errors.length < 10) {
      const sentenceStart = content.indexOf(sentence, currentPos);
      if (sentenceStart !== -1) {
        errors.push({
          id: `fallback_long_sentence_${index}`,
          type: 'suggestion',
          position: { start: sentenceStart, end: sentenceStart + sentence.length },
          original: sentence,
          suggestion: `${sentence.substring(0, 25)}...（建议分句）`,
          reason: '句子过长，建议分解为多个短句以提高可读性',
          category: '表达优化'
        });
      }
    }
    currentPos += sentence.length + 1; // +1 for the punctuation
  });

  // 如果没有找到任何错误，添加一个示例
  if (errors.length === 0) {
    const sampleText = content.substring(0, Math.min(20, content.length));
    errors.push({
      id: 'fallback_general',
      type: 'suggestion',
      position: { start: 0, end: sampleText.length },
      original: sampleText,
      suggestion: '建议检查文档的整体结构和逻辑',
      reason: '文档整体质量良好，建议进行细节优化',
      category: '整体优化'
    });
  }

  return errors;
} 