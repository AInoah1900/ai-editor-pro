const { MultiCollectionDatabaseModels } = require('../lib/database/multi-collection-models');

console.log('🔍 智能检索功能测试');
console.log('===============================\n');

/**
 * 测试用例配置
 */
const testCases = [
    {
        name: '数学领域查询',
        query: '微积分的基本定理和应用',
        expectedDomain: 'mathematics',
        description: '测试数学相关查询的领域识别和检索'
    },
    {
        name: '医学领域查询',
        query: '心脏病的诊断和治疗方法',
        expectedDomain: 'medicine',
        description: '测试医学相关查询的领域识别和检索'
    },
    {
        name: '计算机科学查询',
        query: '机器学习算法的实现原理',
        expectedDomain: 'computer_science',
        description: '测试计算机科学查询的领域识别和检索'
    },
    {
        name: '物理学查询',
        query: '量子力学的基本原理',
        expectedDomain: 'physics',
        description: '测试物理学查询的领域识别和检索'
    },
    {
        name: '通用查询',
        query: '学术论文写作规范',
        expectedDomain: 'general',
        description: '测试通用类查询的检索'
    },
    {
        name: '跨领域查询',
        query: '生物医学工程的发展趋势',
        expectedDomain: 'biomedical_engineering',
        description: '测试跨领域查询的处理'
    }
];

/**
 * 执行智能检索测试
 */
async function runIntelligentSearchTests() {
    console.log('🚀 开始智能检索功能测试...\n');

    let dbModels;
    
    try {
        // 创建多集合数据库模型实例
        dbModels = new MultiCollectionDatabaseModels();
        console.log('✅ 多集合数据库模型创建成功');

        // 1. 系统状态检查
        console.log('\n📊 第1步: 检查系统状态...');
        const statsResult = await dbModels.getMultiCollectionStats();
        
        if (!statsResult.success) {
            console.log('❌ 系统状态检查失败，请确保多集合架构已正确初始化');
            return;
        }

        console.log('✅ 系统状态正常');
        console.log(`   • 活跃集合: ${statsResult.stats.active_collections}个`);
        console.log(`   • 总向量数: ${statsResult.stats.total_vectors}个`);
        console.log(`   • 总知识项: ${statsResult.stats.total_knowledge_items}个`);

        if (statsResult.stats.total_vectors === 0) {
            console.log('\n⚠️  当前系统中没有向量数据，建议先执行数据迁移:');
            console.log('   node scripts/migrate-to-multi-collection.js --force');
            return;
        }

        // 2. 执行测试用例
        console.log('\n🧪 第2步: 执行测试用例...');
        const testResults = [];
        
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`\n[${i + 1}/${testCases.length}] ${testCase.name}`);
            console.log(`   📝 查询: "${testCase.query}"`);
            console.log(`   🎯 期望领域: ${testCase.expectedDomain}`);
            console.log(`   📋 描述: ${testCase.description}`);

            try {
                const startTime = Date.now();
                
                // 执行智能检索
                const searchResult = await dbModels.intelligentSearch(
                    testCase.query,
                    undefined, // 不指定文章领域，让系统自动识别
                    5 // 限制返回5个结果
                );

                const endTime = Date.now();
                const duration = endTime - startTime;

                if (searchResult.success) {
                    console.log(`   ✅ 检索成功 (耗时: ${duration}ms)`);
                    console.log(`   🔍 搜索领域: ${searchResult.search_info.searched_domains.join(', ')}`);
                    console.log(`   📊 结果数量: ${searchResult.results.length}个`);
                    
                    // 显示前3个结果
                    searchResult.results.slice(0, 3).forEach((result, index) => {
                        console.log(`   ${index + 1}. [${result.domain}] ${result.content.substring(0, 60)}... (相似度: ${result.score.toFixed(3)})`);
                    });

                    testResults.push({
                        ...testCase,
                        success: true,
                        duration,
                        searchedDomains: searchResult.search_info.searched_domains,
                        resultCount: searchResult.results.length,
                        topScore: searchResult.results.length > 0 ? searchResult.results[0].score : 0
                    });
                } else {
                    console.log(`   ❌ 检索失败`);
                    testResults.push({
                        ...testCase,
                        success: false,
                        duration,
                        error: '检索失败'
                    });
                }
            } catch (error) {
                console.log(`   ❌ 测试失败: ${error.message}`);
                testResults.push({
                    ...testCase,
                    success: false,
                    error: error.message
                });
            }
        }

        // 3. 生成测试报告
        console.log('\n📈 第3步: 生成测试报告...');
        generateTestReport(testResults);

        // 4. 性能基准测试
        console.log('\n⚡ 第4步: 性能基准测试...');
        await performanceBenchmark(dbModels);

        console.log('\n🎉 智能检索功能测试完成！');
        
    } catch (error) {
        console.error('❌ 测试执行失败:', error);
        
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
 * 生成测试报告
 */
function generateTestReport(testResults) {
    const successCount = testResults.filter(r => r.success).length;
    const failCount = testResults.filter(r => !r.success).length;
    const avgDuration = testResults
        .filter(r => r.duration)
        .reduce((sum, r) => sum + r.duration, 0) / testResults.length;

    console.log('📊 测试报告摘要:');
    console.log(`   ✅ 成功: ${successCount}个测试用例`);
    console.log(`   ❌ 失败: ${failCount}个测试用例`);
    console.log(`   ⏱️  平均响应时间: ${avgDuration.toFixed(0)}ms`);
    console.log(`   🎯 成功率: ${((successCount / testResults.length) * 100).toFixed(1)}%`);

    // 详细结果
    console.log('\n📋 详细测试结果:');
    testResults.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        const duration = result.duration ? `${result.duration}ms` : 'N/A';
        console.log(`   ${status} [${index + 1}] ${result.name} (${duration})`);
        
        if (result.success) {
            console.log(`      🔍 搜索领域: ${result.searchedDomains?.join(', ') || 'N/A'}`);
            console.log(`      📊 结果数: ${result.resultCount || 0}, 最高分: ${result.topScore?.toFixed(3) || 'N/A'}`);
        } else {
            console.log(`      ❌ 错误: ${result.error || '未知错误'}`);
        }
    });

    // 领域识别准确性分析
    console.log('\n🎯 领域识别分析:');
    const domainAccuracy = testResults
        .filter(r => r.success && r.searchedDomains)
        .map(r => ({
            name: r.name,
            expected: r.expectedDomain,
            actual: r.searchedDomains[0], // 主要搜索领域
            match: r.searchedDomains.includes(r.expectedDomain)
        }));

    domainAccuracy.forEach(analysis => {
        const matchIcon = analysis.match ? '✅' : '⚠️';
        console.log(`   ${matchIcon} ${analysis.name}: 期望[${analysis.expected}] 实际[${analysis.actual}]`);
    });

    const accuracyRate = domainAccuracy.filter(a => a.match).length / domainAccuracy.length;
    console.log(`   🎯 领域识别准确率: ${(accuracyRate * 100).toFixed(1)}%`);
}

