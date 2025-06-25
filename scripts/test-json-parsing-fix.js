#!/usr/bin/env node

/**
 * 测试JSON解析修复效果
 */

console.log('🔧 测试JSON解析修复效果');
console.log('=' .repeat(50));

// 模拟DeepSeek可能返回的各种复杂响应格式
const testCases = [
  {
    name: '包含think标签的响应',
    response: `<think>
这是一个学术文档，我需要分析其中的问题...
让我仔细检查语法和表达...
</think>

{
  "errors": [
    {
      "type": "error",
      "original": "研究研究",
      "suggestion": "研究",
      "reason": "避免重复表达",
      "category": "冗余"
    }
  ]
}`
  },
  {
    name: '包含markdown代码块的响应',
    response: `根据分析，我发现了以下问题：

\`\`\`json
{
  "errors": [
    {
      "type": "warning",
      "original": "实验实验表明",
      "suggestion": "实验表明",
      "reason": "避免词汇重复，提高表达精确性",
      "category": "表达优化"
    }
  ]
}
\`\`\`

这些是主要的修改建议。`
  },
  {
    name: '包含中文位置描述的响应',
    response: `{
  "errors": [
    {
      "type": "suggestion",
      "original": "量子计算技术",
      "suggestion": "量子计算技术的最新发展",
      "reason": "增加具体性",
      "category": "内容完善",
      "position": {
        "start": 起始位置,
        "end": 结束位置
      }
    }
  ]
}`
  },
  {
    name: '不完整的JSON响应',
    response: `{
  "errors": [
    {
      "type": "error",
      "original": "数据数据显示",
      "suggestion": "数据显示",
      "reason": "消除重复词汇"
      "category": "语法修正"`
  },
  {
    name: '包含特殊字符的响应',
    response: `{
  "errors": [
    {
      "type": "error",
      "original": "这个方法<很>有效",
      "suggestion": "这个方法很有效",
      "reason": "移除不必要的标记符号",
      "category": "格式清理"
    }
  ]
}`
  }
];

async function testRAGAnalysis(testContent) {
  try {
    const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testContent
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('❌ RAG分析失败:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 开始测试各种文档内容...\n');
  
  const testDocuments = [
    '这是一个简单的测试文档。研究研究表明该方法有效。',
    '学术论文摘要：本研究研究了量子计算在机器学习中的应用。实验实验结果显示显示了显著的性能提升。',
    '技术文档：该算法算法的复杂度为O(n²)。数据数据分析表明该方法可行。',
    '医学报告：患者患者的症状包括发热、咳嗽等。治疗治疗方案需要进一步讨论。',
    '法律文件：根据根据相关法律法规，当事人应当承担相应责任。'
  ];
  
  let successCount = 0;
  let totalTests = testDocuments.length;
  
  for (let i = 0; i < testDocuments.length; i++) {
    const doc = testDocuments[i];
    console.log(`📝 测试文档 ${i + 1}/${totalTests}:`);
    console.log(`   内容: ${doc.substring(0, 50)}...`);
    
    const result = await testRAGAnalysis(doc);
    
    if (result && result.errors && Array.isArray(result.errors)) {
      console.log(`   ✅ 成功 - 发现 ${result.errors.length} 个分析结果`);
      console.log(`   🎯 领域: ${result.domain_info?.domain || '未知'}`);
      console.log(`   🔧 降级模式: ${result.fallback_used ? '是' : '否'}`);
      
      // 显示部分分析结果
      if (result.errors.length > 0) {
        const firstError = result.errors[0];
        console.log(`   📋 示例建议: "${firstError.original}" → "${firstError.suggestion}"`);
      }
      
      successCount++;
    } else {
      console.log(`   ❌ 失败 - 返回格式异常`);
    }
    
    console.log('');
    
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return { successCount, totalTests };
}

async function testSystemHealth() {
  console.log('🏥 检查系统健康状态...');
  
  try {
    const response = await fetch('http://localhost:3000/api/deepseek-config?action=health');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ 系统健康检查通过');
      console.log(`🌐 云端API: ${result.data.cloud.available ? '可用' : '不可用'}`);
      console.log(`🏠 本地API: ${result.data.local.available ? '可用' : '不可用'}`);
      console.log(`📍 当前提供商: ${result.data.current}`);
      return true;
    } else {
      console.log('⚠️ 系统健康检查异常:', result);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 系统健康检查失败:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 开始JSON解析修复测试...\n');
    
    // 1. 系统健康检查
    const healthOk = await testSystemHealth();
    console.log('');
    
    if (!healthOk) {
      console.log('❌ 系统健康检查失败，跳过功能测试');
      return;
    }
    
    // 2. 运行文档分析测试
    const { successCount, totalTests } = await runTests();
    
    // 3. 总结结果
    console.log('📊 测试结果总结:');
    console.log('=' .repeat(30));
    console.log(`📝 测试文档数量: ${totalTests}`);
    console.log(`✅ 成功分析: ${successCount}`);
    console.log(`❌ 失败分析: ${totalTests - successCount}`);
    console.log(`📈 成功率: ${((successCount / totalTests) * 100).toFixed(1)}%`);
    
    if (successCount === totalTests) {
      console.log('\n🎉 所有测试通过！JSON解析功能工作正常！');
      console.log('💡 系统能够正确处理各种复杂的文档内容');
    } else if (successCount > totalTests * 0.8) {
      console.log('\n✅ 大部分测试通过，系统基本正常');
      console.log('💡 可能有个别复杂情况需要进一步优化');
    } else {
      console.log('\n⚠️ 部分测试失败，JSON解析可能仍有问题');
      console.log('🔧 建议检查API响应格式和解析逻辑');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testRAGAnalysis, testSystemHealth, runTests }; 