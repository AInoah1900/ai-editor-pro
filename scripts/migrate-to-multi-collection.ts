import { MultiCollectionDatabaseModels } from '../lib/database/multi-collection-models';

console.log('🔄 知识库数据迁移：单集合 → 多集合架构');
console.log('=' .repeat(60));

async function executeDataMigration() {
  try {
    console.log('🚀 开始数据迁移过程...');
    
    // 创建数据库模型实例
    console.log('📝 创建数据库模型实例...');
    const dbModels = new MultiCollectionDatabaseModels();
    
    // 检查命令行参数
    const args = process.argv.slice(2);
    const isDryRun = !args.includes('--force');
    
    if (isDryRun) {
      console.log('🔍 执行预检查模式 (Dry Run)...');
      console.log('💡 使用 --force 参数执行实际迁移');
      await performDryRunAnalysis(dbModels);
      return;
    }
    
    console.log('⚡ 执行强制迁移模式...');
    console.log('⚠️  这将修改数据库中的数据!');
    
    // 执行迁移
    console.log('🔄 开始迁移现有知识项...');
    const migrationResult = await dbModels.migrateToMultiCollection();
    
    if (migrationResult.success) {
      console.log('✅ 数据迁移成功完成!');
      console.log(`📊 迁移统计:`);
      console.log(`  • 成功迁移: ${migrationResult.migrated_count} 个知识项`);
      console.log(`  • 迁移失败: ${migrationResult.failed_count} 个知识项`);
      console.log(`📝 ${migrationResult.message}`);
      
      if (migrationResult.details && migrationResult.details.length > 0) {
        console.log('\n📋 迁移详情:');
        
        // 显示成功的迁移
        const successful = migrationResult.details.filter(d => d.status === 'success');
        const failed = migrationResult.details.filter(d => d.status === 'failed');
        
        if (successful.length > 0) {
          console.log(`\n✅ 成功迁移 (${successful.length} 项):`);
          successful.slice(0, 10).forEach(detail => {
            console.log(`  • ${detail.knowledge_id} → ${detail.target_domain}`);
          });
          if (successful.length > 10) {
            console.log(`  ... 还有 ${successful.length - 10} 项成功迁移`);
          }
        }
        
        if (failed.length > 0) {
          console.log(`\n❌ 迁移失败 (${failed.length} 项):`);
          failed.forEach(detail => {
            console.log(`  • ${detail.knowledge_id}: ${detail.error}`);
          });
        }
      }
      
      // 执行迁移后验证
      console.log('\n🔍 执行迁移后验证...');
      await performPostMigrationValidation(dbModels);
      
    } else {
      console.error('❌ 数据迁移失败!');
      console.error(`错误: ${migrationResult.message}`);
      
      if (migrationResult.details && migrationResult.details.length > 0) {
        console.log('\n📋 失败详情:');
        migrationResult.details.forEach(detail => {
          if (detail.status === 'failed') {
            console.log(`  • ${detail.knowledge_id}: ${detail.error}`);
          }
        });
      }
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 迁移过程中发生错误:', error);
    process.exit(1);
  }
}

async function performDryRunAnalysis(dbModels: MultiCollectionDatabaseModels) {
  try {
    console.log('📊 分析现有知识库数据...');
    
    // 获取当前统计信息
    const statsResult = await dbModels.getMultiCollectionStats();
    
    if (statsResult.success) {
      const { stats } = statsResult;
      console.log('\n📈 当前知识库状态:');
      console.log(`  • 总知识项: ${stats.total_knowledge_items}`);
      console.log(`  • 总向量数: ${stats.total_vectors}`);
      console.log(`  • 活跃集合: ${stats.active_collections}/${stats.total_collections}`);
      
      if (stats.collections_detail && stats.collections_detail.length > 0) {
        console.log('\n📋 集合分布:');
        const activeCollections = stats.collections_detail.filter(c => c.status === 'active');
        const emptyCollections = stats.collections_detail.filter(c => c.status === 'empty');
        
        console.log(`  🟢 活跃集合 (${activeCollections.length}):`);
        activeCollections.slice(0, 5).forEach(collection => {
          console.log(`    • ${collection.domain}: ${collection.knowledge_count} 知识项`);
        });
        if (activeCollections.length > 5) {
          console.log(`    ... 还有 ${activeCollections.length - 5} 个活跃集合`);
        }
        
        console.log(`  🟡 空集合: ${emptyCollections.length} 个`);
      }
    }
    
    console.log('\n💡 预检查完成');
    console.log('📝 如需执行实际迁移，请运行: npx ts-node scripts/migrate-to-multi-collection.ts --force');
    
  } catch (error) {
    console.error('❌ 预检查失败:', error);
  }
}

async function performPostMigrationValidation(dbModels: MultiCollectionDatabaseModels) {
  try {
    console.log('🔍 执行迁移后数据验证...');
    
    // 获取迁移后统计信息
    const statsResult = await dbModels.getMultiCollectionStats();
    
    if (statsResult.success) {
      const { stats } = statsResult;
      console.log('\n📊 迁移后状态:');
      console.log(`  • 总知识项: ${stats.total_knowledge_items}`);
      console.log(`  • 总向量数: ${stats.total_vectors}`);
      console.log(`  • 活跃集合: ${stats.active_collections}/${stats.total_collections}`);
      
      // 验证数据完整性
      if (stats.total_knowledge_items === stats.total_vectors) {
        console.log('✅ 数据完整性验证通过: 知识项数量与向量数量一致');
      } else {
        console.log('⚠️  数据完整性警告: 知识项数量与向量数量不一致');
      }
      
      if (stats.active_collections > 0) {
        console.log('✅ 集合状态验证通过: 存在活跃集合');
      } else {
        console.log('⚠️  集合状态警告: 没有活跃集合');
      }
      
      console.log('\n🎉 迁移验证完成!');
      console.log('💡 下一步: 运行智能检索测试');
      console.log('   命令: npx ts-node scripts/test-intelligent-search.ts');
      
    } else {
      console.error('❌ 迁移验证失败:', statsResult.error);
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
  }
}

function displayUsageInfo() {
  console.log('\n📖 使用说明:');
  console.log('  预检查模式: npx ts-node scripts/migrate-to-multi-collection.ts');
  console.log('  强制迁移: npx ts-node scripts/migrate-to-multi-collection.ts --force');
  console.log('\n⚠️  注意事项:');
  console.log('  • 预检查模式不会修改任何数据，仅分析现状');
  console.log('  • 强制迁移模式会实际修改数据库数据');
  console.log('  • 建议先运行预检查，确认无误后再执行强制迁移');
}

// 执行迁移
if (require.main === module) {
  displayUsageInfo();
  
  executeDataMigration()
    .then(() => {
      console.log('🏁 迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 迁移脚本执行失败:', error);
      process.exit(1);
    });
} 