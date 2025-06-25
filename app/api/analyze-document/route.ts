import { NextRequest, NextResponse } from 'next/server';
import { getDualDeepSeekClient } from '@/lib/deepseek/deepseek-dual-client';

// 从环境变量中获取API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

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

/**
 * 处理DeepSeek-R1模型的响应，提取JSON内容
 * DeepSeek-R1会返回包含<think>标签的推理过程，需要特殊处理
 */
function parseDeepSeekR1Response(response: string): { errors: any[] } {
  try {
    // 1. 首先尝试直接解析（如果没有think标签）
    const directParse = response.replace(/```json\n?|\n?```/g, '').trim();
    if (directParse.startsWith('{') && directParse.endsWith('}')) {
      return JSON.parse(directParse);
    }

    // 2. 处理包含<think>标签的响应
    // 移除<think>...</think>标签及其内容
    const cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // 3. 提取JSON部分 - 查找花括号包围的内容
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0].replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    }

    // 4. 如果还是找不到JSON，尝试查找errors数组
    const errorsMatch = cleanedResponse.match(/"errors"\s*:\s*\[[\s\S]*?\]/);
    if (errorsMatch) {
      const errorsStr = `{${errorsMatch[0]}}`;
      const parsed = JSON.parse(errorsStr);
      // 确保返回的是正确的格式
      return parsed;
    }

    // 5. 最后尝试从整个响应中提取任何有效的JSON片段
    const lines = cleanedResponse.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
        try {
          return JSON.parse(trimmedLine);
        } catch {
          continue;
        }
      }
    }

    throw new Error('无法从响应中提取有效的JSON数据');
  } catch (error) {
    console.error('DeepSeek-R1响应解析失败:', error);
    console.log('原始响应预览:', response.substring(0, 500) + '...');
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({
        errors: [{
          id: `empty_content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'error',
          position: { start: 0, end: 0 },
          original: '空文档',
          suggestion: '请提供需要校对的文档内容',
          reason: '文档内容为空',
          category: '内容完整性'
        }]
      });
    }

    // 优化的提示词 - 根据DeepSeek API文档要求，必须包含"json"字样和JSON格式样例
    const prompt = `请作为专业期刊编辑，对文档进行精确校对分析，并严格按照JSON格式返回结果。

**检查重点**：
- 重复词汇（如"研究研究"→"研究"）
- 重复标点（如"？。"→"？"）  
- 语法错误和用词不当
- 学术写作规范问题

**JSON输出格式示例**：
{
  "errors": [
    {
      "id": "error_1",
      "type": "error",
      "original": "确切错误文字",
      "suggestion": "修改建议", 
      "reason": "简短原因",
      "category": "错误类别"
    }
  ]
}

**错误类型说明**：
- error: 确定错误（重复词汇、语法错误）
- warning: 疑似错误（标点、表达）
- suggestion: 优化建议（长句、表达优化）

**待分析文档**：
${content}

请严格按照上述JSON格式返回分析结果，确保输出是有效的JSON字符串。`;

    // 使用双DeepSeek客户端
    const dualClient = getDualDeepSeekClient(); // 使用现有实例，保持配置中心设置
    
    console.log('🔍 调用DeepSeek API进行文档分析...');
    const response = await dualClient.createChatCompletion({
      messages: [
        {
          role: 'system',
          content: '你是专业期刊编辑。请严格按照JSON格式返回文档校对结果。输出必须是有效的JSON字符串，包含errors数组。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // 手动设置为0.3，降低随机性
      max_tokens: 32000, // 手动设置为32000，避免截断输出
      stream: false,
      response_format: { type: 'json_object' } // 根据DeepSeek API文档要求，启用JSON模式
    });

    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      console.log('⚠️ API返回空响应，使用本地分析');
      return NextResponse.json({
        errors: generateFallbackErrors(content)
      });
    }

    try {
      console.log('📝 AI响应长度:', aiResponse.length);
      console.log('🔍 响应预览:', aiResponse.substring(0, 200) + '...');
      
      // 使用专门的DeepSeek-R1响应解析函数
      const parsedResult = parseDeepSeekR1Response(aiResponse);
      
      // 验证返回的数据格式
      if (parsedResult.errors && Array.isArray(parsedResult.errors)) {
        // 为每个错误添加唯一ID和位置信息
        const errorsWithIds = parsedResult.errors.map((error: Partial<ErrorItem>, index: number) => {
          const position = calculateErrorPosition(content, error.original || '', index);
          
          return {
            id: error.id || `ai_error_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
            type: error.type || 'warning',
            position: error.position || position,
            original: error.original || '未知错误',
            suggestion: error.suggestion || '请检查此处',
            reason: error.reason || '需要进一步检查',
            category: error.category || '其他问题'
          };
        });

        console.log(`✅ 成功解析AI响应，发现 ${errorsWithIds.length} 个问题`);
        return NextResponse.json({
          errors: errorsWithIds,
          message: '文档分析完成'
        });
      } else {
        throw new Error('响应格式无效：缺少errors数组');
      }
    } catch (parseError) {
      console.error('❌ AI响应解析失败:', parseError);
      console.log('📄 完整AI响应:', aiResponse);
      
      // 使用本地分析作为备选
      console.log('🔄 切换到本地分析模式...');
      return NextResponse.json({
        errors: generateFallbackErrors(content),
        message: '使用本地分析完成文档校对'
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('💥 API调用失败:', errorMessage);
    
    // 根据错误类型提供详细日志
    if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
      console.log('⏰ DeepSeek API超时，使用本地分析');
    } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
      console.log('🔑 API密钥验证失败，使用本地分析');
    } else if (errorMessage.includes('429')) {
      console.log('⚡ API调用频率超限，使用本地分析');
    } else {
      console.log('🔧 API调用异常，使用本地分析');
    }
    
    // 获取请求内容用于备选数据生成
    let fallbackContent = '';
    try {
      const requestBody = await request.clone().json();
      fallbackContent = requestBody.content || '';
    } catch {
      fallbackContent = '';
    }
    
    console.log(`🔄 使用本地分析处理文档 (${fallbackContent.length} 字符)`);
    const fallbackErrors = generateFallbackErrors(fallbackContent);
    console.log(`✅ 本地分析完成，发现 ${fallbackErrors.length} 个问题`);
    
    return NextResponse.json({
      errors: fallbackErrors,
      message: '使用本地分析完成文档校对'
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
      id: `fallback_empty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        id: `fallback_duplicate_${match.index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      id: `fallback_punctuation_${match.index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        id: `fallback_common_${match.index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        id: `fallback_expression_${match.index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
          id: `fallback_long_sentence_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
      id: `fallback_general_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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