import { NextRequest, NextResponse } from 'next/server';
import { getDualDeepSeekClient } from '@/lib/deepseek/deepseek-dual-client';
import { NewKnowledgeRetriever, DomainClassifier } from '@/lib/rag/new-knowledge-retriever';

// 从环境变量中获取API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * 处理DeepSeek-R1模型的响应，提取JSON内容
 * DeepSeek-R1会返回包含<think>标签的推理过程，需要特殊处理
 */
function parseDeepSeekR1Response(response: string): { errors: any[] } {
  try {
    // 1. 首先尝试直接解析（如果没有think标签）
    let directParse = response.replace(/```json\n?|\n?```/g, '').trim();
    if (directParse.startsWith('{') && directParse.endsWith('}')) {
      return JSON.parse(directParse);
    }

    // 2. 处理包含<think>标签的响应
    // 移除<think>...</think>标签及其内容
    const cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // 3. 提取JSON部分 - 查找花括号包围的内容
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      let jsonStr = jsonMatch[0].replace(/```json\n?|\n?```/g, '').trim();
      
      // 修复常见的JSON格式错误
      jsonStr = fixCommonJsonErrors(jsonStr);
      
      return JSON.parse(jsonStr);
    }

    // 4. 如果还是找不到JSON，尝试查找errors数组
    const errorsMatch = cleanedResponse.match(/"errors"\s*:\s*\[[\s\S]*?\]/);
    if (errorsMatch) {
      const errorsStr = `{${errorsMatch[0]}}`;
      const parsed = JSON.parse(errorsStr);
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

/**
 * 修复常见的JSON格式错误
 */
function fixCommonJsonErrors(jsonStr: string): string {
  console.log('🔧 开始JSON修复，原始长度:', jsonStr.length);
  console.log('🔍 检查开头字符:', jsonStr.slice(0, 5)); // 显示前5个字符
  console.log('🔍 检查结尾字符:', jsonStr.slice(-5)); // 显示最后5个字符
  
  // 核心修复：处理DeepSeek-R1模型的特定错误
  // 错误模式：错误的JSON对象后面以"]"结尾，而不是"}"结尾
  if (jsonStr.startsWith('{') && jsonStr.endsWith(']')) {
    console.log('🔧 检测到DeepSeek-R1特定错误：JSON对象以"]"结尾，应该是"}"');
    
    // 检查倒数第二个字符，如果是数组结尾符号"]"，说明errors数组是完整的
    // 错误格式: { "errors": [...] ]
    // 正确格式: { "errors": [...] }
    
    // 找到最后一个errors数组的结尾位置
    const lastArrayEndIndex = jsonStr.lastIndexOf(']', jsonStr.length - 2);
    
    if (lastArrayEndIndex > 0) {
      // 在最后一个数组结尾后添加"}"，移除错误的"]"
      jsonStr = jsonStr.slice(0, lastArrayEndIndex + 1) + '}';
      console.log('🔧 修复完成：将错误的结尾"]"替换为正确的"}"');
    } else {
      // 如果找不到数组结尾，简单地将最后的"]"替换为"}"
      jsonStr = jsonStr.slice(0, -1) + '}';
      console.log('🔧 修复完成：直接将结尾"]"替换为"}"');
    }
  }
  
  // 1. 修复多余的结尾方括号 - 处理 "}]" 结尾
  if (jsonStr.endsWith('}]')) {
    console.log('🔧 检测到"}]"结尾，修复为"}"...');
    jsonStr = jsonStr.slice(0, -1); // 移除最后的 ']'
  }
  
  // 2. 修复多余的开头方括号
  if (jsonStr.startsWith('[{')) {
    console.log('🔧 检测到多余的开头方括号，正在修复...');
    jsonStr = jsonStr.slice(1); // 移除开头的 '['
  }
  
  // 3. 修复错误的数组结尾 - 检查 "errors": [...]] 这种情况
  jsonStr = jsonStr.replace(/(\]\s*)\]\s*}/, '$1}');
  
  // 4. 修复缺失的花括号结尾
  if (jsonStr.startsWith('{') && !jsonStr.endsWith('}')) {
    // 检查是否只是缺少最后的花括号
    const openBraces = (jsonStr.match(/\{/g) || []).length;
    const closeBraces = (jsonStr.match(/\}/g) || []).length;
    
    if (openBraces > closeBraces) {
      console.log('🔧 检测到缺失的花括号结尾，正在修复...');
      jsonStr += '}';
    }
  }
  
  // 5. 修复错误的数组结构 - "errors": [...] 后面多了 ]
  const errorsArrayPattern = /("errors"\s*:\s*\[[^\]]*\])\s*\]/g;
  jsonStr = jsonStr.replace(errorsArrayPattern, '$1');
  
  // 6. 修复常见的结尾错误模式
  // 处理 "...}]" 或 "...} ]" 或 "...}\n]" 等情况
  jsonStr = jsonStr.replace(/}\s*\]$/, '}');
  
  console.log('🔧 JSON修复完成，修复后长度:', jsonStr.length);
  console.log('🔍 修复后开头字符:', jsonStr.slice(0, 5)); // 显示前5个字符
  console.log('🔍 修复后结尾字符:', jsonStr.slice(-5)); // 显示最后5个字符
  
  return jsonStr;
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

interface KnowledgeItem {
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

interface DomainInfo {
  domain: string;
  confidence: number;
  keywords: string[];
}

interface RAGEnhancedResult {
  errors: ErrorItem[];
  domain_info: {
    domain: string;
    confidence: number;
    keywords: string[];
  };
  knowledge_used: string[];
  rag_confidence: number;
  fallback_used: boolean;
  knowledge_sources: {
    private_count: number;
    shared_count: number;
    total_count: number;
  };
  document_sources: {
    private_documents: string[];
    shared_documents: string[];
  };
}

export async function POST(request: NextRequest) {
  console.log('开始RAG增强文档分析...');
  
  try {
    const { content, ownerId = 'default_user' } = await request.json();

    if (!content) {
      return NextResponse.json({ error: '文档内容不能为空' }, { status: 400 });
    }

    // 1. 初始化RAG组件
    const domainClassifier = new DomainClassifier();
    const knowledgeRetriever = new NewKnowledgeRetriever();

    // 2. 识别文档领域
    console.log('正在识别文档领域...');
    const domainInfo = await domainClassifier.identifyDomain(content);
    console.log('领域识别结果:', domainInfo);

    // 3. 使用多知识库检索相关知识
    console.log('正在从多知识库检索相关知识...');
    const multiKnowledgeResult = await knowledgeRetriever.retrieveFromMultipleKnowledgeBases(
      content,
      ownerId,
      domainInfo.domain,
      undefined, // 不限制知识类型
      4, // 专属知识库限制
      6  // 共享知识库限制
    );

    console.log(`多知识库检索完成:`, {
      private: multiKnowledgeResult.private_knowledge.length,
      shared: multiKnowledgeResult.shared_knowledge.length,
      combined: multiKnowledgeResult.combined_knowledge.length,
      private_docs: multiKnowledgeResult.private_documents.length,
      shared_docs: multiKnowledgeResult.shared_documents.length
    });

    // 4. 构建增强的提示词（使用合并后的知识）
    const enhancedPrompt = buildEnhancedPromptWithMultiKnowledge(
      content, 
      multiKnowledgeResult, 
      domainInfo
    );

    let ragResult: RAGEnhancedResult;

    // 5. 尝试调用DeepSeek API进行RAG增强分析
    if (DEEPSEEK_API_KEY) {
      try {
        console.log('正在调用DeepSeek API进行RAG增强分析...');
        
                  // 使用双DeepSeek客户端
    const dualClient = getDualDeepSeekClient(); // 使用现有实例，保持配置中心设置
        
        // 获取当前提供商
        const currentProvider = dualClient.getCurrentProvider();
        
        // 根据提供商类型设置超时控制
        let timeoutPromise: Promise<never> | null = null;
        
        if (currentProvider === 'cloud') {
          // 云端API设置合理的超时时间
          timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('云端DeepSeek API调用超时')), 300000); // 5分钟超时
          });
        } else {
          // 本地API不设置超时，让其自然完成
          console.log('⏳ 本地API调用，不设置超时限制，等待完成...');
          timeoutPromise = null;
        }

