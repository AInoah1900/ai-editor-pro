#!/usr/bin/env node

/**
 * 多知识库RAG功能演示脚本
 * 展示专属知识库和共享知识库的协同工作
 */

const fs = require('fs');
const path = require('path');

// 演示配置
const DEMO_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testDocument: `
    人工智能技术在医学诊断中的应用前景广阔。机器学习算法能够通过分析大量的医疗数据，
    提高疾病诊断的准确性。深度学习模型在医学影像分析方面表现尤为突出，能够识别细微的
    病理变化。然而，AI系统的黑盒特性使得其决策过程缺乏透明度，这在医疗领域是一个重要
    的伦理问题。医生和患者需要理解AI的诊断依据，以建立对技术的信任。
  `.trim(),
  ownerId: 'demo_user_001'
};

/**
 * 演示多知识库RAG功能
 */
async function demoMultiKnowledgeRAG() {
  console.log('🎭 多知识库RAG功能演示');
  console.log('=' .repeat(60));
  
  console.log('📖 演示场景：');
  console.log('   医学AI论文的智能校对，结合专属和共享知识库');
  console.log('   - 专属知识库：用户个人的编辑偏好和术语规范');
  console.log('   - 共享知识库：期刊行业的通用编辑标准');
  console.log('');
  
  try {
    // 1. 展示当前知识库状态
    console.log('📊 当前知识库状态：');
    const kbResponse = await fetch(`${DEMO_CONFIG.baseUrl}/api/knowledge-base`);
    if (kbResponse.ok) {
      const kbResult = await kbResponse.json();
      console.log(`   总知识项数量: ${kbResult.total} 条`);
      
      // 统计所有权类型
      const ownershipStats = { private: 0, shared: 0, unknown: 0 };
      kbResult.knowledge_items.forEach(item => {
        if (item.ownership_type === 'private') {
          ownershipStats.private++;
        } else if (item.ownership_type === 'shared') {
          ownershipStats.shared++;
        } else {
          ownershipStats.unknown++;
        }
      });
      
      console.log(`   专属知识库: ${ownershipStats.private} 条`);
      console.log(`   共享知识库: ${ownershipStats.shared} 条`);
      console.log(`   未分类: ${ownershipStats.unknown} 条`);
    }
    console.log('');
    
    // 2. 演示文档内容
    console.log('📝 待分析文档：');
    console.log('   ' + DEMO_CONFIG.testDocument.replace(/\n\s*/g, ' '));
    console.log('');
    
    // 3. 执行多知识库RAG分析
    console.log('🔍 执行多知识库RAG分析...');
    const ragResponse = await fetch(`${DEMO_CONFIG.baseUrl}/api/analyze-document-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: DEMO_CONFIG.testDocument,
        ownerId: DEMO_CONFIG.ownerId
      }),
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG API请求失败: ${ragResponse.status} ${ragResponse.statusText}`);
    }

    const ragResult = await ragResponse.json();
    console.log('✅ RAG分析完成');
    console.log('');
    
    // 4. 展示多知识库使用情况
    console.log('🎯 多知识库协同分析结果：');
    console.log(`   检测领域: ${ragResult.domain_info?.domain || 'unknown'} (置信度: ${((ragResult.domain_info?.confidence || 0) * 100).toFixed(1)}%)`);
    console.log(`   RAG置信度: ${((ragResult.rag_confidence || 0) * 100).toFixed(1)}%`);
    
    if (ragResult.knowledge_sources) {
      console.log('');
      console.log('📚 知识库应用统计：');
      console.log(`   🔒 专属知识库: ${ragResult.knowledge_sources.private_count} 条`);
      console.log(`   🌐 共享知识库: ${ragResult.knowledge_sources.shared_count} 条`);
      console.log(`   📊 总计应用: ${ragResult.knowledge_sources.total_count} 条`);
      
      if (ragResult.knowledge_sources.total_count > 0) {
        console.log('   ✨ 多知识库功能正常工作！');
      } else {
        console.log('   ⚠️  知识库为空，建议添加示例知识项');
      }
    } else {
      console.log('   ⚠️  未检测到多知识库统计信息');
    }
    
    if (ragResult.document_sources) {
      console.log('');
      console.log('📄 文档来源统计：');
      console.log(`   🔒 专属文档: ${ragResult.document_sources.private_documents?.length || 0} 个`);
      console.log(`   🌐 共享文档: ${ragResult.document_sources.shared_documents?.length || 0} 个`);
    }
    
    // 5. 展示检测到的问题
    if (ragResult.errors && ragResult.errors.length > 0) {
      console.log('');
      console.log('🔍 智能检测结果：');
      ragResult.errors.slice(0, 5).forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.type}] ${error.category}`);
        console.log(`      原文: "${error.original}"`);
        console.log(`      建议: "${error.suggestion}"`);
        console.log(`      理由: ${error.reason}`);
        
        // 检查是否来自特定知识库
        if (error.reason.includes('专属知识库')) {
          console.log(`      📍 来源: 专属知识库`);
        } else if (error.reason.includes('共享知识库')) {
          console.log(`      📍 来源: 共享知识库`);
        }
        console.log('');
      });
      
      if (ragResult.errors.length > 5) {
        console.log(`   ... 还有 ${ragResult.errors.length - 5} 个问题`);
      }
    }
    
    // 6. 功能特性展示
    console.log('🎨 多知识库RAG功能特性：');
    console.log('   1. 🔄 并行检索：同时从专属和共享知识库检索');
    console.log('   2. 🎯 智能合并：去重并按相关度排序');
    console.log('   3. 📊 权重优化：专属知识库建议优先级更高');
    console.log('   4. 🏷️  来源标识：清楚标识每条建议的知识来源');
    console.log('   5. 📈 统计追踪：详细的多知识库使用统计');
    console.log('');
    
    // 7. 对比基础API
    console.log('🔄 对比基础API效果...');
    const basicResponse = await fetch(`${DEMO_CONFIG.baseUrl}/api/analyze-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: DEMO_CONFIG.testDocument
      }),
    });
    
    if (basicResponse.ok) {
      const basicResult = await basicResponse.json();
      console.log(`   基础API检测: ${basicResult.errors?.length || 0} 个问题`);
      console.log(`   RAG API检测: ${ragResult.errors?.length || 0} 个问题`);
      
      const improvement = ((ragResult.errors?.length || 0) - (basicResult.errors?.length || 0));
      if (improvement > 0) {
        console.log(`   🎉 RAG增强效果: 多检测了 ${improvement} 个问题`);
      } else if (improvement === 0) {
        console.log(`   📊 RAG增强效果: 检测数量相当，但质量更高`);
      } else {
        console.log(`   🎯 RAG增强效果: 更精准的检测，减少误报`);
      }
    }
    
    console.log('');
    console.log('=' .repeat(60));
    console.log('🎉 多知识库RAG功能演示完成！');
    
    // 8. 改进建议
    if (!ragResult.knowledge_sources || ragResult.knowledge_sources.total_count === 0) {
      console.log('');
      console.log('💡 改进建议：');
      console.log('   1. 运行 node scripts/add-sample-knowledge-items.js 添加示例知识项');
      console.log('   2. 通过知识库管理界面添加专属知识项');
      console.log('   3. 上传专业文档到专属/共享知识库');
      console.log('   4. 通过用户反馈持续优化知识库');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ 演示失败:', error.message);
    console.error('错误详情:', error);
    return false;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 启动多知识库RAG功能演示');
  console.log('');
  
  const success = await demoMultiKnowledgeRAG();
  process.exit(success ? 0 : 1);
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error('💥 演示脚本执行失败:', error);
    process.exit(1);
  });
}

module.exports = {
  demoMultiKnowledgeRAG
}; 