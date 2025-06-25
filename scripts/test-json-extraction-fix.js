#!/usr/bin/env node

/**
 * 专门测试JSON解析功能的脚本
 */

console.log('🔧 测试JSON解析功能修复');
console.log('=' .repeat(50));

// 测试用的问题文档
const testDocument = `
学术论文摘要：本研究研究了量子计算在机器学习中的应用。
实验实验结果显示显示了显著的性能提升。
数据数据分析表明该方法可行。
`;

async function testDirectLocalAPI() {
  console.log('🔍 直接测试本地API响应格式...');
  
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
${testDocument}

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
    console.log('📋 本地API响应结构:');
    console.log('- ID:', result.id);
    console.log('- Model:', result.model);
    console.log('- Choices数量:', result.choices?.length || 0);
    
    if (result.choices && result.choices[0]) {
      const content = result.choices[0].message.content;
      console.log('- Content长度:', content.length);
      console.log('- Content前200字符:', content.substring(0, 200));
      
      // 检查是否包含think标签
      if (content.includes('<think>') || content.includes('\\u003cthink\\u003e')) {
        console.log('🧠 检测到think标签');
      }
      
      // 检查是否包含JSON结构
      if (content.includes('{') && content.includes('}')) {
        console.log('📦 检测到JSON结构');
      }
      
      return content;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ 本地API测试失败:', error.message);
    return null;
  }
}

async function testRAGAnalysisAPI() {
  console.log('\n🔍 测试RAG分析API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testDocument
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📋 RAG API响应结构:');
    
    // 修正：RAG API直接返回结果，不是包装在data字段中
    const hasErrors = result.errors && Array.isArray(result.errors);
    const domainInfo = result.domain_info;
    const fallbackUsed = result.fallback_used;
    
    console.log('- 有错误数组:', hasErrors ? '是' : '否');
    console.log('- Errors数量:', hasErrors ? result.errors.length : 0);
    console.log('- 领域:', domainInfo?.domain || '未知');
    console.log('- 降级模式:', fallbackUsed ? '是' : '否');
    
    if (hasErrors && result.errors.length > 0) {
      console.log('📝 发现的错误/建议:');
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.original} → ${error.suggestion}`);
        console.log(`     原因: ${error.reason}`);
        console.log(`     类别: ${error.category}`);
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ RAG API测试失败:', error.message);
    return null;
  }
}

async function testMultipleDocuments() {
  console.log('\n🧪 测试多种文档类型...');
  
  const testCases = [
    {
      name: '重复词汇',
      content: '这个研究研究了重要的问题问题。'
    },
    {
      name: '标点符号',
      content: '实验结果显示,该方法有效。'
    },
    {
      name: '学术表达',
      content: '本文通过实验验证了该假设的正确性。'
    },
    {
      name: '技术术语',
      content: '算法的时间复杂度为O(n²)。'
    },
    {
      name: '混合问题',
      content: '数据数据分析表明,该方法方法可行。结果结果显示性能提升。'
    }
  ];
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    console.log(`📝 测试: ${testCase.name}`);
    console.log(`   内容: ${testCase.content}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: testCase.content
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // 修正：检查直接返回的结果格式
      const hasErrors = result.errors && Array.isArray(result.errors);
      
      if (hasErrors) {
        console.log(`   ✅ 成功 - 发现 ${result.errors.length} 个分析结果`);
        successCount++;
        
        if (result.errors.length > 0) {
          const firstError = result.errors[0];
          console.log(`   📋 示例: "${firstError.original}" → "${firstError.suggestion}"`);
        }
      } else {
        console.log(`   ❌ 失败 - 响应格式异常`);
        console.log(`   🔍 实际响应:`, JSON.stringify(result).substring(0, 200));
      }
      
    } catch (error) {
      console.log(`   ❌ 失败 - ${error.message}`);
    }
    
    // 添加延迟
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 多文档测试结果: ${successCount}/${testCases.length} 成功`);
  return successCount === testCases.length;
}

async function main() {
  try {
    console.log('🚀 开始JSON解析功能测试...\n');
    
    // 1. 直接测试本地API
    const localAPIContent = await testDirectLocalAPI();
    
    if (localAPIContent) {
      console.log('✅ 本地API响应正常');
    } else {
      console.log('❌ 本地API响应异常');
    }
    
    // 2. 测试RAG分析API
    const ragResult = await testRAGAnalysisAPI();
    
    if (ragResult && ragResult.errors && Array.isArray(ragResult.errors)) {
      console.log('✅ RAG API响应正常');
    } else {
      console.log('❌ RAG API响应异常');
    }
    
    // 3. 测试多种文档类型
    const multiTestSuccess = await testMultipleDocuments();
    
    // 4. 总结
    console.log('\n📊 测试总结:');
    console.log('=' .repeat(30));
    console.log(`🌐 本地API: ${localAPIContent ? '正常' : '异常'}`);
    console.log(`🔧 RAG API: ${ragResult?.success ? '正常' : '异常'}`);
    console.log(`📝 多文档测试: ${multiTestSuccess ? '通过' : '失败'}`);
    
    if (localAPIContent && ragResult?.success && multiTestSuccess) {
      console.log('\n🎉 所有测试通过！JSON解析功能工作正常！');
      console.log('💡 系统能够正确处理DeepSeek模型的复杂响应格式');
    } else {
      console.log('\n⚠️ 部分测试失败，需要进一步调试');
      
      if (!localAPIContent) {
        console.log('🔧 建议检查本地API连接和模型状态');
      }
      
      if (!ragResult?.success) {
        console.log('🔧 建议检查RAG API的JSON解析逻辑');
      }
      
      if (!multiTestSuccess) {
        console.log('🔧 建议检查不同文档类型的处理逻辑');
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

module.exports = { testDirectLocalAPI, testRAGAnalysisAPI, testMultipleDocuments }; 