        const apiPromise = dualClient.createChatCompletion({
          messages: [
            {
              role: 'system',
              content: `你是专业的${domainInfo.domain}领域期刊编辑。请严格按照JSON格式返回文档校对结果。输出必须是有效的JSON字符串，包含errors数组.
              JSON输出格式示例：
              {
                "errors": [
                  {
                    "id": "error_1",
                    "type": "error",
                    "original": "具体错误文字",
                    "suggestion": "修改建议",
                    "reason": "基于知识库的修改原因",
                    "category": "错误类别"
                  }
                ]
              }

              **type:错误类型说明**：
              - error: 确定错误（术语错误、重复词汇、语法错误）
              - warning: 疑似错误（表达不规范、标点问题）
              - suggestion: 优化建议（表达优化、风格建议）

              
基于以下专业知识库进行精确校对：
${formatKnowledge(multiKnowledgeResult.combined_knowledge)}`
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          temperature: 0.3, // 手动设置为0.3，降低随机性
          max_tokens: 32000, // 手动设置为32000，避免截断输出
          stream: false,
          response_format: {'type': 'json_object'} // 根据DeepSeek API文档要求，启用JSON模式
        });

        console.log('正在调用DeepSeek API...');
        
        // 根据是否有超时设置选择不同的调用方式
        const response = timeoutPromise 
          ? await Promise.race([apiPromise, timeoutPromise]) as any
          : await apiPromise;

        const aiResponse = response.choices[0]?.message?.content;
          
        if (aiResponse) {
          try {
            console.log('📝 AI响应长度:', aiResponse.length);
            console.log('🔍 响应:', aiResponse);
            console.log('🔍 响应预览:', aiResponse.substring(0, 200) + '...');
            
            // 使用专门的DeepSeek-R1响应解析函数
            const parsedResult = parseDeepSeekR1Response(aiResponse);
            
            console.log('✅ 成功解析AIjson响应');
            
            // 处理数组格式的响应（DeepSeek直接返回errors数组）
            let errorsArray: any[] = [];
            if (Array.isArray(parsedResult)) {
              console.log('📋 检测到直接的错误数组格式');
              errorsArray = parsedResult;
            } else if (parsedResult.errors && Array.isArray(parsedResult.errors)) {
              console.log('📋 检测到包含errors字段的对象格式');
              errorsArray = parsedResult.errors;
            } else {
              console.warn('DeepSeek API返回的结果格式不正确:', parsedResult);
              throw new Error('API返回格式不正确');
            }
            
            if (errorsArray.length > 0) {
              const enhancedErrors = errorsArray.map((error: {
                id?: string;
                type?: string;
                position?: { start: number; end: number };
                original?: string;
                suggestion?: string;
                reason?: string;
                category?: string;
              }, index: number) => {
                const position = calculateErrorPosition(content, error.original || '', index);
                
                return {
                  id: `rag_error_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
                  type: (error.type as 'error' | 'warning' | 'suggestion') || 'warning',
                  position: error.position || position,
                  original: error.original || '未知错误',
                  suggestion: error.suggestion || '请检查此处',
                  reason: error.reason || '需要进一步检查',
                  category: error.category || '其他问题'
                };
              });

              ragResult = {
                errors: enhancedErrors,
                domain_info: domainInfo,
                knowledge_used: multiKnowledgeResult.combined_knowledge.map(k => k.content),
                rag_confidence: calculateRAGConfidence(multiKnowledgeResult.combined_knowledge, domainInfo),
                fallback_used: false,
                knowledge_sources: {
                  private_count: multiKnowledgeResult.private_knowledge.length,
                  shared_count: multiKnowledgeResult.shared_knowledge.length,
                  total_count: multiKnowledgeResult.private_knowledge.length + multiKnowledgeResult.shared_knowledge.length
                },
                document_sources: {
                  private_documents: multiKnowledgeResult.private_documents.map(d => d.filename || d.id),
                  shared_documents: multiKnowledgeResult.shared_documents.map(d => d.filename || d.id)
                }
              };

              // 6. 学习用户交互（这里可以在用户操作后调用）
              console.log(`RAG增强分析完成，发现 ${enhancedErrors.length} 个问题`);
              return NextResponse.json(ragResult);
            } else {
              console.warn('解析后的错误数组为空');
              throw new Error('没有发现任何错误项');
            }
          } catch (jsonError: unknown) {
            console.error('JSON解析错误:', jsonError instanceof Error ? jsonError.message : String(jsonError));
            console.error('原始响应:', aiResponse);
            throw new Error('JSON解析失败');
          }
        }
        
        console.warn('DeepSeek API调用失败，降级到本地RAG分析');
      } catch (apiError: unknown) {
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        console.error('DeepSeek API错误:', errorMessage);
        
        // 根据错误类型提供更详细的日志
        if (errorMessage.includes('超时')) {
          console.log('📡 网络超时，可能是网络连接较慢或API服务繁忙');
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          console.log('🔑 API密钥验证失败，请检查DEEPSEEK_API_KEY配置');
        } else if (errorMessage.includes('429')) {
          console.log('⚡ API调用频率超限，请稍后重试');
        } else {
          console.log('🔧 API调用异常，使用本地分析作为备选方案');
        }
      }
    }

    // 7. 降级到本地RAG增强分析
    console.log('🔄 使用本地RAG增强分析...');
    console.log(`📚 应用 ${multiKnowledgeResult.combined_knowledge.length} 条专业知识`);
    console.log(`🎯 文档领域: ${domainInfo.domain} (置信度: ${domainInfo.confidence})`);
    
    const localErrors = await generateRAGEnhancedErrors(content, multiKnowledgeResult.combined_knowledge, domainInfo);
    
    ragResult = {
      errors: localErrors,
      domain_info: domainInfo,
      knowledge_used: multiKnowledgeResult.combined_knowledge.map(k => k.content),
      rag_confidence: calculateRAGConfidence(multiKnowledgeResult.combined_knowledge, domainInfo),
      fallback_used: true,
      knowledge_sources: {
        private_count: multiKnowledgeResult.private_knowledge.length,
        shared_count: multiKnowledgeResult.shared_knowledge.length,
        total_count: multiKnowledgeResult.combined_knowledge.length
      },
      document_sources: {
        private_documents: multiKnowledgeResult.private_documents.map(d => d.filename || d.id),
        shared_documents: multiKnowledgeResult.shared_documents.map(d => d.filename || d.id)
      }
    };

    console.log(`✅ 本地RAG分析完成，发现 ${localErrors.length} 个问题`);
    return NextResponse.json(ragResult);

  } catch (error: unknown) {
    console.error('RAG增强分析失败:', error instanceof Error ? error.message : String(error));
    
    // 返回详细的错误信息，帮助用户诊断问题
    return NextResponse.json({
      error: 'RAG增强分析失败',
      error_details: error instanceof Error ? error.message : String(error),
      domain_info: { domain: 'unknown', confidence: 0, keywords: [] },
      knowledge_used: [],
      rag_confidence: 0,
      errors: [],
      suggestions: [
        '请检查网络连接是否正常',
        '请确认DeepSeek API配置是否正确',
        '请检查知识库服务是否可用',
        '如果问题持续存在，请联系技术支持'
      ]
    }, { status: 500 });
  }
}

/**
 * 构建多知识库增强的提示词
 */
function buildEnhancedPromptWithMultiKnowledge(
  content: string,
  multiKnowledgeResult: {
    private_knowledge: KnowledgeItem[];
    shared_knowledge: KnowledgeItem[];
    combined_knowledge: KnowledgeItem[];
    private_documents: any[];
    shared_documents: any[];
  },
  domainInfo: DomainInfo
): string {
  // 根据DeepSeek API文档要求，必须包含"json"字样和JSON格式样例
  const basePrompt = `请基于专业知识库对以下${domainInfo.domain}领域文档进行精确校对，并严格按照JSON格式返回结果。

**专属知识库** (${multiKnowledgeResult.private_knowledge.length}条):
${formatKnowledgeWithSource(multiKnowledgeResult.private_knowledge, '专属知识库')}

**共享知识库** (${multiKnowledgeResult.shared_knowledge.length}条):
${formatKnowledgeWithSource(multiKnowledgeResult.shared_knowledge, '共享知识库')}

**检查重点**：
1. 专业术语准确性和一致性
2. ${domainInfo.domain}领域特定的写作规范
3. 重复词汇和标点符号
4. 语法错误和表达不当
5. 学术写作风格规范

**JSON输出格式示例**：
{
  "errors": [
    {
      "id": "error_1",
      "type": "error",
      "original": "具体错误文字",
      "suggestion": "修改建议",
      "reason": "基于知识库的修改原因",
      "category": "错误类别"
    }
  ]
}

**错误类型说明**：
- error: 确定错误（术语错误、重复词汇、语法错误）
- warning: 疑似错误（表达不规范、标点问题）
- suggestion: 优化建议（表达优化、风格建议）

**待分析文档**：
${content}

请严格按照上述JSON格式返回分析结果，确保输出是有效的JSON字符串。`;

  return basePrompt;
}

/**
 * 格式化带来源标识的知识
 */
function formatKnowledgeWithSource(knowledge: KnowledgeItem[], _source: string): string {
  return knowledge.map((item, index) => {
    const confidenceLevel = item.confidence >= 0.8 ? '🔴高' : item.confidence >= 0.6 ? '🟡中' : '🟢低';
    const relevanceScore = item.relevance_score ? ` (相关度: ${(item.relevance_score * 100).toFixed(1)}%)` : '';
    
    return `${index + 1}. [${item.type}] ${item.content}
   💡 应用场景: ${item.context}
   📊 置信度: ${confidenceLevel} (${item.confidence})${relevanceScore}
   🏷️ 标签: ${item.tags.join(', ')}
   📍 来源: ${item.source}`;
  }).join('\n\n');
}

/**
 * 格式化知识库内容
 */
function formatKnowledge(knowledge: KnowledgeItem[]): string {
  if (knowledge.length === 0) return '暂无相关知识';
  
  return knowledge.map(k => 
    `• ${k.content} (${k.type}, 置信度: ${k.confidence})`
  ).join('\n');
}

/**
 * 计算RAG置信度
 */
function calculateRAGConfidence(knowledge: KnowledgeItem[], domainInfo: DomainInfo): number {
  if (knowledge.length === 0) return 0;
  
  const avgKnowledgeConfidence = knowledge.reduce((sum, k) => sum + k.confidence, 0) / knowledge.length;
  const domainConfidence = domainInfo.confidence;
  
  return (avgKnowledgeConfidence + domainConfidence) / 2;
}

/**
 * 生成RAG增强的错误检测（本地分析）
 */
async function generateRAGEnhancedErrors(
  content: string,
  knowledge: KnowledgeItem[],
  domainInfo: DomainInfo
): Promise<ErrorItem[]> {
  const errors: ErrorItem[] = [];
  
  // 基于知识库检查术语
  errors.push(...checkTerminologyWithKnowledge(content, knowledge));
  
  // 基于领域检查特定问题
  errors.push(...checkDomainSpecificIssues(content, domainInfo.domain));
  
  // 生成基本错误检查
  errors.push(...generateBasicErrors(content));
  
  return errors;
}

/**
 * 生成基本错误
 */
function generateBasicErrors(content: string): ErrorItem[] {
  const errors: ErrorItem[] = [];
  
  // 检查标点符号
  const punctuationIssues = content.match(/[，。！？；：""''（）【】]/g);
  if (punctuationIssues) {
    errors.push({
      id: `basic_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`,
      type: 'suggestion',
      position: { start: 0, end: content.length },
      original: '文档包含中文标点符号',
      suggestion: '建议检查标点符号使用是否规范',
      reason: '中文文档应使用中文标点符号',
      category: '标点符号'
    });
  }
  
  // 检查重复词汇
  const words = content.split(/\s+/);
  const wordCount: { [key: string]: number } = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  Object.entries(wordCount).forEach(([word, count], index) => {
    if (count > 3 && word.length > 2) {
      errors.push({
        id: `basic_${Date.now()}_2_${index}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'warning',
        position: { start: 0, end: content.length },
        original: `词汇"${word}"重复使用${count}次`,
        suggestion: '建议使用同义词或重新组织句子',
        reason: '避免词汇重复，提高表达多样性',
        category: '词汇使用'
      });
    }
  });
  
  return errors;
}

/**
 * 基于知识库检查术语
 */
function checkTerminologyWithKnowledge(content: string, knowledge: KnowledgeItem[]): ErrorItem[] {
  const errors: ErrorItem[] = [];
  
  knowledge.forEach((k, index) => {
    if (k.type === 'terminology' && k.confidence > 0.7) {
      const regex = new RegExp(k.content, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        errors.push({
          id: `terminology_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'suggestion',
          position: { start: 0, end: content.length },
          original: `术语"${k.content}"的使用`,
          suggestion: k.context || '请检查术语使用是否准确',
          reason: `基于知识库建议: ${k.source}`,
          category: '术语使用'
        });
      }
    }
  });
  
  return errors;
}

/**
 * 检查领域特定问题
 */
function checkDomainSpecificIssues(content: string, domain: string): ErrorItem[] {
  const errors: ErrorItem[] = [];
  
  switch (domain) {
    case 'academic':
      // 学术写作检查
      if (!content.includes('研究') && !content.includes('分析') && !content.includes('结论')) {
        errors.push({
          id: `domain_${Date.now()}_1_${Math.random().toString(36).substr(2, 9)}`,
          type: 'warning',
          position: { start: 0, end: content.length },
          original: '学术写作结构',
          suggestion: '建议包含研究背景、方法、分析、结论等要素',
          reason: '学术文档应具备完整的学术写作结构',
          category: '文档结构'
        });
      }
      break;
      
    case 'technical':
      // 技术文档检查
      if (!content.includes('技术') && !content.includes('系统') && !content.includes('实现')) {
        errors.push({
          id: `domain_${Date.now()}_2_${Math.random().toString(36).substr(2, 9)}`,
          type: 'suggestion',
          position: { start: 0, end: content.length },
          original: '技术文档内容',
          suggestion: '建议增加技术细节和实现说明',
          reason: '技术文档应包含具体的技术实现细节',
          category: '内容完整性'
        });
      }
      break;
  }
  
  return errors;
}

/**
 * 计算错误位置
 */
function calculateErrorPosition(content: string, original: string, index: number): { start: number; end: number } {
  const start = content.indexOf(original);
  if (start !== -1) {
    return { start, end: start + original.length };
  }
  
  // 如果找不到精确匹配，返回基于索引的估算位置
  const segmentLength = Math.floor(content.length / 10);
  const startPos = Math.min(index * segmentLength, content.length - 1);
  return { start: startPos, end: Math.min(startPos + 10, content.length) };
}

/**
 * 从DeepSeek API响应中提取完整的JSON内容
 * 支持多种格式：<think>标签、markdown代码块、纯JSON等
 */
function extractCompleteJsonFromResponse(aiResponse: string): string | null {
  try {
    let processedResponse = aiResponse.trim();
    console.log('🔍 开始JSON提取，原始响应长度:', processedResponse.length);
console.log('📝 原始响应前2000字符:', processedResponse.substring(0, 2000));
    
    // 🆘 专门处理DeepSeek-R1模型的截断响应问题
    console.log('🤖 检查DeepSeek-R1特殊情况...');
    
    // 检查是否是被截断的响应（包含think标签但没有完整JSON）
    const hasThinkTag = processedResponse.includes('<think>') || processedResponse.includes('\\u003cthink\\u003e');
    const hasJsonStart = processedResponse.includes('{') || processedResponse.includes('[');
    const hasCompleteJson = processedResponse.includes('errors') && 
                           (processedResponse.includes(']}') || processedResponse.includes('}]'));
    
    console.log(`📊 响应分析: think标签=${hasThinkTag}, JSON开始=${hasJsonStart}, 完整JSON=${hasCompleteJson}`);
    
    if (hasThinkTag && hasJsonStart && !hasCompleteJson) {
      console.log('⚠️ 检测到DeepSeek-R1截断响应，尝试智能修复...');
      
      // 尝试从响应中提取部分JSON并补全
      const partialJsonMatch = processedResponse.match(/\{[\s\S]*$/);
      if (partialJsonMatch) {
        const partialJson = partialJsonMatch[0];
        console.log('🔧 找到部分JSON，长度:', partialJson.length);
        
        // 智能补全截断的JSON
        const repairedJson = repairTruncatedDeepSeekJson(partialJson, processedResponse);
        if (repairedJson) {
          console.log('✅ 成功修复截断的JSON');
          return repairedJson;
        }
      }
      
      // 如果无法修复，生成基于think内容的应急JSON
      console.log('🆘 无法修复截断JSON，生成应急响应...');
      const emergencyJson = generateEmergencyJsonFromThink(processedResponse);
      if (emergencyJson) {
        console.log('🎯 成功生成应急JSON');
        return emergencyJson;
      }
    }
    
    // 如果只有think标签没有JSON，直接生成应急响应
    if (hasThinkTag && !hasJsonStart) {
      console.log('⚡ 检测到纯思考响应，生成应急JSON...');
      const emergencyJson = generateEmergencyJsonFromThink(processedResponse);
      if (emergencyJson) {
        return emergencyJson;
      }
    }
    
    // 1. 处理Unicode编码的特殊字符
    console.log('🔤 处理Unicode编码...');
    try {
      // 解码Unicode转义序列
      processedResponse = processedResponse.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
        return String.fromCharCode(parseInt(code, 16));
      });
      console.log('✅ Unicode解码完成');
    } catch (unicodeError) {
      console.warn('⚠️ Unicode解码失败，继续处理:', unicodeError);
    }
    
    // 2. 处理DeepSeek特有的思考标签和响应格式（增强版）
    console.log('🧠 处理DeepSeek思考标签...');
    
    // 2.1 处理各种形式的think标签
    const thinkPatterns = [
      /<think>[\s\S]*?<\/think>/gi,          // 标准think标签
      /\\u003cthink\\u003e[\s\S]*?\\u003c\/think\\u003e/gi, // Unicode编码的think标签
      /<think>[\s\S]*$/gi,                    // 未闭合的think标签（从think开始到结尾）
      /\\u003cthink\\u003e[\s\S]*$/gi        // Unicode编码的未闭合think标签
    ];
    
    for (const pattern of thinkPatterns) {
      if (pattern.test(processedResponse)) {
        console.log(`📝 检测到think标签模式: ${pattern.source}`);
        processedResponse = processedResponse.replace(pattern, '');
      }
    }
    
    // 2.2 移除其他可能的XML/HTML标签
    if (processedResponse.includes('<') && processedResponse.includes('>')) {
      console.log('🏷️ 检测到其他标签，进行清理...');
      
      // 保护JSON字符串中的尖括号
      const protectedResponse = processedResponse.replace(/"[^"]*"/g, (match) => {
        return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      });
      
      // 移除标签
      let cleanedResponse = protectedResponse.replace(/<[^>]*>/g, '');
      
      // 恢复JSON字符串中的尖括号
      cleanedResponse = cleanedResponse.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      
      processedResponse = cleanedResponse.trim();
      console.log('🧹 标签清理后长度:', processedResponse.length);
    }
    
    // 3. 处理OpenAI兼容格式的响应
    console.log('🔍 检查OpenAI兼容格式...');
    try {
      const possibleOpenAIResponse = JSON.parse(processedResponse);
      
      if (possibleOpenAIResponse.choices && 
          Array.isArray(possibleOpenAIResponse.choices) && 
          possibleOpenAIResponse.choices[0]?.message?.content) {
        
        console.log('📋 检测到OpenAI兼容格式，提取content字段...');
        processedResponse = possibleOpenAIResponse.choices[0].message.content;
        console.log('✅ 成功提取content内容，长度:', processedResponse.length);
        
        // 递归处理提取出的content（可能还需要进一步解析）
        return extractCompleteJsonFromResponse(processedResponse);
      }
    } catch (e) {
      // 不是OpenAI格式，继续正常处理
      console.log('📄 不是OpenAI格式，继续常规解析...');
    }
    
    // 4. 处理markdown代码块 - 增强版
    if (processedResponse.includes('```')) {
      console.log('📋 检测到markdown代码块，提取JSON内容...');
      
      // 更灵活的代码块匹配
      const codeBlockPatterns = [
        /```json\s*([\s\S]*?)```/gi,
        /```\s*([\s\S]*?)```/gi,
        /`([\s\S]*?)`/gi
      ];
      
      let bestMatch = '';
      let maxLength = 0;
      
      for (const pattern of codeBlockPatterns) {
        let match;
        pattern.lastIndex = 0; // 重置正则表达式状态
        
        while ((match = pattern.exec(processedResponse)) !== null) {
          const content = match[1].trim();
          if (content.length > maxLength && (content.includes('{') || content.includes('['))) {
            bestMatch = content;
            maxLength = content.length;
          }
        }
      }
      
      if (bestMatch) {
        processedResponse = bestMatch;
        console.log('📦 提取最佳代码块，长度:', processedResponse.length);
      }
    }
    
    // 5. 智能JSON边界检测 - 增强版
    console.log('🎯 智能JSON边界检测...');
    
    // 5.1 查找可能的JSON起始位置
    const jsonStartCandidates = [];
    let searchIndex = 0;
    
    while (searchIndex < processedResponse.length) {
      const braceIndex = processedResponse.indexOf('{', searchIndex);
      const bracketIndex = processedResponse.indexOf('[', searchIndex);
      
      if (braceIndex === -1 && bracketIndex === -1) break;
      
      let nextStart = -1;
      if (braceIndex !== -1 && bracketIndex !== -1) {
        nextStart = Math.min(braceIndex, bracketIndex);
      } else if (braceIndex !== -1) {
        nextStart = braceIndex;
      } else {
        nextStart = bracketIndex;
      }
      
      jsonStartCandidates.push(nextStart);
      searchIndex = nextStart + 1;
    }
    
    // 5.2 为每个起始位置尝试找到匹配的结束位置
    let bestJsonExtract = '';
    let maxValidLength = 0;
    
    for (const startIndex of jsonStartCandidates) {
      const startChar = processedResponse[startIndex];
      const endChar = startChar === '{' ? '}' : ']';
      
      let bracketCount = 0;
      let endIndex = -1;
      let inString = false;
      let escapeNext = false;
      
      for (let i = startIndex; i < processedResponse.length; i++) {
        const char = processedResponse[i];
        
        if (escapeNext) {
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          continue;
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString;
          continue;
        }
        
        if (!inString) {
          if (char === startChar) {
            bracketCount++;
          } else if (char === endChar) {
            bracketCount--;
            if (bracketCount === 0) {
              endIndex = i;
              break;
            }
          }
        }
      }
      
      if (endIndex !== -1) {
        const candidate = processedResponse.substring(startIndex, endIndex + 1);
        
        // 验证这个候选JSON是否有效
        try {
          JSON.parse(candidate);
          if (candidate.length > maxValidLength) {
            bestJsonExtract = candidate;
            maxValidLength = candidate.length;
          }
        } catch (e) {
          // 这个候选不是有效的JSON，继续尝试
        }
      }
    }
    
    if (bestJsonExtract) {
      processedResponse = bestJsonExtract;
      console.log('🎯 找到最佳JSON候选，长度:', processedResponse.length);
    } else {
      // 如果没有找到完整的有效JSON，使用传统方法（支持对象和数组）
      const objectStartIndex = processedResponse.indexOf('{');
      const objectEndIndex = processedResponse.lastIndexOf('}');
      const arrayStartIndex = processedResponse.indexOf('[');
      const arrayEndIndex = processedResponse.lastIndexOf(']');
      
      let jsonStartIndex = -1;
      let jsonEndIndex = -1;
      let jsonType = '';
      
      // 优先选择最早出现的有效JSON结构
      if (objectStartIndex !== -1 && arrayStartIndex !== -1) {
        if (objectStartIndex < arrayStartIndex) {
          jsonStartIndex = objectStartIndex;
          jsonEndIndex = objectEndIndex;
          jsonType = 'object';
        } else {
          jsonStartIndex = arrayStartIndex;
          jsonEndIndex = arrayEndIndex;
          jsonType = 'array';
        }
      } else if (objectStartIndex !== -1) {
        jsonStartIndex = objectStartIndex;
        jsonEndIndex = objectEndIndex;
        jsonType = 'object';
      } else if (arrayStartIndex !== -1) {
        jsonStartIndex = arrayStartIndex;
        jsonEndIndex = arrayEndIndex;
        jsonType = 'array';
      }
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        processedResponse = processedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
        console.log(`🔄 使用传统边界检测（${jsonType}），长度:`, processedResponse.length);
      } else {
        console.warn('⚠️ 未能找到任何JSON对象或数组边界');
        return null;
      }
    }
    
    // 6. 高级JSON修复和清理 - 增强版
    let jsonToProcess = processedResponse;
    console.log('🔧 开始高级JSON修复...');
    
    // 6.1 修复DeepSeek特有的格式问题
    console.log('🤖 修复DeepSeek特有格式问题...');
    
    // 修复position字段的各种中文描述
    const positionFixes: Array<[RegExp, string]> = [
      [/"start":\s*起始位置/g, '"start": 0'],
      [/"end":\s*结束位置/g, '"end": 100'],
      [/"start":\s*标题开始/g, '"start": 0'],
      [/"end":\s*标题结束/g, '"end": 50'],
      [/"start":\s*文档开始/g, '"start": 0'],
      [/"end":\s*文档结束/g, '"end": 1000'],
      [/"start":\s*[^0-9"{\[,}][^,}]*/g, '"start": 0'],
      [/"end":\s*[^0-9"{\[,}][^,}]*/g, '"end": 100']
    ];
    
    for (const [pattern, replacement] of positionFixes) {
      jsonToProcess = jsonToProcess.replace(pattern, replacement);
    }
    
    // 6.2 修复数字格式问题 - 增强版
    console.log('🔢 修复数字格式问题...');
    
    // 移除无效的前导零
    jsonToProcess = jsonToProcess.replace(/:\s*0+(\d+)/g, ': $1');
    jsonToProcess = jsonToProcess.replace(/:\s*00\b/g, ': 0');
    jsonToProcess = jsonToProcess.replace(/"(start|end)":\s*0+(\d+)/g, '"$1": $2');
    jsonToProcess = jsonToProcess.replace(/"(start|end)":\s*00\b/g, '"$1": 0');
    
    // 6.3 修复字符串值问题 - 增强版
    console.log('📝 修复字符串值问题...');
    
    // 为未引用的非数字、非布尔值添加引号
    jsonToProcess = jsonToProcess.replace(/:\s*([^"{\[\d,}\s][^,}]*)\s*([,}])/g, (match, value, ending) => {
      const trimmedValue = value.trim();
      
      // 跳过已经是有效JSON值的情况
      if (/^(true|false|null|\d+(\.\d+)?|".*")$/.test(trimmedValue)) {
        return match;
      }
      
      // 跳过对象和数组
      if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
        return match;
      }
      
      // 添加引号
      return `: "${trimmedValue}"${ending}`;
    });
    
    // 6.4 修复常见的JSON语法错误
    console.log('⚙️ 修复JSON语法错误...');
    
    // 移除多余的逗号
    jsonToProcess = jsonToProcess.replace(/,(\s*[}\]])/g, '$1');
    jsonToProcess = jsonToProcess.replace(/([{\[])\s*,/g, '$1');
    
    // 修复中文引号
    jsonToProcess = jsonToProcess.replace(/"/g, '"').replace(/"/g, '"');
    
    // 修复其他常见问题
    jsonToProcess = jsonToProcess.replace(/([^\\])\\([^"\\\/bfnrt])/g, '$1\\\\$2');
    
    // 6.5 括号平衡检查和修复 - 增强版
    console.log('🔧 检查和修复括号平衡...');
    
    const brackets: Record<string, number> = { '{': 0, '[': 0 };
    const closeBrackets: Record<string, string> = { '}': '{', ']': '[' };
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < jsonToProcess.length; i++) {
      const char = jsonToProcess[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char in brackets) {
          brackets[char]++;
        } else if (char in closeBrackets) {
          const openChar = closeBrackets[char];
          if (brackets[openChar] > 0) {
            brackets[openChar]--;
          }
        }
      }
    }
    
    // 补全缺失的闭合括号
    jsonToProcess += ']'.repeat(brackets['[']);
    jsonToProcess += '}'.repeat(brackets['{']);
    
    if (brackets['['] > 0 || brackets['{'] > 0) {
      console.log(`🔨 补全了 ${brackets['[']} 个方括号和 ${brackets['{']} 个大括号`);
    }
    
    console.log('🎨 JSON修复完成，最终长度:', jsonToProcess.length);
    console.log('📝 修复后JSON前200字符:', jsonToProcess.substring(0, 200));
    
    // 7. 多层验证和修复
    return validateAndFixJson(jsonToProcess);
    
  } catch (error: unknown) {
    console.error('💥 JSON提取过程异常:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * 多层JSON验证和修复
 */
function validateAndFixJson(jsonString: string): string | null {
  console.log('🔍 开始多层JSON验证...');
  
  // 第一层：直接验证
  try {
    const parsed = JSON.parse(jsonString);
    console.log('✅ 第一层验证通过');
    
    if (validateJsonStructure(parsed)) {
      return jsonString;
    }
  } catch (error) {
    console.log('❌ 第一层验证失败，尝试修复...');
  }
  
  // 第二层：基础修复后验证
  try {
    const basicFixed = fixProblematicJson(jsonString);
    const parsed = JSON.parse(basicFixed);
    console.log('✅ 第二层验证通过（基础修复）');
    
    if (validateJsonStructure(parsed)) {
      return basicFixed;
    }
  } catch (error) {
    console.log('❌ 第二层验证失败，尝试增强修复...');
  }
  
  // 第三层：增强修复后验证
  try {
    const enhancedFixed = fixProblematicJsonEnhanced(jsonString);
    const parsed = JSON.parse(enhancedFixed);
    console.log('✅ 第三层验证通过（增强修复）');
    
    if (validateJsonStructure(parsed)) {
      return enhancedFixed;
    }
  } catch (error) {
    console.log('❌ 第三层验证失败，尝试智能重构...');
  }
  
  // 第四层：智能重构
  try {
    const reconstructed = intelligentJsonReconstruction(jsonString);
    if (reconstructed) {
      const parsed = JSON.parse(reconstructed);
      console.log('✅ 第四层验证通过（智能重构）');
      
      if (validateJsonStructure(parsed)) {
        return reconstructed;
      }
    }
  } catch (error) {
    console.log('❌ 第四层验证失败，使用应急方案...');
  }
  
  // 最后的应急方案
  console.log('🆘 使用应急JSON结构...');
  const emergencyJson = {
    errors: [{
      type: "warning",
      original: "JSON解析失败",
      suggestion: "请检查API响应格式",
      reason: "DeepSeek API返回了无法解析的JSON格式，已使用应急处理",
      category: "系统错误",
      position: { start: 0, end: 100 }
    }]
  };
  
  return JSON.stringify(emergencyJson);
}

/**
 * 验证JSON结构是否符合预期
 */
function validateJsonStructure(parsed: any): boolean {
  // 情况1：直接是errors数组
  if (Array.isArray(parsed)) {
    console.log(`📊 发现直接的errors数组，包含 ${parsed.length} 个错误项`);
    
    // 验证数组中的错误项结构
    const validErrors = parsed.filter((error: any) => {
      const hasRequiredFields = error.type && error.original && error.suggestion && error.reason && error.category;
      
      // 如果缺少position字段，自动添加
      if (hasRequiredFields && !error.position) {
        error.position = { start: 0, end: 100 };
      }
      
      return hasRequiredFields;
    });
    
    if (validErrors.length !== parsed.length) {
      console.warn(`⚠️ 发现 ${parsed.length - validErrors.length} 个格式不完整的错误项，已过滤`);
    }
    
    console.log(`✅ 有效错误项: ${validErrors.length} 个`);
    return validErrors.length > 0;
  }
  
  // 情况2：包含errors数组的对象
  if (parsed.errors && Array.isArray(parsed.errors)) {
    console.log(`📊 发现errors数组，包含 ${parsed.errors.length} 个错误项`);
    
    // 验证错误项结构
    const validErrors = parsed.errors.filter((error: any) => {
      const hasRequiredFields = error.type && error.original && error.suggestion && error.reason && error.category;
      
      // 如果缺少position字段，自动添加
      if (hasRequiredFields && !error.position) {
        error.position = { start: 0, end: 100 };
      }
      
      return hasRequiredFields;
    });
    
    if (validErrors.length !== parsed.errors.length) {
      console.warn(`⚠️ 发现 ${parsed.errors.length - validErrors.length} 个格式不完整的错误项，已过滤`);
      parsed.errors = validErrors;
    }
    
    console.log(`✅ 有效错误项: ${validErrors.length} 个`);
    return validErrors.length > 0;
  }
  
  console.warn('⚠️ JSON中未找到有效的errors数组或直接的错误数组');
  return false;
}

/**
 * 智能JSON重构 - 从损坏的JSON中提取有用信息
 */
function intelligentJsonReconstruction(brokenJson: string): string | null {
  console.log('🤖 开始智能JSON重构...');
  
  try {
    // 提取可能的错误信息
    const errors: any[] = [];
    
    // 查找type字段
    const typeMatches = brokenJson.match(/"type":\s*"(error|warning|suggestion)"/g);
    const originalMatches = brokenJson.match(/"original":\s*"([^"]+)"/g);
    const suggestionMatches = brokenJson.match(/"suggestion":\s*"([^"]+)"/g);
    const reasonMatches = brokenJson.match(/"reason":\s*"([^"]+)"/g);
    const categoryMatches = brokenJson.match(/"category":\s*"([^"]+)"/g);
    
    const maxLength = Math.max(
      typeMatches?.length || 0,
      originalMatches?.length || 0,
      suggestionMatches?.length || 0,
      reasonMatches?.length || 0,
      categoryMatches?.length || 0
    );
    
    for (let i = 0; i < maxLength; i++) {
      const error: any = {
        id: `reconstructed_${Date.now()}_${i}`,
        type: typeMatches?.[i]?.match(/"([^"]+)"/)?.[1] || 'warning',
        original: originalMatches?.[i]?.match(/"([^"]+)"/)?.[1] || '重构的内容',
        suggestion: suggestionMatches?.[i]?.match(/"([^"]+)"/)?.[1] || '建议优化表达',
        reason: reasonMatches?.[i]?.match(/"([^"]+)"/)?.[1] || '从损坏的JSON中重构',
        category: categoryMatches?.[i]?.match(/"([^"]+)"/)?.[1] || '重构',
        position: { start: i * 10, end: (i + 1) * 10 }
      };
      
      errors.push(error);
    }
    
    if (errors.length > 0) {
      const reconstructedJson = {
        errors: errors
      };
      
      console.log(`🔧 重构了 ${errors.length} 个错误项`);
      return JSON.stringify(reconstructedJson);
    }
    
  } catch (error) {
    console.error('❌ 智能重构失败:', error);
  }
  
  return null;
}

/**
 * 修复有问题的JSON内容
 * 专门处理DeepSeek API返回的包含中文字符和格式错误的JSON
 */
function fixProblematicJson(jsonString: string): string {
  try {
    let fixed = jsonString.trim();
    
    console.log('🔧 开始高级JSON修复...');
    
    // 1. 修复position字段中的中文描述
    fixed = fixed.replace(/"start":\s*起始位置/g, '"start": 0');
    fixed = fixed.replace(/"end":\s*结束位置/g, '"end": 100');
    fixed = fixed.replace(/"start":\s*标题开始/g, '"start": 0');
    fixed = fixed.replace(/"end":\s*标题结束/g, '"end": 50');
    
    // 2. 修复无效的数字格式（如 00, 0123 等）
    fixed = fixed.replace(/"(start|end)":\s*0+(\d+)/g, '"$1": $2');
    fixed = fixed.replace(/"(start|end)":\s*00\b/g, '"$1": 0');
    
    // 3. 修复缺少引号的字符串值
    fixed = fixed.replace(/:\s*([^"{\[\d,}\s][^,}]*)\s*([,}])/g, (match, value, ending) => {
      const trimmedValue = value.trim();
      if (!/^(true|false|null|\d+)$/.test(trimmedValue) && !trimmedValue.startsWith('"')) {
        return `: "${trimmedValue}"${ending}`;
      }
      return match;
    });
    
    // 4. 修复特殊的中文值情况
    fixed = fixed.replace(/:\s*([^"{\[\d,}][^,}]*[^",}])\s*([,}])/g, (match, value, ending) => {
      const trimmedValue = value.trim();
      if (!/^["{\[\d]/.test(trimmedValue) && !/^(true|false|null)$/.test(trimmedValue)) {
        return `: "${trimmedValue}"${ending}`;
      }
      return match;
    });
    
    // 5. 修复数字格式问题 - 移除前导零
    fixed = fixed.replace(/:\s*0+(\d+)/g, ': $1');
    fixed = fixed.replace(/:\s*00\b/g, ': 0');
    
    // 6. 移除多余的逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 7. 修复双引号问题
    fixed = fixed.replace(/"/g, '"').replace(/"/g, '"');
    
    // 8. 修复其他常见的JSON格式问题
    // 确保对象和数组的正确格式
    fixed = fixed.replace(/{\s*,/g, '{');
    fixed = fixed.replace(/,\s*}/g, '}');
    fixed = fixed.replace(/\[\s*,/g, '[');
    fixed = fixed.replace(/,\s*\]/g, ']');
    
    console.log('✅ 高级JSON修复完成');
    
    return fixed;
  } catch (error) {
    console.error('JSON修复过程异常:', error);
    return jsonString;
  }
}

/**
 * 增强版JSON修复函数 - 处理数字格式问题
 */
function fixProblematicJsonEnhanced(jsonString: string): string {
  try {
    let fixed = jsonString.trim();
    
    console.log('🔧 开始增强版JSON修复...');
    
    // 1. 修复position字段中的中文描述
    fixed = fixed.replace(/"start":\s*起始位置/g, '"start": 0');
    fixed = fixed.replace(/"end":\s*结束位置/g, '"end": 100');
    fixed = fixed.replace(/"start":\s*标题开始/g, '"start": 0');
    fixed = fixed.replace(/"end":\s*标题结束/g, '"end": 50');
    
    // 2. 修复无效的数字格式（如 00, 0123 等前导零问题）
    fixed = fixed.replace(/"(start|end)":\s*0+(\d+)/g, '"$1": $2');
    fixed = fixed.replace(/"(start|end)":\s*00\b/g, '"$1": 0');
    
    // 3. 通用数字格式修复 - 移除所有前导零
    fixed = fixed.replace(/:\s*0+(\d+)/g, ': $1');
    fixed = fixed.replace(/:\s*00\b/g, ': 0');
    
    // 4. 修复缺少引号的字符串值
    fixed = fixed.replace(/:\s*([^"{\[\d,}\s][^,}]*)\s*([,}])/g, (match, value, ending) => {
      const trimmedValue = value.trim();
      if (!/^(true|false|null|\d+)$/.test(trimmedValue) && !trimmedValue.startsWith('"')) {
        return `: "${trimmedValue}"${ending}`;
      }
      return match;
    });
    
    // 5. 修复特殊的中文值情况
    fixed = fixed.replace(/:\s*([^"{\[\d,}][^,}]*[^",}])\s*([,}])/g, (match, value, ending) => {
      const trimmedValue = value.trim();
      if (!/^["{\[\d]/.test(trimmedValue) && !/^(true|false|null)$/.test(trimmedValue)) {
        return `: "${trimmedValue}"${ending}`;
      }
      return match;
    });
    
    // 6. 移除多余的逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    
    // 7. 修复双引号问题
    fixed = fixed.replace(/"/g, '"').replace(/"/g, '"');
    
    // 8. 修复其他常见的JSON格式问题
    fixed = fixed.replace(/{\s*,/g, '{');
    fixed = fixed.replace(/,\s*}/g, '}');
    fixed = fixed.replace(/\[\s*,/g, '[');
    fixed = fixed.replace(/,\s*\]/g, ']');
    
    console.log('✅ 增强版JSON修复完成');
    console.log('📝 修复后前200字符:', fixed.substring(0, 200));
    
    return fixed;
  } catch (error) {
    console.error('JSON修复过程异常:', error);
    return jsonString;
  }
}

/**
 * 从DeepSeek的think标签内容中生成应急JSON响应
 * 当API只返回思考过程而没有JSON时使用
 */
function generateEmergencyJsonFromThink(thinkContent: string): string | null {
  try {
    console.log('🆘 开始从think内容生成应急JSON...');
    console.log('📝 think内容长度:', thinkContent.length);
    
    // 提取think标签中的内容
    let thinkText = thinkContent;
    
    // 提取think标签内部的文本
    const thinkMatch = thinkContent.match(/<think>([\s\S]*?)<\/think>/i);
    if (thinkMatch) {
      thinkText = thinkMatch[1];
    } else if (thinkContent.includes('<think>')) {
      // 处理未闭合的think标签
      const startIndex = thinkContent.indexOf('<think>');
      if (startIndex !== -1) {
        thinkText = thinkContent.substring(startIndex + 7); // 7 = '<think>'.length
      }
    }
    
    console.log('🧠 提取的思考内容长度:', thinkText.length);
    
    // 分析think内容，寻找可能的错误线索
    const errors: ErrorItem[] = [];
    
    // 1. 从think内容中提取可能的问题
    const problemIndicators = [
      /存在[\s\S]*?问题/gi,
      /错误[\s\S]*?/gi,
      /建议[\s\S]*?/gi,
      /修改[\s\S]*?/gi,
      /优化[\s\S]*?/gi,
      /不当[\s\S]*?/gi,
      /不合适[\s\S]*?/gi,
      /改进[\s\S]*?/gi
    ];
    
    let errorCount = 0;
    for (const pattern of problemIndicators) {
      const matches = thinkText.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (errorCount >= 5) break; // 限制应急错误数量
          
          const cleanMatch = match.replace(/[^\w\s\u4e00-\u9fff]/g, '').trim();
          if (cleanMatch.length > 3) {
            errors.push({
              id: `emergency_think_${Date.now()}_${errorCount}`,
              type: 'suggestion' as const,
              position: { start: errorCount * 20, end: (errorCount + 1) * 20 },
              original: cleanMatch.substring(0, 50) || '文档片段',
              suggestion: `根据AI分析建议：${cleanMatch.substring(0, 100)}`,
              reason: '基于DeepSeek思考过程的智能分析',
              category: 'AI智能分析'
            });
            errorCount++;
          }
        }
        if (errorCount >= 5) break;
      }
    }
    
    // 2. 如果没有找到明确的问题指示，创建基于关键词的通用建议
    if (errors.length === 0) {
      console.log('🎯 未找到明确问题，生成通用建议...');
      
      const keywords = thinkText.match(/[\u4e00-\u9fff]+/g) || [];
      const meaningfulKeywords = keywords.filter(kw => kw.length > 1).slice(0, 3);
      
      if (meaningfulKeywords.length > 0) {
        errors.push({
          id: `emergency_general_${Date.now()}`,
          type: 'suggestion' as const,
          position: { start: 0, end: 100 },
          original: '文档内容',
          suggestion: `建议关注以下方面：${meaningfulKeywords.join('、')}等关键要素的表达和逻辑`,
          reason: '基于AI深度思考分析的综合建议',
          category: 'AI综合分析'
        });
      }
    }
    
    // 3. 确保至少有一个错误项
    if (errors.length === 0) {
      console.log('⚡ 生成最小应急响应...');
      errors.push({
        id: `emergency_minimal_${Date.now()}`,
        type: 'suggestion' as const,
        position: { start: 0, end: 50 },
        original: '文档内容',
        suggestion: 'AI正在深度分析文档内容，建议等待完整分析结果或重新提交',
        reason: 'DeepSeek AI正在进行深度思考分析',
        category: 'AI处理状态'
      });
    }
    
    const emergencyResponse = {
      errors: errors
    };
    
    console.log(`✅ 成功生成应急JSON，包含 ${errors.length} 个建议项`);
    return JSON.stringify(emergencyResponse, null, 2);
    
  } catch (error) {
    console.error('❌ 应急JSON生成失败:', error);
    
    // 最后的应急响应方案
    const emergencyResponse = {
      errors: [{
        id: `emergency_${Date.now()}`,
        type: 'warning' as const,
        position: { start: 0, end: 100 },
        original: '文档内容',
        suggestion: 'AI分析正在进行中，请稍后重试或检查网络连接',
        reason: 'DeepSeek API响应格式异常，正在进行格式修复',
        category: 'API状态'
      }]
    };
    
    return JSON.stringify(emergencyResponse, null, 2);
  }
}

/**
 * 修复DeepSeek被截断的JSON响应
 * 智能补全不完整的JSON结构
 */
function repairTruncatedDeepSeekJson(partialJson: string, fullResponse: string): string | null {
  try {
    console.log('🔧 开始修复截断的DeepSeek JSON...');
    console.log('📏 部分JSON长度:', partialJson.length);
    console.log('📄 完整响应长度:', fullResponse.length);
    
    let repairedJson = partialJson.trim();
    
    // 1. 检查JSON的基本结构
    const hasObjectStart = repairedJson.includes('{');
    const hasArrayStart = repairedJson.includes('[');
    
    if (!hasObjectStart && !hasArrayStart) {
      console.log('❌ 未找到有效的JSON起始结构');
      return null;
    }
    
    // 2. 分析可能的错误模式和缺失的结构
    console.log('🔍 分析JSON结构...');
    
    // 2.1 检查是否有errors数组的开始
    const errorsArrayMatch = repairedJson.match(/("errors"\s*:\s*\[)/);
    if (errorsArrayMatch) {
      console.log('✓ 找到errors数组起始');
      
      // 检查数组是否被截断
      const errorsStartIndex = repairedJson.indexOf(errorsArrayMatch[0]);
      const afterErrorsStart = repairedJson.substring(errorsStartIndex + errorsArrayMatch[0].length);
      
      // 统计已有的错误对象
      const errorObjects = [];
      let currentPos = 0;
      let braceCount = 0;
      let currentErrorStart = -1;
      
      for (let i = 0; i < afterErrorsStart.length; i++) {
        const char = afterErrorsStart[i];
        
        if (char === '{') {
          if (braceCount === 0) {
            currentErrorStart = i;
          }
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0 && currentErrorStart !== -1) {
            const errorObj = afterErrorsStart.substring(currentErrorStart, i + 1);
            try {
              JSON.parse(errorObj);
              errorObjects.push(errorObj);
            } catch (e) {
              console.log('⚠️ 发现不完整的错误对象，尝试修复...');
              const repairedErrorObj = repairSingleErrorObject(errorObj);
              if (repairedErrorObj) {
                errorObjects.push(repairedErrorObj);
              }
            }
            currentErrorStart = -1;
          }
        }
      }
      
      console.log(`📊 找到 ${errorObjects.length} 个错误对象`);
      
      // 3. 如果有有效的错误对象，重构完整的JSON
      if (errorObjects.length > 0) {
        const reconstructedJson = {
          errors: errorObjects.map((objStr, index) => {
            try {
              return JSON.parse(objStr);
            } catch (e) {
              // 提供默认错误对象
              return {
                id: `repaired_${Date.now()}_${index}`,
                type: 'suggestion',
                position: { start: index * 30, end: (index + 1) * 30 },
                original: '截断恢复的内容',
                suggestion: '建议重新分析此部分内容',
                reason: '从截断的JSON中恢复',
                category: '恢复项'
              };
            }
          })
        };
        
        console.log('✅ 成功重构JSON结构');
        return JSON.stringify(reconstructedJson, null, 2);
      }
    }
    
    // 4. 尝试从完整响应中提取think内容进行应急处理
    if (fullResponse.includes('<think>')) {
      console.log('🆘 尝试从完整响应的think内容生成应急JSON...');
      return generateEmergencyJsonFromThink(fullResponse);
    }
    
    // 5. 最后的修复尝试 - 简单的括号平衡
    const balancedJson = balanceBrackets(repairedJson);
    if (balancedJson && balancedJson !== repairedJson) {
      try {
        JSON.parse(balancedJson);
        console.log('✅ 通过括号平衡修复成功');
        return balancedJson;
      } catch (e) {
        console.log('⚠️ 括号平衡修复后仍有JSON格式问题');
      }
    }
    
    console.log('❌ 无法修复截断的JSON');
    return null;
    
  } catch (error) {
    console.error('❌ JSON修复过程异常:', error);
    return null;
  }
}

/**
 * 修复单个错误对象
 */
function repairSingleErrorObject(errorObjStr: string): string | null {
  try {
    let repaired = errorObjStr.trim();
    
    // 确保有结束大括号
    if (!repaired.endsWith('}')) {
      repaired += '}';
    }
    
    // 基本的引号修复
    repaired = repaired.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    
    // 修复缺少引号的字符串值
    repaired = repaired.replace(/:\s*([^"{\[\d,}\s][^,}]*)\s*([,}])/g, (match, value, ending) => {
      const trimmedValue = value.trim();
      if (!/^(true|false|null|\d+)$/.test(trimmedValue) && !trimmedValue.startsWith('"')) {
        return `: "${trimmedValue}"${ending}`;
      }
      return match;
    });
    
    // 移除多余的逗号
    repaired = repaired.replace(/,(\s*})/g, '$1');
    
    try {
      JSON.parse(repaired);
      return repaired;
    } catch (e) {
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * 平衡JSON字符串中的括号
 */
function balanceBrackets(jsonStr: string): string {
  let result = jsonStr;
  
  // 统计大括号
  const openBraces = (result.match(/{/g) || []).length;
  const closeBraces = (result.match(/}/g) || []).length;
  
  // 统计方括号
  const openBrackets = (result.match(/\[/g) || []).length;
  const closeBrackets = (result.match(/\]/g) || []).length;
  
  // 补充缺少的闭合括号
  if (openBraces > closeBraces) {
    result += '}'.repeat(openBraces - closeBraces);
  }
  
  if (openBrackets > closeBrackets) {
    result += ']'.repeat(openBrackets - closeBrackets);
  }
  
  return result;
}
