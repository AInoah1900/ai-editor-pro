const { MultiCollectionDatabaseModels } = require('../lib/database/multi-collection-models');

console.log('🔄 知识库数据迁移：单集合 → 多集合架构');
console.log('========================================================\n');

/**
 * 执行数据迁移
 */
async function executeDataMigration() {
    console.log('📦 开始数据迁移过程...\n');

    let dbModels;
    
    try {
        // 创建多集合数据库模型实例
        dbModels = new MultiCollectionDatabaseModels();
        console.log('✅ 多集合数据库模型创建成功');

        // 1. 预检查：确保多集合架构已初始化
        console.log('\n🔍 第1步: 预检查多集合架构状态...');
        const statsResult = await dbModels.getMultiCollectionStats();
        
        if (!statsResult.success) {
            console.log('❌ 多集合架构未初始化，请先运行初始化脚本:');
            console.log('   node scripts/init-multi-collection-architecture.js');
            return;
        }

        console.log('✅ 多集合架构状态正常');
        console.log(`📊 当前状态: ${statsResult.stats.total_collections}个集合, ${statsResult.stats.total_vectors}个向量`);

        // 2. 询问用户确认
        console.log('\n⚠️  数据迁移注意事项:');
        console.log('• 此操作将现有知识项重新生成向量并分配到对应领域集合');
        console.log('• 迁移过程中会消耗一定的计算资源');
        console.log('• 迁移完成后建议验证数据完整性');
        console.log('• 原有数据不会被删除，但会增加存储空间使用');

        // 检查命令行参数
        const args = process.argv.slice(2);
        const forceMode = args.includes('--force');
        const dryRun = args.includes('--dry-run');

        if (dryRun) {
            console.log('\n🧪 模拟模式: 仅分析迁移情况，不执行实际迁移');
        } else if (!forceMode) {
            console.log('\n💡 提示: 使用 --force 参数跳过确认，使用 --dry-run 进行模拟');
            console.log('❓ 是否继续执行数据迁移？请手动确认后重新运行脚本并添加 --force 参数');
            return;
        }

        // 3. 执行迁移或模拟
        console.log(`\n🚀 第2步: ${dryRun ? '模拟' : '执行'}数据迁移...`);
        
        if (dryRun) {
            // 模拟模式：只分析不执行
            await performDryRunAnalysis(dbModels);
        } else {
            // 实际迁移
            const migrationResult = await dbModels.migrateToMultiCollection();
            
            console.log('\n📊 迁移结果汇总:');
            console.log(`✅ 成功迁移: ${migrationResult.migrated_count}个知识项`);
            console.log(`❌ 迁移失败: ${migrationResult.failed_count}个知识项`);
            
            if (migrationResult.failed_count > 0) {
                console.log('\n❌ 失败详情:');
                migrationResult.details
                    .filter(detail => detail.status === 'failed')
                    .slice(0, 10) // 只显示前10个失败项
                    .forEach(detail => {
                        console.log(`   • 知识项 ${detail.knowledge_id} → ${detail.target_domain}: ${detail.error}`);
                    });
                
                if (migrationResult.failed_count > 10) {
                    console.log(`   ... 还有${migrationResult.failed_count - 10}个失败项`);
                }
            }

            // 4. 迁移后验证
            console.log('\n🔍 第3步: 迁移后验证...');
            await performPostMigrationValidation(dbModels);
        }

        console.log('\n📝 后续建议:');
        console.log('1. 运行健康检查验证系统状态');
        console.log('2. 测试智能检索功能');
        console.log('3. 在知识库管理界面查看集合分布');
        console.log('4. 根据需要调整领域分类规则');

        console.log('\n🎉 数据迁移过程完成！');
        
    } catch (error) {
        console.error('❌ 数据迁移失败:', error);
        
        if (error.stack) {
            console.error('错误堆栈:', error.stack);
        }
        
        process.exit(1);
    } finally {
        if (dbModels) {
            try {
                process.exit(0);
            } catch (closeError) {
                console.error('关闭数据库连接失败:', closeError);
                process.exit(1);
            }
        }
    }
}

/**
 * 执行模拟分析
 */
