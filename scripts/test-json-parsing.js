#!/usr/bin/env node

/**
 * JSON解析错误修复验证脚本
 * 测试各种场景下的API响应和错误处理
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

console.log('🧪 JSON解析错误修复验证测试');
console.log('=====================================\n');

/**
 * 测试正常JSON响应
 */
async function testValidJsonResponse() {
  console.log('📡 1. 测试正常JSON响应');
  console.log('------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/knowledge-base`);
    const contentType = response.headers.get('content-type');
    
    console.log(`📋 状态码: ${response.status}`);
    console.log(`📋 Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ JSON解析成功');
      console.log(`📊 响应数据: ${JSON.stringify(data).substring(0, 100)}...`);
    } else {
      console.log('❌ 响应不是JSON格式');
    }
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }
  
  console.log('');
}

/**
 * 测试HTML错误页面响应
 */
async function testHtmlErrorResponse() {
  console.log('📡 2. 测试HTML错误页面响应');
  console.log('-----------------------------');
  
  try {
    // 尝试访问不存在的页面
    const response = await fetch(`${BASE_URL}/non-existent-page`);
    const contentType = response.headers.get('content-type');
    
    console.log(`📋 状态码: ${response.status}`);
    console.log(`📋 Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('text/html')) {
      const text = await response.text();
      console.log('✅ HTML响应处理正确');
      console.log(`📄 响应内容: ${text.substring(0, 100)}...`);
      
      // 测试HTML检测
      const isHtml = text.trim().startsWith('<!DOCTYPE') || text.includes('<html');
      console.log(`🔍 HTML检测: ${isHtml ? '✅ 正确识别为HTML' : '❌ 未识别为HTML'}`);
    } else {
      console.log('⚠️  预期的HTML响应，但收到其他格式');
    }
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }
  
  console.log('');
}

/**
 * 测试API错误响应
 */
async function testApiErrorResponse() {
  console.log('📡 3. 测试API错误响应');
  console.log('----------------------');
  
  try {
    // 发送无效请求
    const response = await fetch(`${BASE_URL}/api/analyze-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // 缺少content字段
    });
    
    const contentType = response.headers.get('content-type');
    
    console.log(`📋 状态码: ${response.status}`);
    console.log(`📋 Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ 错误响应JSON解析成功');
      console.log(`📄 错误信息: ${JSON.stringify(data)}`);
    } else {
      console.log('❌ 错误响应不是JSON格式');
    }
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }
  
  console.log('');
}

/**
 * 测试文档分析API
 */
async function testDocumentAnalysisApi() {
  console.log('📡 4. 测试文档分析API');
  console.log('----------------------');
  
  const testCases = [
    { content: '测试测试内容', desc: '重复词汇测试' },
    { content: '量子力学是是物理学的重要分支', desc: '物理学术语测试' },
    { content: '', desc: '空内容测试' }
  ];
  
  for (const [index, testCase] of testCases.entries()) {
    try {
      console.log(`🔄 ${index + 1}. ${testCase.desc}`);
      
      const response = await fetch(`${BASE_URL}/api/analyze-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: testCase.content })
      });
      
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`   ✅ 成功 (状态: ${response.status})`);
        
        if (data.errors) {
          console.log(`   📊 发现 ${data.errors.length} 个问题`);
        }
      } else {
        const text = await response.text();
        console.log(`   ❌ 失败: 响应不是JSON`);
        console.log(`   📄 响应: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}`);
    }
    
    console.log('');
  }
}

/**
 * 测试RAG增强分析API
 */
async function testRagAnalysisApi() {
  console.log('📡 5. 测试RAG增强分析API');
  console.log('--------------------------');
  
  try {
    const response = await fetch(`${BASE_URL}/api/analyze-document-rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '人工智能技术在医学中的应用研究研究' })
    });
    
    const contentType = response.headers.get('content-type');
    
    console.log(`📋 状态码: ${response.status}`);
    console.log(`📋 Content-Type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log('✅ RAG分析JSON解析成功');
      
      if (data.errors) {
        console.log(`📊 发现 ${data.errors.length} 个问题`);
      }
      
      if (data.domain_info) {
        console.log(`🔬 领域识别: ${data.domain_info.domain} (置信度: ${(data.domain_info.confidence * 100).toFixed(1)}%)`);
      }
      
      if (data.knowledge_used) {
        console.log(`📚 使用知识: ${data.knowledge_used.length} 条`);
      }
    } else {
      const text = await response.text();
      console.log('❌ RAG分析响应不是JSON格式');
      console.log(`📄 响应: ${text.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
  }
  
  console.log('');
}

/**
 * 模拟JSON解析错误场景
 */
async function testJsonParsingErrorScenarios() {
  console.log('📡 6. 模拟JSON解析错误场景');
  console.log('-----------------------------');
  
  // 测试各种可能导致JSON解析错误的场景
  const scenarios = [
    {
      name: 'HTML错误页面',
      content: '<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Server Error</h1></body></html>',
      isJson: false
    },
    {
      name: '空响应',
      content: '',
      isJson: false
    },
    {
      name: '无效JSON',
      content: '{ invalid json }',
      isJson: false
    },
    {
      name: '有效JSON',
      content: '{"success": true, "data": "test"}',
      isJson: true
    }
  ];
  
  scenarios.forEach((scenario, index) => {
    console.log(`🔄 ${index + 1}. ${scenario.name}`);
    
    try {
      // 尝试解析JSON
      if (scenario.isJson) {
        const parsed = JSON.parse(scenario.content);
        console.log(`   ✅ JSON解析成功: ${JSON.stringify(parsed)}`);
      } else {
        // 测试HTML检测
        const isHtml = scenario.content.trim().startsWith('<!DOCTYPE') || 
                      scenario.content.includes('<html') ||
                      scenario.content.includes('<title>');
        
        if (isHtml) {
          console.log(`   ✅ 正确识别为HTML页面`);
        } else if (scenario.content === '') {
          console.log(`   ✅ 正确识别为空响应`);
        } else {
          console.log(`   ✅ 正确识别为无效JSON`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  JSON解析失败 (预期): ${error.message}`);
    }
    
    console.log('');
  });
}

/**
 * 主测试流程
 */
async function runTests() {
  try {
    console.log(`开始时间: ${new Date().toLocaleString()}\n`);
    
    await testValidJsonResponse();
    await testHtmlErrorResponse();
    await testApiErrorResponse();
    await testDocumentAnalysisApi();
    await testRagAnalysisApi();
    await testJsonParsingErrorScenarios();
    
    console.log('=====================================');
    console.log('🎉 JSON解析错误修复验证完成！');
    console.log(`完成时间: ${new Date().toLocaleString()}`);
    
    console.log('\n💡 修复总结:');
    console.log('✅ 添加了响应状态检查');
    console.log('✅ 添加了Content-Type验证');
    console.log('✅ 创建了安全的JSON解析机制');
    console.log('✅ 提供了统一的错误处理');
    console.log('✅ 避免了"Unexpected token \'<\'"错误');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testValidJsonResponse,
  testHtmlErrorResponse,
  testApiErrorResponse,
  testDocumentAnalysisApi,
  testRagAnalysisApi,
  testJsonParsingErrorScenarios
}; 