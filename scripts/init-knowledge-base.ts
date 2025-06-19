#!/usr/bin/env ts-node

import { KnowledgeRetriever } from '../lib/rag/knowledge-retriever';

/**
 * 知识库初始化脚本
 * 运行: npm run init-knowledge
 */
async function initializeKnowledgeBase() {
  console.log('🚀 开始初始化RAG知识库...');
  
  try {
    const retriever = new KnowledgeRetriever();
    
    // 等待Pinecone连接初始化
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 初始化知识库
    await retriever.initializeKnowledgeBase();
    
    // 获取统计信息
    const stats = await retriever.getKnowledgeStats();
    
    console.log('\n📊 知识库统计信息:');
    console.log(`总知识项: ${stats.total}`);
    console.log('按领域分布:', stats.byDomain);
    console.log('按类型分布:', stats.byType);
    
    console.log('\n✅ 知识库初始化完成！');
    
  } catch (error) {
    console.error('❌ 知识库初始化失败:', error);
    process.exit(1);
  }
}

// 运行初始化
if (require.main === module) {
  initializeKnowledgeBase().then(() => {
    process.exit(0);
  });
}

export { initializeKnowledgeBase }; 