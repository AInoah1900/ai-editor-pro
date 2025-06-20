#!/usr/bin/env node

/**
 * RAG API 测试脚本
 * 用于验证JSON解析修复和错误处理
 */

const fetch = require('node-fetch');

async function testRAGAPI() {
  console.log('🚀 开始测试RAG API...\n');

  const testCases = [
    {
      name: '短文本测试',
      content: '这是一个简单的测试文档。'
    },
    {
      name: '专业术语测试',
      content: '量子力学是现代物理学的重要分支，研究微观粒子的运动规律。'
    },
    {
      name: '长文本测试',
      content: `人工智能（Artificial Intelligence，AI）是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。

自从人工智能诞生以来，理论和技术日益成熟，应用领域也不断扩大。可以设想，未来人工智能带来的科技产品，将会是人类智慧的"容器"。人工智能可以对人的意识、思维的信息过程的模拟。`
    }
  ];

  for (const testCase of testCases) {
    console.log(`📝 测试: ${testCase.name}`);
    console.log(`内容长度: ${testCase.content.length} 字符`);
    
    const startTime = Date.now();
    
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

      const result = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.ok) {
        console.log(`✅ 成功 (${duration}ms)`);
        console.log(`   - 检测到 ${result.errors?.length || 0} 个问题`);
        console.log(`   - 领域: ${result.domain_info?.domain || '未知'}`);
        console.log(`   - RAG置信度: ${result.rag_confidence || 0}`);
        console.log(`   - 是否降级: ${result.fallback_used ? '是' : '否'}`);
        
        if (result.errors && result.errors.length > 0) {
          console.log(`   - 错误示例: ${result.errors[0].category} - ${result.errors[0].reason}`);
        }
      } else {
        console.log(`❌ 失败 (${duration}ms)`);
        console.log(`   - 错误: ${result.error || '未知错误'}`);
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`💥 异常 (${duration}ms)`);
      console.log(`   - 错误: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🏁 测试完成');
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'test'
      })
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 检查开发服务器状态...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ 开发服务器未运行，请先启动服务器：');
    console.log('   npm run dev');
    process.exit(1);
  }
  
  console.log('✅ 开发服务器正在运行\n');
  await testRAGAPI();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRAGAPI }; 