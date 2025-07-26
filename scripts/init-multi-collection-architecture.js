const { MultiCollectionDatabaseModels } = require('../lib/database/multi-collection-models');

console.log('🚀 多集合知识库架构初始化脚本');
console.log('================================================\n');

/**
 * 初始化多集合架构
 */
async function initializeMultiCollectionArchitecture() {
    console.log('📚 开始初始化多集合知识库架构...\n');

    let dbModels;
    
    try {
        // 创建多集合数据库模型实例
        dbModels = new MultiCollectionDatabaseModels();
        console.log('✅ 多集合数据库模型创建成功');

        // 1. 初始化多集合架构
        console.log('\n🔧 第1步: 初始化多集合架构...');
        const initResult = await dbModels.initializeMultiCollectionArchitecture();
        
        if (initResult.success) {
            console.log(`✅ ${initResult.message}`);
            console.log(`📊 集合初始化结果:`);
            console.log(`   • 成功: ${initResult.collections_result.success}个集合`);
            console.log(`   • 失败: ${initResult.collections_result.failed}个集合`);
            
            if (initResult.collections_result.failed > 0) {
                console.log('\n❌ 失败的集合:');
                initResult.collections_result.details
                    .filter(detail => detail.status === 'failed')
                    .forEach(detail => {
                        console.log(`   • ${detail.collection} (${detail.domain}): ${detail.error}`);
                    });
            }
        } else {
            console.log(`❌ ${initResult.message}`);
            if (initResult.error) {
                console.log(`   错误: ${initResult.error}`);
            }
            return;
        }

        // 2. 执行健康检查
        console.log('\n🏥 第2步: 执行系统健康检查...');
        const statsResult = await dbModels.getMultiCollectionStats();
        
        if (statsResult.success) {
            const stats = statsResult.stats;
            console.log('✅ 健康检查完成');
            console.log(`📊 系统状态:`);
            console.log(`   • 总集合数: ${stats.total_collections}`);
            console.log(`   • 活跃集合: ${stats.active_collections}`);
            console.log(`   • 空集合: ${stats.empty_collections}`);
            console.log(`   • 总知识项: ${stats.total_knowledge_items}`);
            console.log(`   • 总向量数: ${stats.total_vectors}`);

            // 显示前10个集合的详细状态
            console.log('\n📋 集合详细状态 (前10个):');
            stats.collections_detail.slice(0, 10).forEach(collection => {
                const statusIcon = collection.status === 'active' ? '🟢' : 
                                 collection.status === 'empty' ? '⚪' : '🔴';
                console.log(`   ${statusIcon} ${collection.collection_name} (${collection.domain}): ${collection.vector_count}个向量`);
            });

            if (stats.collections_detail.length > 10) {
                console.log(`   ... 还有${stats.collections_detail.length - 10}个集合`);
            }
        } else {
            console.log(`❌ 健康检查失败: ${statsResult.error}`);
        }

        // 3. 显示使用说明
        console.log('\n📝 使用说明:');
        console.log('1. 多集合架构已成功初始化');
        console.log('2. 共创建63个领域集合（62个学科领域 + 1个通用集合）');
        console.log('3. 添加知识项时会自动识别领域并分配到对应集合');
        console.log('4. 检索时会基于文章领域进行高效的多集合搜索');
        
        console.log('\n🔧 管理命令:');
        console.log('• 查看集合状态: node scripts/multi-collection-health-check.js');
        console.log('• 数据迁移: node scripts/migrate-to-multi-collection.js');
        console.log('• 测试智能检索: node scripts/test-intelligent-search.js');

        console.log('\n🎉 多集合知识库架构初始化完成！');
        
    } catch (error) {
        console.error('❌ 初始化失败:', error);
        
        if (error.stack) {
            console.error('错误堆栈:', error.stack);
        }
        
        process.exit(1);
    } finally {
        if (dbModels) {
            // 关闭数据库连接
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
 * 显示集合架构信息
 */
function displayArchitectureInfo() {
    console.log('🏗️  多集合知识库架构说明:');
    console.log('=================================');
    console.log('');
    console.log('📂 集合结构:');
    console.log('   ├── knowledge_general (通用知识库)');
    console.log('   ├── knowledge_mathematics (数学)');
    console.log('   ├── knowledge_physics (物理学)');
    console.log('   ├── knowledge_chemistry (化学)');
    console.log('   ├── knowledge_biology (生物学)');
    console.log('   ├── knowledge_medicine (医学)');
    console.log('   ├── knowledge_computer_science (计算机科学)');
    console.log('   ├── knowledge_artificial_intelligence (人工智能)');
    console.log('   └── ... (总共63个集合)');
    console.log('');
    console.log('⚡ 性能优势:');
    console.log('   • 精确领域搜索：只搜索相关领域集合');
    console.log('   • 减少检索时间：避免全库搜索');
    console.log('   • 提高准确性：领域特定的向量相似度');
    console.log('   • 智能分配：自动识别知识项所属领域');
    console.log('');
    console.log('🔍 检索策略:');
    console.log('   1. 文章编辑时：搜索[文章领域 + 通用]集合');
    console.log('   2. 智能检索：自动识别查询领域');
    console.log('   3. 并行搜索：多集合同时查询');
    console.log('   4. 结果融合：按相似度排序');
    console.log('');
}

// 显示架构信息
displayArchitectureInfo();

// 检查是否需要跳过初始化
const args = process.argv.slice(2);
if (args.includes('--info-only')) {
    console.log('ℹ️  仅显示架构信息，跳过初始化');
    process.exit(0);
}

// 执行初始化
initializeMultiCollectionArchitecture(); 