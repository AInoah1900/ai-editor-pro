import { NextRequest, NextResponse } from 'next/server';
import { NewKnowledgeRetriever, DomainClassifier } from '@/lib/rag/new-knowledge-retriever';

// 从环境变量中获取API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

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
        
        // 使用新的DeepSeek客户端
        const { createDeepSeekClient } = await import('@/lib/deepseek/deepseek-client');
        const deepSeekClient = createDeepSeekClient(DEEPSEEK_API_KEY, {
          timeout: 20000, // 减少到20秒超时
          maxRetries: 2   // 减少重试次数
        });
        
        // 设置更合理的超时控制
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('DeepSeek API调用超时')), 25000); // 25秒超时
        });

        const apiPromise = deepSeekClient.createChatCompletion({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `你是一个专业的${domainInfo.domain}领域期刊编辑和校对专家。你拥有深厚的学术背景和丰富的编辑经验。

基于以下专业知识库进行精确校对：
${formatKnowledge(multiKnowledgeResult.combined_knowledge)}

请特别关注：
1. 领域特定术语的准确性和规范性
2. 学术写作的表达习惯和格式要求
3. 基于相似案例的修改建议
4. 上下文的合理性和逻辑性

请严格按照要求的JSON格式返回结果。`
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2500, // 进一步减少token数量，提高响应速度
          stream: false
        });

        console.log('正在调用DeepSeek API...');
        const response = await Promise.race([apiPromise, timeoutPromise]) as any;

        const aiResponse = response.choices[0]?.message?.content;
          
        if (aiResponse) {
          try {
            // 清理响应，移除可能的markdown格式
            const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
            
            // 检查响应是否为空或不完整
            if (!cleanedResponse || cleanedResponse.length < 10) {
              throw new Error('API响应为空或过短');
            }
            
            // 尝试修复不完整的JSON
            let jsonToProcess = cleanedResponse;
            
            // 如果JSON不完整，尝试补全
            if (!jsonToProcess.endsWith('}') && !jsonToProcess.endsWith(']')) {
              console.warn('检测到不完整的JSON响应，尝试修复...');
              
              // 简单的JSON修复逻辑
              const openBraces = (jsonToProcess.match(/\{/g) || []).length;
              const closeBraces = (jsonToProcess.match(/\}/g) || []).length;
              const openBrackets = (jsonToProcess.match(/\[/g) || []).length;
              const closeBrackets = (jsonToProcess.match(/\]/g) || []).length;
              
              // 补全缺失的括号
              for (let i = 0; i < openBrackets - closeBrackets; i++) {
                jsonToProcess += ']';
              }
              for (let i = 0; i < openBraces - closeBraces; i++) {
                jsonToProcess += '}';
              }
            }
            
            const parsedResult = JSON.parse(jsonToProcess);
            
            if (parsedResult.errors && Array.isArray(parsedResult.errors)) {
              const enhancedErrors = parsedResult.errors.map((error: {
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
                  private_documents: multiKnowledgeResult.private_documents,
                  shared_documents: multiKnowledgeResult.shared_documents
                }
              };

              // 6. 学习用户交互（这里可以在用户操作后调用）
              console.log('RAG增强分析完成');
              return NextResponse.json(ragResult);
            } else {
              console.warn('DeepSeek API返回的结果格式不正确:', parsedResult);
              throw new Error('API返回格式不正确');
            }
          } catch (jsonError) {
            console.error('JSON解析错误:', jsonError);
            console.error('原始响应:', aiResponse);
            throw new Error('JSON解析失败');
          }
        }
        
        console.warn('DeepSeek API调用失败，降级到本地RAG分析');
      } catch (apiError) {
        const errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error';
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
        private_count: 0,
        shared_count: 0,
        total_count: 0
      },
      document_sources: {
        private_documents: [],
        shared_documents: []
      }
    };

    console.log(`✅ 本地RAG分析完成，发现 ${localErrors.length} 个问题`);
    return NextResponse.json(ragResult);

  } catch (error) {
    console.error('RAG增强分析失败:', error);
    
    // 最终降级到原有方法
    try {
      const { content } = await request.json();
      const fallbackResponse = await fetch(`${request.nextUrl.origin}/api/analyze-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (fallbackResponse.ok) {
        const fallbackResult = await fallbackResponse.json();
        return NextResponse.json({
          ...fallbackResult,
          domain_info: { domain: 'unknown', confidence: 0, keywords: [] },
          knowledge_used: [],
          rag_confidence: 0,
          fallback_used: true
        });
      }
    } catch (fallbackError) {
      console.error('降级分析也失败:', fallbackError);
    }
    
    return NextResponse.json({
      error: 'RAG增强分析失败',
      domain_info: { domain: 'unknown', confidence: 0, keywords: [] },
      knowledge_used: [],
      rag_confidence: 0,
      fallback_used: true
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
  const { private_knowledge, shared_knowledge, combined_knowledge, private_documents, shared_documents } = multiKnowledgeResult;
  
  // 构建知识库信息摘要
  const knowledgeSummary = `
📚 知识库使用情况：
- 专属知识库：${private_knowledge.length} 条专业知识
- 共享知识库：${shared_knowledge.length} 条通用知识  
- 相关专属文档：${private_documents.length} 个
- 相关共享文档：${shared_documents.length} 个
- 总计应用知识：${combined_knowledge.length} 条

🎯 领域分析：${domainInfo.domain} (置信度: ${domainInfo.confidence})
🔑 关键词：${domainInfo.keywords.join(', ')}
`;

  const privateKnowledgeSection = private_knowledge.length > 0 ? `
🔒 专属知识库 (优先级高，个人定制)：
${formatKnowledgeWithSource(private_knowledge, '专属')}
` : '';

  const sharedKnowledgeSection = shared_knowledge.length > 0 ? `
🌐 共享知识库 (通用规范)：
${formatKnowledgeWithSource(shared_knowledge, '共享')}
` : '';

  const documentContext = (private_documents.length > 0 || shared_documents.length > 0) ? `
📄 相关文档参考：
${private_documents.length > 0 ? `专属文档：${private_documents.map(d => d.filename).join(', ')}` : ''}
${shared_documents.length > 0 ? `共享文档：${shared_documents.map(d => d.filename).join(', ')}` : ''}
` : '';

  return `请作为专业的${domainInfo.domain}领域期刊编辑，对以下文档进行精确校对和修改建议。

${knowledgeSummary}

${privateKnowledgeSection}

${sharedKnowledgeSection}

${documentContext}

📋 校对要求：
1. 优先应用专属知识库中的个人定制规则
2. 结合共享知识库的通用规范
3. 确保术语使用的准确性和一致性
4. 关注学术写作的规范性
5. 提供具体的修改建议和理由

📝 待校对文档：
${content}

请严格按照以下JSON格式返回结果：
{
  "errors": [
    {
      "type": "error|warning|suggestion",
      "original": "原文内容",
      "suggestion": "修改建议", 
      "reason": "修改理由（说明来源：专属知识库/共享知识库）",
      "category": "错误类别",
      "position": {"start": 起始位置, "end": 结束位置}
    }
  ]
}`;
}

/**
 * 格式化带来源标识的知识
 */
function formatKnowledgeWithSource(knowledge: KnowledgeItem[], source: string): string {
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