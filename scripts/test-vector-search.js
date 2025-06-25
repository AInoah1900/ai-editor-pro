const { NewKnowledgeRetriever } = require('../lib/rag/new-knowledge-retriever');

async function testVectorSearch() {
  const retriever = new NewKnowledgeRetriever();
  
  try {
    console.log('🔍 测试向量搜索功能...');
    
    // 测试简单查询
    console.log('\n=== 测试1: 简单查询 ===');
    const results1 = await retriever.retrieveRelevantKnowledge('学术写作', undefined, undefined, 3);
    console.log('搜索结果数量:', results1.length);
    results1.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}, Domain: ${item.domain}, Score: ${item.relevance_score}`);
      console.log(`   Content: ${item.content.substring(0, 100)}...`);
    });
    
    // 测试领域过滤
    console.log('\n=== 测试2: 按领域过滤 ===');
    const results2 = await retriever.retrieveRelevantKnowledge('研究方法', 'academic', undefined, 3);
    console.log('搜索结果数量:', results2.length);
    results2.forEach((item, index) => {
      console.log(`${index + 1}. ID: ${item.id}, Domain: ${item.domain}, Score: ${item.relevance_score}`);
    });
    
    // 测试多知识库检索
    console.log('\n=== 测试3: 多知识库检索 ===');
    const results3 = await retriever.retrieveFromMultipleKnowledgeBases('技术文档', 'default_user', undefined, undefined, 2, 3);
    console.log('检索统计:', {
      private: results3.private_knowledge.length,
      shared: results3.shared_knowledge.length,
      combined: results3.combined_knowledge.length
    });
    
    // 显示合并结果
    if (results3.combined_knowledge.length > 0) {
      console.log('合并结果:');
      results3.combined_knowledge.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ID: ${item.id}, Ownership: ${item.ownership_type}, Score: ${item.relevance_score}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testVectorSearch(); 