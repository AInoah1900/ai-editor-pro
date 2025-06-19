#!/usr/bin/env node

/**
 * RAG功能测试脚本
 * 用于验证RAG知识库系统是否正常工作
 */

const API_BASE = 'http://localhost:3000';

// 测试文档
const testDocuments = {
  physics: `量子纠缠现象的理论分析与实验验证

量子纠缠是量子力学中的一个重要现象。本文对量子状态的基本理论进行了系统梳理。

研究中使用的量子状态可以表示为贝尔态。通过贝尔不等式的测试，我们验证了量子纠缠的真实性。`,

  chemistry: `新型催化素在有机合成反应中的应用研究

本文报告了一种新型催化素在C-H键活化反应中的应用。该催化素具有高选择性和高活性的特点。

实验使用了钯基催化素，在120°C下进行反应。产物的产率达到了95%以上。`,

  biology: `脱氧核糖核酸损伤修复机制的分子生物学研究

脱氧核糖核酸损伤是细胞面临的重要挑战之一。本研究重点分析了DNA损伤修复的分子机制。

实验采用了人源细胞株，通过紫外线照射诱导DNA损伤。`
};

/**
 * 测试知识库状态
 */
async function testKnowledgeBase() {
  console.log('🔍 测试知识库状态...');
  
  try {
    const response = await fetch(`${API_BASE}/api/knowledge-base`);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 知识库连接正常');
      console.log(`📊 总知识项: ${result.data.total}`);
      console.log('📈 领域分布:', result.data.byDomain);
    } else {
      console.log('❌ 知识库连接失败:', result.error);
    }
  } catch (error) {
    console.log('❌ 知识库测试失败:', error.message);
  }
}

/**
 * 测试RAG分析
 */
async function testRAGAnalysis(domain, content) {
  console.log(`\n🧠 测试 ${domain} 领域RAG分析...`);
  
  try {
    const response = await fetch(`${API_BASE}/api/analyze-document-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      console.log('✅ RAG分析成功');
      console.log(`🔬 识别领域: ${result.domain_info?.domain} (${(result.domain_info?.confidence * 100).toFixed(0)}%)`);
      console.log(`📚 应用知识: ${result.knowledge_used?.length || 0} 条`);
      console.log(`⚡ RAG置信度: ${(result.rag_confidence * 100).toFixed(0)}%`);
      console.log(`🔧 是否降级: ${result.fallback_used ? '是' : '否'}`);
      
      if (result.errors.length > 0) {
        console.log(`🎯 检测到 ${result.errors.length} 个问题:`);
        result.errors.slice(0, 3).forEach((error, index) => {
          console.log(`  ${index + 1}. "${error.original}" → "${error.suggestion}"`);
          console.log(`     原因: ${error.reason}`);
        });
      } else {
        console.log('✨ 未检测到问题');
      }
    } else {
      console.log('❌ RAG分析失败:', result.error);
    }
  } catch (error) {
    console.log('❌ RAG分析测试失败:', error.message);
  }
}

/**
 * 测试用户反馈学习
 */
async function testFeedbackLearning() {
  console.log('\n📚 测试用户反馈学习...');
  
  try {
    const response = await fetch(`${API_BASE}/api/knowledge-base`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        original: '量子状态',
        suggestion: '量子态',
        feedback: 'accept',
        domain: 'physics',
        finalVersion: '量子态'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 用户反馈学习成功');
      console.log('📖 成功案例已添加到知识库');
    } else {
      console.log('❌ 用户反馈学习失败:', result.error);
    }
  } catch (error) {
    console.log('❌ 反馈学习测试失败:', error.message);
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🚀 开始RAG功能测试...\n');
  
  // 1. 测试知识库
  await testKnowledgeBase();
  
  // 2. 测试不同领域的RAG分析
  for (const [domain, content] of Object.entries(testDocuments)) {
    await testRAGAnalysis(domain, content);
  }
  
  // 3. 测试用户反馈学习
  await testFeedbackLearning();
  
  console.log('\n🎉 RAG功能测试完成！');
  console.log('\n📋 测试总结:');
  console.log('- 如果所有测试都显示 ✅，说明RAG系统运行正常');
  console.log('- 如果看到 ❌，请检查环境配置和服务器状态');
  console.log('- 可访问 http://localhost:3000/knowledge-admin 进行更多配置');
}

// 添加一些延迟以确保服务器启动
setTimeout(runTests, 2000);

// 导出测试函数
module.exports = { testKnowledgeBase, testRAGAnalysis, testFeedbackLearning }; 