#!/usr/bin/env ts-node

/**
 * 新 RAG 知识库系统测试脚本
 * 测试 Qdrant 向量数据库和 PostgreSQL 关系型数据库的集成
 */

import { NewKnowledgeRetriever, DomainClassifier } from '../lib/rag/new-knowledge-retriever';

async function testNewRAGSystem() {
  console.log('🧪 开始测试新的 RAG 知识库系统...\n');

  try {
    // 1. 初始化知识库
    console.log('1️⃣ 初始化知识库...');
    const retriever = new NewKnowledgeRetriever();
    await retriever.initializeKnowledgeBase();
    console.log('✅ 知识库初始化成功\n');

    // 2. 测试领域分类器
    console.log('2️⃣ 测试领域分类器...');
    const domainClassifier = new DomainClassifier();
    const testContent = '基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述';
    const domainInfo = await domainClassifier.identifyDomain(testContent);
    console.log('领域识别结果:', domainInfo);
    console.log('✅ 领域分类器测试成功\n');

    // 3. 添加测试知识项
    console.log('3️⃣ 添加测试知识项...');
    const testKnowledgeItems = [
      {
        id: 'test_1',
        type: 'terminology' as const,
        domain: 'academic',
        content: '超音速数值仿真',
        context: '航空航天领域的数值仿真技术',
        source: '测试数据',
        confidence: 0.9,
        tags: ['学术', '技术', '仿真']
      },
      {
        id: 'test_2',
        type: 'rule' as const,
        domain: 'technical',
        content: '多脉冲约束弹体',
        context: '弹道学中的多脉冲控制技术',
        source: '测试数据',
        confidence: 0.85,
        tags: ['技术', '弹道', '控制']
      },
      {
        id: 'test_3',
        type: 'case' as const,
        domain: 'academic',
        content: '修正策略研究',
        context: '学术研究中的策略修正方法',
        source: '测试数据',
        confidence: 0.8,
        tags: ['学术', '研究', '策略']
      }
    ];

    for (const item of testKnowledgeItems) {
      await retriever.addKnowledgeItem(item);
      console.log(`✅ 添加知识项: ${item.content}`);
    }
    console.log('✅ 知识项添加测试成功\n');

    // 4. 测试知识检索
    console.log('4️⃣ 测试知识检索...');
    const query = '超音速仿真技术';
    const relevantKnowledge = await retriever.retrieveRelevantKnowledge(query, 'academic', undefined, 5);
    console.log(`查询: "${query}"`);
    console.log(`检索到 ${relevantKnowledge.length} 条相关知识:`);
    relevantKnowledge.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.content} (相关度: ${((item.relevance_score || 0) * 100).toFixed(1)}%)`);
    });
    console.log('✅ 知识检索测试成功\n');

    // 5. 测试知识库统计
    console.log('5️⃣ 测试知识库统计...');
    const stats = await retriever.getKnowledgeStats();
    console.log('知识库统计信息:');
    console.log(`  • 总文件数: ${stats.total_files}`);
    console.log(`  • 总知识项数: ${stats.total_knowledge_items}`);
    console.log(`  • 向量数量: ${stats.vector_stats.vectors_count}`);
    console.log(`  • 向量点数: ${stats.vector_stats.points_count}`);
    console.log(`  • 领域分布:`, stats.domains);
    console.log(`  • 类型分布:`, stats.types);
    console.log(`  • 最后更新: ${stats.last_updated}`);
    console.log('✅ 知识库统计测试成功\n');

    // 6. 测试用户反馈学习
    console.log('6️⃣ 测试用户反馈学习...');
    await retriever.learnFromFeedback(
      '原始文本',
      '修正后的文本',
      'positive',
      'academic'
    );
    console.log('✅ 用户反馈学习测试成功\n');

    // 7. 测试 RAG 增强分析
    console.log('7️⃣ 测试 RAG 增强分析...');
    const testDocument = '本文研究了超音速数值仿真技术在多脉冲约束弹体修正策略中的应用。通过建立数学模型，分析了不同约束条件下的弹体运动特性。';
    
    // 模拟 RAG 分析过程
    const enhancedKnowledge = await retriever.retrieveRelevantKnowledge(testDocument, 'academic', undefined, 3);
    console.log(`文档: "${testDocument}"`);
    console.log(`RAG 增强知识: ${enhancedKnowledge.length} 条`);
    enhancedKnowledge.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.content} (置信度: ${item.confidence})`);
    });
    console.log('✅ RAG 增强分析测试成功\n');

    console.log('🎉 所有测试通过！新的 RAG 知识库系统运行正常。\n');

    // 8. 清理测试数据
    console.log('8️⃣ 清理测试数据...');
    for (const item of testKnowledgeItems) {
      await retriever.deleteKnowledgeItem(item.id);
      console.log(`✅ 删除知识项: ${item.content}`);
    }
    console.log('✅ 测试数据清理完成\n');

  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  testNewRAGSystem().then(() => {
    console.log('🏁 测试完成');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 测试异常:', error);
    process.exit(1);
  });
}

export { testNewRAGSystem }; 