/**
 * 性能基准测试
 */
async function performanceBenchmark(dbModels) {
    console.log('🏃 执行性能基准测试...');
    
    const benchmarkQuery = '人工智能在医疗诊断中的应用';
    const iterations = 5;
    const durations = [];

    for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        try {
            await dbModels.intelligentSearch(benchmarkQuery, 'medicine', 10);
            const duration = Date.now() - startTime;
            durations.push(duration);
            console.log(`   第${i + 1}次: ${duration}ms`);
        } catch (error) {
            console.log(`   第${i + 1}次: 失败 (${error.message})`);
        }
    }

    if (durations.length > 0) {
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);

        console.log('📊 性能基准结果:');
        console.log(`   ⏱️  平均响应时间: ${avgDuration.toFixed(0)}ms`);
        console.log(`   🚀 最快响应时间: ${minDuration}ms`);
        console.log(`   🐌 最慢响应时间: ${maxDuration}ms`);
        console.log(`   📈 性能稳定性: ${(minDuration/maxDuration * 100).toFixed(1)}%`);

        // 性能评级
        let performanceGrade = 'C';
        if (avgDuration < 500) performanceGrade = 'A';
        else if (avgDuration < 1000) performanceGrade = 'B';
        
        console.log(`   🏆 性能评级: ${performanceGrade}`);
    }
}

/**
 * 显示使用说明
 */
function displayUsageInfo() {
    console.log('📖 智能检索测试说明:');
    console.log('========================');
    console.log('');
    console.log('🎯 测试目标:');
    console.log('   • 验证多集合架构的检索功能');
    console.log('   • 测试智能领域识别准确性');
    console.log('   • 评估检索性能和响应时间');
    console.log('   • 分析不同领域的检索效果');
    console.log('');
    console.log('📋 测试内容:');
    console.log('   • 6个不同领域的测试用例');
    console.log('   • 领域自动识别功能测试');
    console.log('   • 多集合并行搜索验证');
    console.log('   • 性能基准测试');
    console.log('');
    console.log('⚠️  前置条件:');
    console.log('   1. 多集合架构已正确初始化');
    console.log('   2. 已执行数据迁移，系统中有向量数据');
    console.log('   3. Qdrant和PostgreSQL服务正常运行');
    console.log('   4. 向量生成API正常可用');
    console.log('');
}

// 检查命令行参数
const args = process.argv.slice(2);

if (args.includes('--help')) {
    displayUsageInfo();
    process.exit(0);
}

// 显示测试信息
displayUsageInfo();

// 执行测试
runIntelligentSearchTests(); 