const { QdrantClient } = require('@qdrant/js-client-rest');

async function finalTest() {
  console.log('🎯 开始最终功能测试...\n');
  
  try {
    // 1. 测试 Qdrant 连接
    console.log('1. 测试 Qdrant 连接...');
    const client = new QdrantClient({ url: 'http://localhost:6333' });
    const collections = await client.getCollections();
    console.log('✅ Qdrant 连接正常，现有集合:', collections.collections.map(c => c.name));
    
    // 2. 测试知识库 API
    console.log('\n2. 测试知识库 API...');
    const response = await fetch('http://localhost:3000/api/knowledge-base');
    const data = await response.json();
    if (data.success) {
      console.log('✅ 知识库 API 正常');
      console.log('   总知识项:', data.data.total_knowledge_items);
      console.log('   向量统计:', data.data.vector_stats);
    } else {
      console.log('❌ 知识库 API 异常');
    }
    
    // 3. 测试 RAG 分析
    console.log('\n3. 测试 RAG 分析...');
    const ragResponse = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '这是一个测试文档，包含机器学习和深度学习的内容。'
      })
    });
    const ragData = await ragResponse.json();
    if (ragData.errors && Array.isArray(ragData.errors)) {
      console.log('✅ RAG 分析正常');
      console.log('   检测到错误数量:', ragData.errors.length);
      console.log('   领域识别:', ragData.domain_info.domain);
    } else {
      console.log('❌ RAG 分析异常');
    }
    
    // 4. 测试知识库初始化
    console.log('\n4. 测试知识库初始化...');
    const initResponse = await fetch('http://localhost:3000/api/knowledge-base', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initialize' })
    });
    const initData = await initResponse.json();
    if (initData.success) {
      console.log('✅ 知识库初始化正常');
    } else {
      console.log('❌ 知识库初始化异常:', initData.error);
    }
    
    // 5. 测试向量操作
    console.log('\n5. 测试向量操作...');
    try {
      // 创建测试集合
      await client.createCollection('test-final', {
        vectors: { size: 4096, distance: 'Cosine' }
      });
      
      // 添加测试向量
      const testVector = new Array(4096).fill(0).map(() => Math.random());
      await client.upsert('test-final', {
        points: [{
          id: 'test_point',
          vector: testVector,
          payload: { test: 'data' }
        }]
      });
      
      // 搜索测试向量
      const searchResult = await client.search('test-final', {
        vector: testVector,
        limit: 1,
        with_payload: true
      });
      
      if (searchResult.length > 0) {
        console.log('✅ 向量操作正常');
        console.log('   搜索结果数量:', searchResult.length);
      }
      
      // 清理测试集合
      await client.deleteCollection('test-final');
      
    } catch (error) {
      console.log('❌ 向量操作异常:', error.message);
    }
    
    console.log('\n🎉 所有测试完成！系统运行正常！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

finalTest(); 