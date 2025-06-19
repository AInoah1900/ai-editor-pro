import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeRetriever, DomainClassifier } from '@/lib/rag/knowledge-retriever';

// 从环境变量中获取API配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

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
}

export async function POST(request: NextRequest) {
  console.log('开始RAG增强文档分析...');
  
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: '文档内容不能为空' }, { status: 400 });
    }

    // 1. 初始化RAG组件
    const domainClassifier = new DomainClassifier();
    const knowledgeRetriever = new KnowledgeRetriever();

    // 2. 识别文档领域
    console.log('正在识别文档领域...');
    const domainInfo = await domainClassifier.identifyDomain(content);
    console.log('领域识别结果:', domainInfo);

    // 3. 检索相关知识
    console.log('正在检索相关知识...');
    const relevantKnowledge = await knowledgeRetriever.retrieveRelevantKnowledge(
      content,
      domainInfo.domain,
      undefined, // 不限制知识类型
      8 // 获取更多相关知识
    );
    console.log(`检索到 ${relevantKnowledge.length} 条相关知识`);

    // 4. 构建增强的提示词
    const enhancedPrompt = buildEnhancedPrompt(content, relevantKnowledge, domainInfo);

    let ragResult: RAGEnhancedResult;

    // 5. 尝试调用DeepSeek API进行RAG增强分析
    if (DEEPSEEK_API_KEY) {
      try {
        console.log('正在调用DeepSeek API进行RAG增强分析...');
        
        // 使用新的DeepSeek客户端
        const { createDeepSeekClient } = await import('@/lib/deepseek/deepseek-client');
        const deepSeekClient = createDeepSeekClient(DEEPSEEK_API_KEY);
        
        const response = await deepSeekClient.createChatCompletion({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `你是一个专业的${domainInfo.domain}领域期刊编辑和校对专家。你拥有深厚的学术背景和丰富的编辑经验。

基于以下专业知识库进行精确校对：
${formatKnowledge(relevantKnowledge)}

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
          max_tokens: 4000,
          stream: false
        });

        const aiResponse = response.choices[0]?.message?.content;
          
        if (aiResponse) {
            const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
            const parsedResult = JSON.parse(cleanedResponse);
            
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
                  id: error.id || `rag_error_${Date.now()}_${index}`,
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
                knowledge_used: relevantKnowledge.map(k => k.content),
                rag_confidence: calculateRAGConfidence(relevantKnowledge, domainInfo),
                fallback_used: false
              };

              // 6. 学习用户交互（这里可以在用户操作后调用）
              console.log('RAG增强分析完成');
              return NextResponse.json(ragResult);
            }
        }
        
        console.warn('DeepSeek API调用失败，降级到本地RAG分析');
      } catch (apiError) {
        console.error('DeepSeek API错误:', apiError);
      }
    }

    // 7. 降级到本地RAG增强分析
    console.log('使用本地RAG增强分析...');
    const localErrors = await generateRAGEnhancedErrors(content, relevantKnowledge, domainInfo);
    
    ragResult = {
      errors: localErrors,
      domain_info: domainInfo,
      knowledge_used: relevantKnowledge.map(k => k.content),
      rag_confidence: calculateRAGConfidence(relevantKnowledge, domainInfo),
      fallback_used: true
    };

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
      console.error('降级方案也失败:', fallbackError);
    }
    
    return NextResponse.json({
      error: 'RAG增强分析失败',
      errors: [],
      domain_info: { domain: 'unknown', confidence: 0, keywords: [] },
      knowledge_used: [],
      rag_confidence: 0,
      fallback_used: true
    }, { status: 500 });
  }
}

/**
 * 构建增强的提示词
 */
function buildEnhancedPrompt(
  content: string,
  knowledge: KnowledgeItem[],
  domainInfo: DomainInfo
): string {
  const knowledgeContext = knowledge.length > 0 
    ? knowledge.map(k => `- ${k.content} (相关度: ${((k.relevance_score || 0) * 100).toFixed(0)}%)`).join('\n')
    : '暂无相关专业知识';

  return `
请基于${domainInfo.domain}领域的专业知识对以下文档进行精确校对。

检测到的领域信息：
- 领域: ${domainInfo.domain}
- 置信度: ${(domainInfo.confidence * 100).toFixed(0)}%
- 关键词: ${domainInfo.keywords.join(', ')}

相关专业知识参考：
${knowledgeContext}

请特别注意以下方面：
1. 只标注具体有问题的词汇或短语，不要标注整个句子
2. 专业术语的准确性和规范性（基于知识库中的术语标准）
3. 领域特定的表达习惯和写作规范
4. 学术写作的格式要求和引用规范
5. 基于相似案例的修改建议

错误类型说明：
- error: 确定的错误，必须修改（如重复词汇、明显语法错误、术语错误）
- warning: 疑似错误，建议修改（如标点使用、表达方式、术语不够规范）
- suggestion: 优化建议，可以改进（如长句分解、表达优化、术语标准化）

待校对文档：
${content}

请按照以下JSON格式返回结果：
{
  "errors": [
    {
      "id": "唯一标识符",
      "type": "error|warning|suggestion",
      "original": "确切的错误文字",
      "suggestion": "修改建议",
      "reason": "错误原因说明（结合专业知识）",
      "category": "错误类别"
    }
  ]
}

请确保original字段精确匹配文档中的错误文字，并基于专业知识库提供准确的修改建议。
`;
}

/**
 * 格式化知识库内容
 */
function formatKnowledge(knowledge: KnowledgeItem[]): string {
  if (knowledge.length === 0) {
    return '暂无相关专业知识';
  }

  return knowledge.map(k => 
    `【${k.type}】${k.content} (来源: ${k.source}, 领域: ${k.domain})`
  ).join('\n');
}

/**
 * 计算RAG置信度
 */
function calculateRAGConfidence(knowledge: KnowledgeItem[], domainInfo: DomainInfo): number {
  if (knowledge.length === 0) return 0.3;
  
  const avgRelevance = knowledge.reduce((sum, k) => sum + (k.relevance_score || 0), 0) / knowledge.length;
  const domainConfidence = domainInfo.confidence;
  const knowledgeCount = Math.min(knowledge.length / 5, 1); // 归一化到0-1
  
  return (avgRelevance * 0.4 + domainConfidence * 0.4 + knowledgeCount * 0.2);
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
  
  // 1. 基础错误检测（重复词汇等）
  const basicErrors = generateBasicErrors(content);
  errors.push(...basicErrors);

  // 2. 基于知识库的术语检查
  const terminologyErrors = checkTerminologyWithKnowledge(content, knowledge);
  errors.push(...terminologyErrors);

  // 3. 领域特定的检查
  const domainErrors = checkDomainSpecificIssues(content, domainInfo.domain);
  errors.push(...domainErrors);

  return errors.slice(0, 15); // 限制错误数量
}

/**
 * 基础错误检测
 */
function generateBasicErrors(content: string): ErrorItem[] {
  const errors: ErrorItem[] = [];
  
  // 检测重复词汇
  const duplicatePattern = /(\S{2,}?)\1+/g;
  let match;
  while ((match = duplicatePattern.exec(content)) !== null && errors.length < 8) {
    const duplicateText = match[0];
    const singleText = match[1];
    
    errors.push({
      id: `basic_duplicate_${match.index}`,
      type: 'error',
      position: { start: match.index, end: match.index + duplicateText.length },
      original: duplicateText,
      suggestion: singleText,
      reason: `检测到重复词汇"${singleText}"，这在学术写作中是不规范的`,
      category: '语法错误'
    });
  }

  // 检测重复标点
  const punctPattern = /([？。！，；：])\1+/g;
  while ((match = punctPattern.exec(content)) !== null && errors.length < 10) {
    errors.push({
      id: `basic_punct_${match.index}`,
      type: 'warning',
      position: { start: match.index, end: match.index + match[0].length },
      original: match[0],
      suggestion: match[1],
      reason: `重复使用标点符号"${match[1]}"，建议删除多余部分`,
      category: '标点错误'
    });
  }

  return errors;
}

/**
 * 基于知识库的术语检查
 */
function checkTerminologyWithKnowledge(content: string, knowledge: KnowledgeItem[]): ErrorItem[] {
  const errors: ErrorItem[] = [];
  
  // 检查是否包含知识库中的术语纠错案例
  knowledge.forEach(k => {
    if (k.type === 'case' && k.content.includes('→')) {
      const caseMatch = k.content.match(/原文："([^"]+)".*修正："([^"]+)"/);
      if (caseMatch) {
        const [, wrongTerm, correctTerm] = caseMatch;
        const position = content.indexOf(wrongTerm);
        if (position !== -1) {
          errors.push({
            id: `terminology_${Date.now()}_${position}`,
            type: 'error',
            position: { start: position, end: position + wrongTerm.length },
            original: wrongTerm,
            suggestion: correctTerm,
            reason: `基于知识库案例，"${wrongTerm}"应改为"${correctTerm}"`,
            category: '术语规范'
          });
        }
      }
    }
  });

  return errors;
}

/**
 * 领域特定问题检查
 */
function checkDomainSpecificIssues(content: string, domain: string): ErrorItem[] {
  const errors: ErrorItem[] = [];
  
  // 根据不同领域检查特定问题
  switch (domain) {
    case 'physics':
      // 物理学特定检查
      if (content.includes('量子状态')) {
        const pos = content.indexOf('量子状态');
        errors.push({
          id: `physics_term_${pos}`,
          type: 'suggestion',
          position: { start: pos, end: pos + 4 },
          original: '量子状态',
          suggestion: '量子态',
          reason: '在量子力学中，更准确的术语是"量子态"而非"量子状态"',
          category: '术语规范'
        });
      }
      break;
      
    case 'chemistry':
      // 化学特定检查
      if (content.includes('催化素')) {
        const pos = content.indexOf('催化素');
        errors.push({
          id: `chemistry_term_${pos}`,
          type: 'error',
          position: { start: pos, end: pos + 3 },
          original: '催化素',
          suggestion: '催化剂',
          reason: '"催化素"不是标准化学术语，应使用"催化剂"',
          category: '术语错误'
        });
      }
      break;
      
    case 'biology':
      // 生物学特定检查
      if (content.includes('脱氧核糖核酸')) {
        const pos = content.indexOf('脱氧核糖核酸');
        if (!content.includes('DNA')) {
          errors.push({
            id: `biology_abbr_${pos}`,
            type: 'suggestion',
            position: { start: pos, end: pos + 6 },
            original: '脱氧核糖核酸',
            suggestion: 'DNA（脱氧核糖核酸）',
            reason: '首次出现时建议使用"DNA（脱氧核糖核酸）"的标准格式',
            category: '术语规范'
          });
        }
      }
      break;
  }
  
  return errors;
}

/**
 * 计算错误位置
 */
function calculateErrorPosition(content: string, original: string, index: number): { start: number; end: number } {
  if (!original || !content) {
    return { start: index * 10, end: index * 10 + 5 };
  }

  const position = content.indexOf(original);
  if (position !== -1) {
    return {
      start: position,
      end: position + original.length
    };
  }

  const estimatedPosition = Math.min(index * 20, content.length - 10);
  return {
    start: estimatedPosition,
    end: Math.min(estimatedPosition + original.length, content.length)
  };
} 