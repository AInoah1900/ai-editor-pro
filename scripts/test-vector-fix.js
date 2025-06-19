/**
 * 测试向量维度修复
 */
console.log('🔧 测试向量维度修复...\n');

async function testVectorDimensions() {
  try {
    // 测试知识库API
    console.log('1. 测试知识库统计API...');
    const statsResponse = await fetch('http://localhost:3000/api/knowledge-base');
    const statsResult = await statsResponse.json();
    
    if (statsResult.success) {
      console.log('✅ 知识库API正常');
      console.log(`📊 当前知识库统计: ${JSON.stringify(statsResult.data, null, 2)}`);
    } else {
      console.log('❌ 知识库API异常:', statsResult.error);
    }

    // 测试单个知识项添加
    console.log('\n2. 测试单个知识项添加...');
    const testKnowledge = {
      action: 'add',
      knowledge: {
        type: 'terminology',
        domain: 'test',
        content: '测试术语：用于验证向量维度的测试内容',
        context: '这是一个测试用例，用于验证1024维向量是否正常工作',
        source: '测试脚本',
        confidence: 0.9,
        tags: ['测试', '维度验证']
      }
    };

    const addResponse = await fetch('http://localhost:3000/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testKnowledge)
    });

    const addResult = await addResponse.json();
    
    if (addResult.success) {
      console.log('✅ 单个知识项添加成功');
      console.log(`📝 添加的知识项: ${addResult.data.id}`);
    } else {
      console.log('❌ 单个知识项添加失败:', addResult.error);
    }

    // 测试RAG分析
    console.log('\n3. 测试RAG增强分析...');
    const testContent = '量子态是量子力学中的基本概念，描述量子系统的状态。';
    
    const ragResponse = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: testContent })
    });

    const ragResult = await ragResponse.json();
    
    if (ragResult.errors) {
      console.log('✅ RAG分析成功');
      console.log(`🔬 识别领域: ${ragResult.domain_info?.domain || 'unknown'}`);
      console.log(`📚 应用知识: ${ragResult.knowledge_used?.length || 0}条`);
      console.log(`🎯 检测错误: ${ragResult.errors.length}个`);
    } else {
      console.log('❌ RAG分析失败:', ragResult.error);
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 等待服务器启动
setTimeout(() => {
  testVectorDimensions().then(() => {
    console.log('\n🎉 向量维度修复测试完成！');
    console.log('\n如果看到所有✅，说明修复成功。');
    console.log('如果看到❌，请检查服务器日志获取详细错误信息。');
  });
}, 5000); // 等待5秒确保服务器启动 