#!/usr/bin/env node

/**
 * 专门测试DeepSeek JSON解析功能
 */

console.log('🔧 测试DeepSeek JSON解析功能');
console.log('=' .repeat(50));

async function getDeepSeekRawResponse() {
  console.log('🔍 获取DeepSeek原始响应...');
  
  try {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        messages: [{
          role: 'user',
          content: `请分析以下文档并以JSON格式返回错误和建议：

文档内容：
这个研究研究了重要的问题问题。实验实验结果显示显示了显著的性能提升。

请返回JSON格式，包含errors数组，每个错误项包含：
- type: "error" | "warning" | "suggestion"
- original: 原始文本
- suggestion: 建议修改
- reason: 修改原因
- category: 错误类别
- position: {start: 数字, end: 数字}

只返回JSON，不要其他文字。`
        }],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;
    
    console.log('📋 DeepSeek原始响应:');
    console.log('- 响应长度:', content.length);
    console.log('- 包含think标签:', content.includes('<think>') ? '是' : '否');
    console.log('- 包含JSON结构:', content.includes('{') && content.includes('}') ? '是' : '否');
    console.log('\n📝 完整响应内容:');
    console.log(content);
    
    return content;
  } catch (error) {
    console.error('❌ 获取DeepSeek响应失败:', error.message);
    return null;
  }
}

// 模拟API中的JSON提取函数
function extractCompleteJsonFromResponse(aiResponse) {
  try {
    let processedResponse = aiResponse.trim();
    console.log('\n🔍 开始JSON提取，原始响应长度:', processedResponse.length);
    console.log('📝 原始响应前200字符:', processedResponse.substring(0, 200));
    
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
    
    // 2. 处理OpenAI兼容格式的响应
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
    
    // 3. 处理包含<think>标签的响应（增强版）
    console.log('🧠 处理DeepSeek思考标签...');
    
    // 处理各种形式的think标签
    const thinkPatterns = [
      /<think>[\s\S]*?<\/think>/gi,          // 标准think标签
      /<think>[\s\S]*$/gi,                    // 未闭合的think标签（从think开始到结尾）
    ];
    
    for (const pattern of thinkPatterns) {
      if (pattern.test(processedResponse)) {
        console.log(`📝 检测到think标签模式: ${pattern.source}`);
        processedResponse = processedResponse.replace(pattern, '');
        console.log('✂️ 移除think标签后长度:', processedResponse.length);
      }
    }
    
    // 移除其他可能的标签
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
    
    // 4. 查找JSON边界
    console.log('🎯 查找JSON边界...');
    const jsonStartIndex = processedResponse.indexOf('{');
    const jsonEndIndex = processedResponse.lastIndexOf('}');
    
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
      processedResponse = processedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      console.log('🎯 找到JSON边界，长度:', processedResponse.length);
    } else {
      console.warn('⚠️ 未能找到JSON对象边界');
      return null;
    }
    
    console.log('📝 提取的JSON内容:');
    console.log(processedResponse);
    
    // 5. 验证JSON有效性
    try {
      const parsed = JSON.parse(processedResponse);
      console.log('✅ JSON解析成功');
      console.log('📊 包含errors数组:', Array.isArray(parsed.errors) ? '是' : '否');
      if (Array.isArray(parsed.errors)) {
        console.log('📊 errors数量:', parsed.errors.length);
        parsed.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. [${error.type}] ${error.original} → ${error.suggestion}`);
        });
      }
      return processedResponse;
    } catch (parseError) {
      console.error('❌ JSON解析失败:', parseError.message);
      console.log('🔍 尝试修复JSON...');
      
      // 简单修复尝试
      let fixedJson = processedResponse;
      
      // 修复常见问题
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1'); // 移除多余逗号
      fixedJson = fixedJson.replace(/"/g, '"').replace(/"/g, '"'); // 修复中文引号
      
      try {
        const fixedParsed = JSON.parse(fixedJson);
        console.log('✅ JSON修复成功');
        return fixedJson;
      } catch (fixError) {
        console.error('❌ JSON修复也失败:', fixError.message);
        return null;
      }
    }
    
  } catch (error) {
    console.error('💥 JSON提取过程异常:', error.message);
    return null;
  }
}

async function testRAGAPIWithDeepSeek() {
  console.log('\n🔍 测试RAG API是否能正确处理DeepSeek响应...');
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '这个研究研究了重要的问题问题。实验实验结果显示显示了显著的性能提升。'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('📋 RAG API响应:');
    console.log('- 有errors数组:', Array.isArray(result.errors) ? '是' : '否');
    console.log('- errors数量:', result.errors?.length || 0);
    console.log('- 降级模式:', result.fallback_used ? '是' : '否');
    console.log('- 领域:', result.domain_info?.domain || '未知');
    
    if (result.errors && result.errors.length > 0) {
      console.log('📝 发现的问题:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.original} → ${error.suggestion}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ RAG API测试失败:', error.message);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 开始DeepSeek JSON解析测试...\n');
    
    // 1. 获取DeepSeek原始响应
    const rawResponse = await getDeepSeekRawResponse();
    
    if (!rawResponse) {
      console.log('❌ 无法获取DeepSeek响应，测试终止');
      return;
    }
    
    // 2. 测试JSON提取功能
    const extractedJson = extractCompleteJsonFromResponse(rawResponse);
    
    if (extractedJson) {
      console.log('\n✅ JSON提取成功！');
    } else {
      console.log('\n❌ JSON提取失败');
    }
    
    // 3. 测试RAG API
    const ragResult = await testRAGAPIWithDeepSeek();
    
    // 4. 总结
    console.log('\n📊 测试总结:');
    console.log('=' .repeat(30));
    console.log(`🤖 DeepSeek响应: ${rawResponse ? '正常' : '异常'}`);
    console.log(`🔧 JSON提取: ${extractedJson ? '成功' : '失败'}`);
    console.log(`🌐 RAG API: ${ragResult ? '正常' : '异常'}`);
    
    if (rawResponse && extractedJson && ragResult) {
      console.log('\n🎉 所有测试通过！DeepSeek JSON解析功能工作正常！');
      console.log('💡 系统能够正确处理包含think标签的复杂响应');
    } else {
      console.log('\n⚠️ 存在问题需要修复');
      
      if (!rawResponse) {
        console.log('🔧 检查DeepSeek本地API连接');
      }
      if (!extractedJson) {
        console.log('🔧 检查JSON提取逻辑');
      }
      if (!ragResult) {
        console.log('🔧 检查RAG API集成');
      }
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 