async function performDryRunAnalysis(dbModels) {
    try {
        console.log('🔍 分析现有知识项分布...');
        
        // 获取现有知识项
        const knowledgeItems = await dbModels.getKnowledgeItems('', 1000);
        
        console.log(`📋 发现 ${knowledgeItems.knowledge_items.length} 个知识项`);
        
        // 统计按领域分布
        const domainStats = {};
        knowledgeItems.knowledge_items.forEach(item => {
            const domain = item.domain || 'general';
            domainStats[domain] = (domainStats[domain] || 0) + 1;
        });

        console.log('\n📊 按领域分布统计:');
        Object.entries(domainStats)
            .sort(([,a], [,b]) => b - a) // 按数量排序
            .forEach(([domain, count]) => {
                console.log(`   • ${domain}: ${count}个知识项`);
            });

        console.log('\n💡 迁移预测:');
        console.log(`   • 将创建${Object.keys(domainStats).length}个领域的向量集合`);
        console.log(`   • 总计需要生成${knowledgeItems.knowledge_items.length}个向量`);
        console.log(`   • 预计耗时: ${Math.ceil(knowledgeItems.knowledge_items.length * 2 / 60)}分钟`);
        
    } catch (error) {
        console.error('❌ 模拟分析失败:', error);
    }
}

/**
 * 迁移后验证
 */
async function performPostMigrationValidation(dbModels) {
    try {
        console.log('🔍 验证迁移结果...');
        
        // 获取迁移后统计
        const statsResult = await dbModels.getMultiCollectionStats();
        
        if (statsResult.success) {
            const stats = statsResult.stats;
            console.log('✅ 迁移后系统状态:');
            console.log(`   • 活跃集合: ${stats.active_collections}/${stats.total_collections}`);
            console.log(`   • 总向量数: ${stats.total_vectors}`);
            console.log(`   • 总知识项: ${stats.total_knowledge_items}`);
            
            // 检查数据一致性
            const vectorKnowledgeRatio = stats.total_vectors / stats.total_knowledge_items;
            if (vectorKnowledgeRatio >= 0.9 && vectorKnowledgeRatio <= 1.1) {
                console.log('✅ 数据一致性检查通过');
            } else {
                console.log('⚠️  数据一致性异常，向量数与知识项数比例异常');
            }
            
            // 显示活跃集合
            const activeCollections = stats.collections_detail
                .filter(collection => collection.status === 'active')
                .sort((a, b) => b.vector_count - a.vector_count);
                
            console.log('\n📊 活跃集合 (向量数倒序):');
            activeCollections.slice(0, 10).forEach(collection => {
                console.log(`   🟢 ${collection.collection_name}: ${collection.vector_count}个向量`);
            });
            
            if (activeCollections.length > 10) {
                console.log(`   ... 还有${activeCollections.length - 10}个活跃集合`);
            }
        } else {
            console.log('❌ 迁移后验证失败:', statsResult.error);
        }
        
    } catch (error) {
        console.error('❌ 迁移后验证失败:', error);
    }
}

/**
 * 显示使用说明
 */
function displayUsageInfo() {
    console.log('📖 使用说明:');
    console.log('=============');
    console.log('');
    console.log('🔧 命令选项:');
    console.log('   --dry-run    模拟模式，仅分析不执行迁移');
    console.log('   --force      强制执行，跳过用户确认');
    console.log('   --help       显示此帮助信息');
    console.log('');
    console.log('💡 示例用法:');
    console.log('   node scripts/migrate-to-multi-collection.js --dry-run');
    console.log('   node scripts/migrate-to-multi-collection.js --force');
    console.log('');
    console.log('⚠️  注意事项:');
    console.log('   1. 执行前请确保已初始化多集合架构');
    console.log('   2. 迁移过程会消耗向量生成API调用量');
    console.log('   3. 建议先使用 --dry-run 模式分析迁移情况');
    console.log('   4. 迁移完成后建议验证数据完整性');
    console.log('');
}

// 检查命令行参数
const args = process.argv.slice(2);

if (args.includes('--help')) {
    displayUsageInfo();
    process.exit(0);
}

// 执行迁移
executeDataMigration(); 