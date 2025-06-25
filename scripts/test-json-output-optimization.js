#!/usr/bin/env node

/**
 * 测试JSON输出优化功能
 * 验证DeepSeek API的JSON模式和参数优化
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 测试JSON输出优化功能...\n');

// 测试配置
const testConfig = {
  temperature: 0.3,
  max_tokens: 32000,
  response_format: { type: 'json_object' }
};

console.log('📋 测试配置:');
console.log(`  Temperature: ${testConfig.temperature}`);
console.log(`  Max Tokens: ${testConfig.max_tokens}`);
console.log(`  Response Format: ${JSON.stringify(testConfig.response_format)}`);
console.log('');

// 测试用例
const testCases = [
  {
    name: '基础文档分析',
    content: '这是一个测试文档，包含重复的的词汇和研究研究等问题。还有重复标点？。',
    endpoint: '/api/analyze-document'
  },
  {
    name: 'RAG增强分析',
    content: '学术论文中的专业术语应当保持一致性，避免重复使用使用相同的表达方式。',
    endpoint: '/api/analyze-document-rag'
  }
];

async function testEndpoint(testCase) {
  console.log(`🧪 测试: ${testCase.name}`);
  console.log(`📍 端点: ${testCase.endpoint}`);
  console.log(`📝 内容: "${testCase.content.substring(0, 50)}..."`);
  
  try {
    const startTime = Date.now();
    
    // 使用curl调用API
    const curlCommand = `curl -s -X POST "http://localhost:3000${testCase.endpoint}" \\
      -H "Content-Type: application/json" \\
      -d '${JSON.stringify({ content: testCase.content }).replace(/'/g, "'\"'\"'")}'`;
    
    console.log('⏳ 发送请求...');
    const response = execSync(curlCommand, { encoding: 'utf8', timeout: 180000 }); // 3分钟超时
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log(`⏱️  响应时间: ${duration}秒`);
    console.log(`📏 响应长度: ${response.length} 字符`);
    
    // 尝试解析JSON响应
    try {
      const jsonResponse = JSON.parse(response);
      console.log('✅ JSON解析成功');
      
      if (jsonResponse.errors && Array.isArray(jsonResponse.errors)) {
        console.log(`🔍 发现错误数量: ${jsonResponse.errors.length}`);
        
        // 显示前3个错误示例
        jsonResponse.errors.slice(0, 3).forEach((error, index) => {
          console.log(`  错误 ${index + 1}:`);
          console.log(`    类型: ${error.type || '未知'}`);
          console.log(`    原文: "${error.original || '未知'}"`);
          console.log(`    建议: "${error.suggestion || '未知'}"`);
          console.log(`    原因: "${error.reason || '未知'}"`);
        });
        
        if (jsonResponse.errors.length > 3) {
          console.log(`    ... 还有 ${jsonResponse.errors.length - 3} 个错误`);
        }
      } else {
        console.log('⚠️  响应中没有找到errors数组');
      }
      
      // 检查RAG特有字段
      if (testCase.endpoint.includes('rag')) {
        if (jsonResponse.domain_info) {
          console.log(`🎯 识别领域: ${jsonResponse.domain_info.domain} (置信度: ${jsonResponse.domain_info.confidence})`);
        }
        if (jsonResponse.knowledge_used) {
          console.log(`📚 使用知识: ${jsonResponse.knowledge_used.length} 条`);
        }
        if (jsonResponse.fallback_used !== undefined) {
          console.log(`🔄 是否降级: ${jsonResponse.fallback_used ? '是' : '否'}`);
        }
      }
      
      console.log('✅ 测试通过\n');
      return {
        success: true,
        duration,
        errorCount: jsonResponse.errors ? jsonResponse.errors.length : 0,
        responseSize: response.length
      };
      
    } catch (parseError) {
      console.log('❌ JSON解析失败');
      console.log('📄 原始响应预览:');
      console.log(response.substring(0, 500) + (response.length > 500 ? '...' : ''));
      console.log(`❌ 解析错误: ${parseError.message}\n`);
      return {
        success: false,
        error: 'JSON解析失败',
        duration,
        responseSize: response.length
      };
    }
    
  } catch (error) {
    console.log(`❌ 请求失败: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.log('⏰ 请求超时，可能是因为本地API处理时间较长');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🔌 连接被拒绝，请确保Next.js服务器正在运行 (npm run dev)');
    }
    
    console.log('');
    return {
      success: false,
      error: error.message,
      duration: 0,
      responseSize: 0
    };
  }
}

async function runTests() {
  console.log('🚀 开始测试JSON输出优化功能...\n');
  
  const results = [];
  
  for (const testCase of testCases) {
    const result = await testEndpoint(testCase);
    results.push({
      name: testCase.name,
      ...result
    });
  }
  
  // 生成测试报告
  console.log('📊 测试报告:');
  console.log('=' .repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`总测试数: ${totalCount}`);
  console.log(`成功数: ${successCount}`);
  console.log(`失败数: ${totalCount - successCount}`);
  console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  console.log('');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    console.log(`   响应时间: ${result.duration}秒`);
    console.log(`   响应大小: ${result.responseSize} 字符`);
    if (result.success && result.errorCount !== undefined) {
      console.log(`   检测错误: ${result.errorCount} 个`);
    }
    if (!result.success && result.error) {
      console.log(`   错误信息: ${result.error}`);
    }
    console.log('');
  });
  
  // 保存测试报告
  const reportData = {
    timestamp: new Date().toISOString(),
    testConfig,
    results,
    summary: {
      total: totalCount,
      success: successCount,
      failed: totalCount - successCount,
      successRate: (successCount / totalCount) * 100
    }
  };
  
  const reportFile = `test-reports/json-output-optimization-${Date.now()}.json`;
  
  // 确保目录存在
  if (!fs.existsSync('test-reports')) {
    fs.mkdirSync('test-reports');
  }
  
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
  console.log(`📄 测试报告已保存: ${reportFile}`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有测试通过！JSON输出优化功能正常工作。');
    process.exit(0);
  } else {
    console.log('⚠️  部分测试失败，请检查错误信息。');
    process.exit(1);
  }
}

// 运行测试
runTests().catch(error => {
  console.error('💥 测试运行失败:', error);
  process.exit(1);
}); 