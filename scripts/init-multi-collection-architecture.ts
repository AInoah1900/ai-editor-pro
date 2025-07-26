import { MultiCollectionDatabaseModels } from '../lib/database/multi-collection-models';

console.log('🚀 多集合知识库架构初始化脚本');
console.log('=' .repeat(60));

function displayArchitectureInfo() {
  console.log('📊 架构信息:');
  console.log('  • 62个一级学科领域集合');
  console.log('  • 1个通用知识库集合');
  console.log('  • 总计63个Qdrant向量集合');
  console.log('  • PostgreSQL + Qdrant混合架构');
  console.log('  • 智能领域识别与自动分类');
  console.log('  • 高效的多领域并行检索');
  console.log('-'.repeat(60));
}

async function initializeMultiCollectionArchitecture() {
  try {
    console.log('🔧 正在初始化多集合知识库架构...');
    displayArchitectureInfo();
    
    // 创建数据库模型实例
    console.log('📝 创建数据库模型实例...');
    const dbModels = new MultiCollectionDatabaseModels();
    
    // 初始化架构
    console.log('🏗️  开始初始化架构...');
    const result = await dbModels.initializeMultiCollectionArchitecture();
    
    if (result.success) {
      console.log('✅ 多集合知识库架构初始化成功!');
      console.log(`📊 ${result.message}`);
      
      if (result.collections_result) {
        const { success, failed, details } = result.collections_result;
        console.log(`\n📈 集合创建统计:`);
        console.log(`  • 成功创建: ${success} 个集合`);
        console.log(`  • 创建失败: ${failed} 个集合`);
        
        if (details && details.length > 0) {
          console.log('\n📋 详细信息:');
          details.forEach((detail: any) => {
            const status = detail.status === 'success' ? '✅' : '❌';
            console.log(`  ${status} ${detail.domain} (${detail.collection})`);
            if (detail.error) {
              console.log(`     错误: ${detail.error}`);
            }
          });
        }
      }
      
      // 获取架构统计信息
      console.log('\n📊 获取架构统计信息...');
      const statsResult = await dbModels.getMultiCollectionStats();
      
      if (statsResult.success) {
        const { stats } = statsResult;
        console.log('\n📈 当前架构状态:');
        console.log(`  • 总集合数: ${stats.total_collections}`);
        console.log(`  • 活跃集合: ${stats.active_collections}`);
        console.log(`  • 空集合: ${stats.empty_collections}`);
        console.log(`  • 总知识项: ${stats.total_knowledge_items}`);
        console.log(`  • 总向量数: ${stats.total_vectors}`);
        
        if (stats.collections_detail && stats.collections_detail.length > 0) {
          console.log('\n📋 集合详情 (前10个):');
          stats.collections_detail.slice(0, 10).forEach((collection: any) => {
            const statusIcon = collection.status === 'active' ? '🟢' : 
                              collection.status === 'empty' ? '🟡' : '🔴';
            console.log(`  ${statusIcon} ${collection.domain}: ${collection.knowledge_count} 知识项, ${collection.vector_count} 向量`);
          });
          
          if (stats.collections_detail.length > 10) {
            console.log(`  ... 还有 ${stats.collections_detail.length - 10} 个集合`);
          }
        }
      }
      
      console.log('\n🎉 多集合知识库架构初始化完成!');
      console.log('💡 下一步: 运行数据迁移脚本将现有知识项迁移到新架构');
      console.log('   命令: npx ts-node scripts/migrate-to-multi-collection.ts');
      
    } else {
      console.error('❌ 多集合知识库架构初始化失败!');
      console.error(`错误: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 初始化过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  initializeMultiCollectionArchitecture()
    .then(() => {
      console.log('🏁 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 脚本执行失败:', error);
      process.exit(1);
    });
} 