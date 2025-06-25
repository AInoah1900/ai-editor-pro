#!/usr/bin/env node

/**
 * 调试DeepSeek API调用问题
 */

console.log('🔍 调试DeepSeek API调用问题');
console.log('=' .repeat(50));

const testContent = '这个研究研究了重要问题。实验实验结果显示性能提升。';

// 模拟增强的提示词
const enhancedPrompt = `请作为专业的academic领域期刊编辑，对以下文档进行精确校对和修改建议。

📚 知识库使用情况：
- 专属知识库：2 条专业知识
- 共享知识库：2 条通用知识  
- 相关专属文档：0 个
- 相关共享文档：0 个
- 总计应用知识：4 条

🎯 领域分析：academic (置信度: 1)
🔑 关键词：研究, 实验

🔒 专属知识库 (优先级高，个人定制)：
1. [rule] 学术论文应当使用客观、严谨的语言，避免主观色彩过强的表达。
   💡 应用场景: 学术写作中的语言表达规范
   📊 置信度: 🔴高 (0.9)
   🏷️ 标签: 学术写作, 语言规范, 客观性
   📍 来源: 学术写作指南

2. [rule] 定量研究方法适用于需要数据统计分析的研究问题，强调客观性和可重复性。
   💡 应用场景: 研究方法选择和描述
   📊 置信度: 🔴高 (0.85)
   🏷️ 标签: 研究方法, 定量分析, 统计
   📍 来源: 研究方法论

🌐 共享知识库 (通用规范)：
1. [rule] 学术论文应当使用客观、严谨的语言，避免主观色彩过强的表达。
   💡 应用场景: 学术写作中的语言表达规范
   📊 置信度: 🔴高 (0.9)
   🏷️ 标签: 学术写作, 语言规范, 客观性
   📍 来源: 学术写作指南

2. [rule] 定量研究方法适用于需要数据统计分析的研究问题，强调客观性和可重复性。
   💡 应用场景: 研究方法选择和描述
   📊 置信度: 🔴高 (0.85)
   🏷️ 标签: 研究方法, 定量分析, 统计
   📍 来源: 研究方法论

📋 校对要求：
1. 优先应用专属知识库中的个人定制规则
2. 结合共享知识库的通用规范
3. 确保术语使用的准确性和一致性
4. 关注学术写作的规范性
5. 提供具体的修改建议和理由

📝 待校对文档：
${testContent}

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

async function testDirectDeepSeekCall() {
  console.log('🤖 测试直接DeepSeek API调用...');
  
  try {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的academic领域期刊编辑和校对专家。你拥有深厚的学术背景和丰富的编辑经验。

基于以下专业知识库进行精确校对：
• 学术论文应当使用客观、严谨的语言，避免主观色彩过强的表达。 (rule, 置信度: 0.9)
• 定量研究方法适用于需要数据统计分析的研究问题，强调客观性和可重复性。 (rule, 置信度: 0.85)

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
        max_tokens: 2500,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content;
    
    console.log('📋 DeepSeek响应信息:');
    console.log('- 响应长度:', aiResponse?.length || 0);
    console.log('- 包含think标签:', aiResponse?.includes('<think>') ? '是' : '否');
    console.log('- 包含JSON结构:', aiResponse?.includes('{') && aiResponse?.includes('}') ? '是' : '否');
    console.log('- 包含errors字段:', aiResponse?.includes('errors') ? '是' : '否');
    
    console.log('\n📝 完整响应内容:');
    console.log(aiResponse);
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ 直接API调用失败:', error.message);
    return null;
  }
}

async function testSimplePrompt() {
  console.log('\n🎯 测试简化的JSON prompt...');
  
  try {
    const simplePrompt = `请分析以下文档并返回JSON格式的错误和建议：

文档内容："这个研究研究了重要问题。实验实验结果显示性能提升。"

