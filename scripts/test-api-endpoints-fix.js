#!/usr/bin/env node

/**
 * API端点修复验证测试
 * 测试 analyze-document 和 analyze-document-rag 两个API的功能
 */

const fs = require('fs');
const path = require('path');

// 测试配置
const API_BASE = 'http://localhost:3000/api';
const TEST_CONTENT = `这是一个测试文档，包含一些常见的错误。比如重复的的词语，以及不正确的标点符号。
学术论文的写作需要遵循严格的规范，包括语法、标点、术语使用等方面。
本文档用于测试AI编辑器的错误检测和修正功能。`;

async function testApiEndpoint(endpoint, data) {
  console.log(`\n🧪 测试 ${endpoint} 端点...`);
  
  try {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log(`✅ ${endpoint} 响应成功`);
    console.log(`📊 响应大小: ${JSON.stringify(result).length} 字符`);
    
    // 验证响应结构
    if (result.errors && Array.isArray(result.errors)) {
      console.log(`🔍 检测到 ${result.errors.length} 个错误/建议`);
      
      // 显示前3个错误的详细信息
      result.errors.slice(0, 3).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.type}: ${error.original} -> ${error.suggestion}`);
      });
    }
    
    // RAG端点的额外信息
    if (result.domain_info) {
      console.log(`🎯 识别的领域: ${result.domain_info.domain} (置信度: ${result.domain_info.confidence})`);
    }
    
    if (result.knowledge_sources) {
      console.log(`📚 知识库使用: 私有${result.knowledge_sources.private_count}个, 共享${result.knowledge_sources.shared_count}个`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ ${endpoint} 测试失败:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 开始API端点修复验证测试...');
  console.log(`📝 测试内容长度: ${TEST_CONTENT.length} 字符`);
  
  // 测试基础文档分析API
  const basicResult = await testApiEndpoint('analyze-document', {
    content: TEST_CONTENT
  });
  
  // 测试RAG增强文档分析API
  const ragResult = await testApiEndpoint('analyze-document-rag', {
    content: TEST_CONTENT
  });
  
  // 生成测试报告
  const report = {
    timestamp: new Date().toISOString(),
    test_summary: {
      basic_api: basicResult ? '✅ 成功' : '❌ 失败',
      rag_api: ragResult ? '✅ 成功' : '❌ 失败',
      total_tests: 2,
      passed_tests: [basicResult, ragResult].filter(r => r !== null).length
    },
    basic_api_result: basicResult ? {
      errors_count: basicResult.errors?.length || 0,
      has_valid_structure: !!(basicResult.errors && Array.isArray(basicResult.errors))
    } : null,
    rag_api_result: ragResult ? {
      errors_count: ragResult.errors?.length || 0,
      has_valid_structure: !!(ragResult.errors && Array.isArray(ragResult.errors)),
      domain_detected: ragResult.domain_info?.domain || 'unknown',
      knowledge_sources_used: ragResult.knowledge_sources?.total_count || 0
    } : null
  };
  
  // 保存测试报告
  const reportPath = path.join(__dirname, '../test-reports', `api-endpoints-fix-${Date.now()}.json`);
  
  // 确保目录存在
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📋 测试总结:');
  console.log(`✅ 成功测试: ${report.test_summary.passed_tests}/${report.test_summary.total_tests}`);
  console.log(`📄 测试报告已保存: ${reportPath}`);
  
  if (report.test_summary.passed_tests === report.test_summary.total_tests) {
    console.log('\n🎉 所有API端点修复验证通过！');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查API配置和服务状态');
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 测试执行失败:', error);
    process.exit(1);
  });
}

module.exports = { testApiEndpoint, runTests }; 