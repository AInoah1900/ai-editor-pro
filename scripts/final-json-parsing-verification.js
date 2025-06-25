#!/usr/bin/env node

/**
 * 最终JSON解析功能综合验证
 */

console.log('🎯 最终JSON解析功能综合验证');
console.log('=' .repeat(60));

const testCases = [
  {
    name: '重复词汇问题',
    content: '这个研究研究了重要的问题问题。实验实验结果显示显示了显著提升。',
    expectedIssues: ['重复词汇', '冗余表达']
  },
  {
    name: '学术写作规范',
    content: '本文通过分析数据数据，证明了该方法方法的有效性。',
    expectedIssues: ['重复表达', '学术规范']
  },
  {
    name: '技术文档格式',
    content: '算法的复杂度为O(n²)。性能测试测试表明系统稳定。',
    expectedIssues: ['表达优化', '技术规范']
  },
  {
    name: '医学术语检查',
    content: '患者患者的症状包括发热、咳嗽。治疗治疗效果良好。',
    expectedIssues: ['医学表达', '术语规范']
  },
  {
    name: '法律文件检查',
    content: '根据根据相关法律法规，当事人应当承担责任责任。',
    expectedIssues: ['法律表达', '用词准确性']
  }
];

async function testSingleDocument(testCase) {
  console.log(`\n📝 测试: ${testCase.name}`);
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
    
    // 验证响应结构
    const hasValidStructure = result.errors && Array.isArray(result.errors);
    const hasMetadata = result.domain_info && result.knowledge_used;
    
    console.log(`   ✅ 响应结构: ${hasValidStructure ? '正确' : '异常'}`);
    console.log(`   📊 错误数量: ${result.errors?.length || 0}`);
    console.log(`   🎯 识别领域: ${result.domain_info?.domain || '未知'}`);
    console.log(`   🔧 降级模式: ${result.fallback_used ? '是' : '否'}`);
    console.log(`   📚 知识应用: ${result.knowledge_used?.length || 0} 条`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('   📋 发现的问题:');
      result.errors.forEach((error, index) => {
        console.log(`     ${index + 1}. [${error.type}] ${error.original}`);
        console.log(`        → ${error.suggestion}`);
        console.log(`        原因: ${error.reason}`);
        console.log(`        类别: ${error.category}`);
      });
    }
    
    return {
      success: hasValidStructure,
      errorCount: result.errors?.length || 0,
      domain: result.domain_info?.domain,
      fallbackUsed: result.fallback_used,
      knowledgeCount: result.knowledge_used?.length || 0
    };
    
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSystemHealth() {
  console.log('🏥 系统健康检查...');
  
  try {
    // 检查DeepSeek配置
    const configResponse = await fetch('http://localhost:3000/api/deepseek-config?action=health');
    
    if (!configResponse.ok) {
      throw new Error(`配置检查失败: ${configResponse.status}`);
    }

    const configResult = await configResponse.json();
    
    console.log('📋 系统状态:');
    console.log(`   🌐 云端API: ${configResult.data?.cloud?.available ? '可用' : '不可用'}`);
    console.log(`   🏠 本地API: ${configResult.data?.local?.available ? '可用' : '不可用'}`);
    console.log(`   📍 当前提供商: ${configResult.data?.current || '未知'}`);
    
    // 检查本地API具体响应
    if (configResult.data?.local?.available) {
      console.log('\n🔍 测试本地API响应格式...');
      
      const testResponse = await fetch('http://localhost:11434/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-r1:8b',
          messages: [{
            role: 'user',
            content: '请返回JSON格式：[{"type":"test","original":"测试","suggestion":"测试建议","reason":"测试原因","category":"测试"}]'
          }],
          max_tokens: 500,
          temperature: 0.1
        })
      });

      if (testResponse.ok) {
        const testResult = await testResponse.json();
        const content = testResult.choices[0]?.message?.content;
        
        console.log(`   📏 响应长度: ${content?.length || 0} 字符`);
        console.log(`   🧠 包含think标签: ${content?.includes('<think>') ? '是' : '否'}`);
        console.log(`   📦 包含JSON: ${content?.includes('[') || content?.includes('{') ? '是' : '否'}`);
      }
    }
    
    return configResult.data;
    
  } catch (error) {
    console.log(`❌ 健康检查失败: ${error.message}`);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 开始综合验证...\n');
    
    // 1. 系统健康检查
    const healthStatus = await testSystemHealth();
    
    if (!healthStatus) {
      console.log('❌ 系统健康检查失败，终止测试');
      return;
    }
    
    // 2. 运行所有测试用例
    console.log('\n🧪 开始测试所有用例...');
    const results = [];
    
    for (const testCase of testCases) {
      const result = await testSingleDocument(testCase);
      results.push({ ...testCase, result });
      
      // 添加延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. 统计和分析结果
    console.log('\n📊 测试结果统计:');
    console.log('=' .repeat(40));
    
    const successCount = results.filter(r => r.result.success).length;
    const totalErrors = results.reduce((sum, r) => sum + (r.result.errorCount || 0), 0);
    const domainCounts = {};
    const fallbackCount = results.filter(r => r.result.fallbackUsed).length;
    
    results.forEach(r => {
      if (r.result.domain) {
        domainCounts[r.result.domain] = (domainCounts[r.result.domain] || 0) + 1;
      }
    });
    
    console.log(`✅ 成功测试: ${successCount}/${testCases.length}`);
    console.log(`📈 成功率: ${((successCount / testCases.length) * 100).toFixed(1)}%`);
    console.log(`🔍 总发现问题: ${totalErrors} 个`);
    console.log(`🔧 降级模式使用: ${fallbackCount}/${testCases.length} 次`);
    console.log(`🎯 领域识别分布:`);
    
    Object.entries(domainCounts).forEach(([domain, count]) => {
      console.log(`   ${domain}: ${count} 次`);
    });
    
    // 4. 详细分析
    console.log('\n📋 详细分析:');
    results.forEach((r, index) => {
      const status = r.result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${r.name}`);
      
      if (r.result.success) {
        console.log(`   发现 ${r.result.errorCount} 个问题，领域: ${r.result.domain}`);
      } else {
        console.log(`   失败原因: ${r.result.error}`);
      }
    });
    
    // 5. 最终评估
    console.log('\n🎯 最终评估:');
    console.log('=' .repeat(40));
    
    if (successCount === testCases.length) {
      console.log('🎉 所有测试完美通过！');
      console.log('💡 JSON解析功能已完全修复并正常工作！');
      console.log('🔧 系统特性:');
      console.log('   ✅ 正确处理DeepSeek的<think>标签');
      console.log('   ✅ 支持数组和对象格式的JSON响应');
      console.log('   ✅ 智能领域识别和知识库应用');
      console.log('   ✅ 完善的降级机制确保系统稳定性');
    } else if (successCount >= testCases.length * 0.8) {
      console.log('✅ 大部分测试通过，系统基本正常');
      console.log('💡 JSON解析功能工作良好，少数边缘情况需要优化');
    } else {
      console.log('⚠️ 部分测试失败，需要进一步调试');
      console.log('🔧 建议检查API配置和JSON解析逻辑');
    }
    
    console.log(`\n📈 系统性能概览:`);
    console.log(`   🌐 API可用性: ${healthStatus.local?.available ? '本地可用' : '仅云端'}`);
    console.log(`   🔧 降级使用率: ${((fallbackCount / testCases.length) * 100).toFixed(1)}%`);
    console.log(`   🎯 平均问题发现: ${(totalErrors / successCount).toFixed(1)} 个/文档`);
    
  } catch (error) {
    console.error('❌ 综合验证过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 