请严格按照以下JSON格式返回，不要包含任何其他内容：
{
  "errors": [
    {
      "type": "error",
      "original": "原文片段",
      "suggestion": "修改建议",
      "reason": "修改理由",
      "category": "错误类别",
      "position": {"start": 0, "end": 10}
    }
  ]
}`;

    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的文档校对助手。请严格按照用户要求的JSON格式返回结果，不要添加任何其他内容。'
          },
          {
            role: 'user',
            content: simplePrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content;
    
    console.log('📋 简化prompt响应信息:');
    console.log('- 响应长度:', aiResponse?.length || 0);
    console.log('- 包含think标签:', aiResponse?.includes('<think>') ? '是' : '否');
    console.log('- 包含JSON结构:', aiResponse?.includes('{') && aiResponse?.includes('}') ? '是' : '否');
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ 简化prompt测试失败:', error.message);
    return null;
  }
}

async function testJsonExtraction(aiResponse) {
  if (!aiResponse) {
    console.log('❌ 没有响应内容可供提取');
    return null;
  }
  
  console.log('\n🔧 测试JSON提取过程...');
  
  try {
    let processedResponse = aiResponse.trim();
    console.log('1. 原始响应长度:', processedResponse.length);
    
    // Unicode解码
    processedResponse = processedResponse.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
      return String.fromCharCode(parseInt(code, 16));
    });
    console.log('2. Unicode解码后长度:', processedResponse.length);
    
    // 移除think标签
    if (processedResponse.includes('<think>')) {
      processedResponse = processedResponse.replace(/<think>[\s\S]*?<\/think>/gi, '');
      console.log('3. 移除think标签后长度:', processedResponse.length);
    }
    
    // 处理markdown代码块
    if (processedResponse.includes('```')) {
      const codeBlockMatch = processedResponse.match(/```(?:json)?\s*([\s\S]*?)```/i);
      if (codeBlockMatch) {
        processedResponse = codeBlockMatch[1].trim();
        console.log('4. 提取代码块后长度:', processedResponse.length);
      }
    }
    
    // 查找JSON边界
    const objectStart = processedResponse.indexOf('{');
    const objectEnd = processedResponse.lastIndexOf('}');
    const arrayStart = processedResponse.indexOf('[');
    const arrayEnd = processedResponse.lastIndexOf(']');
    
    let jsonStart = -1;
    let jsonEnd = -1;
    let jsonType = '';
    
    if (objectStart !== -1 && (arrayStart === -1 || objectStart < arrayStart)) {
      jsonStart = objectStart;
      jsonEnd = objectEnd;
      jsonType = 'object';
    } else if (arrayStart !== -1) {
      jsonStart = arrayStart;
      jsonEnd = arrayEnd;
      jsonType = 'array';
    }
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      processedResponse = processedResponse.substring(jsonStart, jsonEnd + 1);
      console.log(`5. 找到JSON${jsonType}边界，长度:`, processedResponse.length);
    } else {
      console.log('5. ❌ 未找到JSON边界');
      console.log('🔍 处理后的内容前500字符:', processedResponse.substring(0, 500));
      return null;
    }
    
    console.log('\n📦 提取的JSON内容:');
    console.log(processedResponse);
    
    // 尝试解析
    const parsed = JSON.parse(processedResponse);
    console.log('\n✅ JSON解析成功!');
    
    let errors = [];
    if (Array.isArray(parsed)) {
      errors = parsed;
    } else if (parsed.errors && Array.isArray(parsed.errors)) {
      errors = parsed.errors;
    }
    
    console.log(`📊 发现 ${errors.length} 个错误项:`);
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. [${error.type}] ${error.original} → ${error.suggestion}`);
      console.log(`     原因: ${error.reason}`);
      console.log(`     类别: ${error.category}`);
    });
    
    return processedResponse;
    
  } catch (error) {
    console.error('❌ JSON提取失败:', error.message);
    console.log('🔍 处理后的内容:', processedResponse?.substring(0, 500));
    return null;
  }
}

async function testDualClientCall() {
  console.log('\n🔄 测试双客户端调用...');
  
  try {
    // 跳过双客户端测试，直接测试更简单的prompt
    console.log('⚠️ 跳过双客户端测试，改为测试简化的prompt');
    return await testSimplePrompt();
    
  } catch (error) {
    console.error('❌ 双客户端调用失败:', error.message);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 开始调试DeepSeek API问题...\n');
    
    // 1. 测试直接API调用
    const directResponse = await testDirectDeepSeekCall();
    
    if (directResponse) {
      // 2. 测试JSON提取
      const extractedJson = await testJsonExtraction(directResponse);
      
      if (extractedJson) {
        console.log('\n✅ 直接API调用和JSON提取都成功');
      } else {
        console.log('\n❌ JSON提取失败');
      }
    } else {
      console.log('\n❌ 直接API调用失败');
    }
    
    // 3. 测试简化prompt
    const simpleResponse = await testDualClientCall();
    
    if (simpleResponse) {
      console.log('\n✅ 简化prompt调用成功');
      await testJsonExtraction(simpleResponse);
    } else {
      console.log('\n❌ 简化prompt调用失败');
    }
    
    // 4. 总结
    console.log('\n📊 调试总结:');
    console.log('=' .repeat(30));
    console.log(`🤖 直接API调用: ${directResponse ? '成功' : '失败'}`);
    console.log(`🎯 简化prompt调用: ${simpleResponse ? '成功' : '失败'}`);
    
    if (directResponse && !simpleResponse) {
      console.log('\n💡 问题可能在prompt的复杂度');
    } else if (!directResponse) {
      console.log('\n💡 问题可能在本地API服务本身');
    } else {
      console.log('\n💡 两种调用方式都正常，问题可能在JSON格式要求');
    }
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 