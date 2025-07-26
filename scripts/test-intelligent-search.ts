import { MultiCollectionDatabaseModels } from '../lib/database/multi-collection-models';

console.log('🔍 智能检索功能测试');
console.log('=' .repeat(60));

interface TestCase {
  name: string;
  query: string;
  expectedDomains?: string[];
  articleDomain?: string;
  limit?: number;
}

const testCases: TestCase[] = [
  {
    name: '计算机科学查询',
    query: '机器学习算法优化',
    expectedDomains: ['081200', 'general'],
    articleDomain: '081200',
    limit: 5
  },
  {
    name: '医学研究查询',
    query: '心血管疾病治疗方法',
    expectedDomains: ['100100', 'general'],
    articleDomain: '100100',
    limit: 5
  },
  {
    name: '物理学查询',
    query: '量子力学基本原理',
    expectedDomains: ['070200', 'general'],
    articleDomain: '070200',
    limit: 5
  },
  {
    name: '经济学查询',
    query: '宏观经济政策分析',
    expectedDomains: ['020100', 'general'],
    articleDomain: '020100',
    limit: 5
  },
  {
    name: '跨领域查询',
    query: '人工智能在医疗中的应用',
    expectedDomains: ['081200', '100100', 'general'],
    limit: 10
  },
  {
    name: '通用查询',
    query: '研究方法论',
    expectedDomains: ['general'],
    limit: 8
  },
  {
    name: '材料科学查询',
    query: '纳米材料合成技术',
    expectedDomains: ['080500', 'general'],
    articleDomain: '080500',
    limit: 6
  },
  {
    name: '教育学查询',
    query: '在线教育平台设计',
    expectedDomains: ['040100', 'general'],
    articleDomain: '040100',
    limit: 5
  }
];

async function runIntelligentSearchTests() {
  try {
    console.log('🚀 开始智能检索功能测试...');
    
    // 创建数据库模型实例
    console.log('📝 创建数据库模型实例...');
    const dbModels = new MultiCollectionDatabaseModels();
    
    // 获取系统状态
    console.log('📊 获取系统状态...');
    const statsResult = await dbModels.getMultiCollectionStats();
    
    if (!statsResult.success) {
      console.error('❌ 无法获取系统状态:', statsResult.error);
      process.exit(1);
    }
    
    const { stats } = statsResult;
    console.log('\n📈 当前系统状态:');
    console.log(`  • 总知识项: ${stats.total_knowledge_items}`);
    console.log(`  • 活跃集合: ${stats.active_collections}/${stats.total_collections}`);
    
    if (stats.total_knowledge_items === 0) {
      console.log('⚠️  系统中暂无知识项，测试结果可能为空');
      console.log('💡 建议先运行数据迁移或添加一些测试数据');
    }
    
    console.log('\n🧪 开始执行测试用例...');
    console.log('-'.repeat(60));
    
    const testResults: any[] = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🔍 测试 ${i + 1}/${testCases.length}: ${testCase.name}`);
      console.log(`📝 查询: "${testCase.query}"`);
      
      if (testCase.articleDomain) {
        console.log(`🎯 文章领域: ${testCase.articleDomain}`);
      }
      
      const startTime = Date.now();
      
      try {
        const searchResult = await dbModels.intelligentSearch(
          testCase.query,
          testCase.articleDomain,
          testCase.limit
        );
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (searchResult.success) {
          console.log(`✅ 搜索成功 (${duration}ms)`);
          console.log(`📊 结果统计:`);
          console.log(`  • 总结果数: ${searchResult.results.length}`);
          console.log(`  • 搜索领域: ${searchResult.search_info.searched_domains.join(', ')}`);
          console.log(`  • 向量长度: ${searchResult.search_info.query_vector_length}`);
          
          if (searchResult.results.length > 0) {
            console.log(`📋 前3个结果:`);
            searchResult.results.slice(0, 3).forEach((result, idx) => {
              console.log(`  ${idx + 1}. [${result.domain}] 相似度: ${result.score.toFixed(4)}`);
              console.log(`     内容预览: ${result.content.substring(0, 100)}...`);
            });
            
            // 验证领域分布
            const domainDistribution: Record<string, number> = {};
            searchResult.results.forEach(result => {
              domainDistribution[result.domain] = (domainDistribution[result.domain] || 0) + 1;
            });
            
            console.log(`🎯 领域分布:`);
            Object.entries(domainDistribution).forEach(([domain, count]) => {
              console.log(`  • ${domain}: ${count} 项`);
            });
          }
          
          testResults.push({
            name: testCase.name,
            query: testCase.query,
            success: true,
            duration,
            resultCount: searchResult.results.length,
            searchedDomains: searchResult.search_info.searched_domains,
            domainDistribution: searchResult.results.reduce((acc: Record<string, number>, result) => {
              acc[result.domain] = (acc[result.domain] || 0) + 1;
              return acc;
            }, {})
          });
          
        } else {
          console.log(`❌ 搜索失败: ${searchResult.error || '未知错误'}`);
          testResults.push({
            name: testCase.name,
            query: testCase.query,
            success: false,
            duration,
            error: searchResult.error
          });
        }
        
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`💥 测试异常: ${error}`);
        testResults.push({
          name: testCase.name,
          query: testCase.query,
          success: false,
          duration,
          error: String(error)
        });
      }
      
      console.log('-'.repeat(40));
    }
    
    // 生成测试报告
    console.log('\n📊 生成测试报告...');
    generateTestReport(testResults);
    
    // 性能基准测试
    console.log('\n⚡ 执行性能基准测试...');
    await performanceBenchmark(dbModels);
    
    console.log('\n🎉 智能检索功能测试完成!');
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
    process.exit(1);
  }
}

function generateTestReport(testResults: any[]) {
  console.log('\n📈 测试报告');
  console.log('=' .repeat(60));
  
  const successfulTests = testResults.filter(r => r.success);
  const failedTests = testResults.filter(r => !r.success);
  
  console.log(`📊 总体统计:`);
  console.log(`  • 总测试数: ${testResults.length}`);
  console.log(`  • 成功测试: ${successfulTests.length} (${(successfulTests.length / testResults.length * 100).toFixed(1)}%)`);
  console.log(`  • 失败测试: ${failedTests.length} (${(failedTests.length / testResults.length * 100).toFixed(1)}%)`);
  
  if (successfulTests.length > 0) {
    const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    const avgResults = successfulTests.reduce((sum, r) => sum + r.resultCount, 0) / successfulTests.length;
    
    console.log(`\n⚡ 性能指标:`);
    console.log(`  • 平均响应时间: ${avgDuration.toFixed(0)}ms`);
    console.log(`  • 平均结果数: ${avgResults.toFixed(1)} 项`);
    
    console.log(`\n✅ 成功测试详情:`);
    successfulTests.forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.name}`);
      console.log(`     响应时间: ${result.duration}ms, 结果数: ${result.resultCount}`);
      console.log(`     搜索领域: ${result.searchedDomains.join(', ')}`);
    });
  }
  
  if (failedTests.length > 0) {
    console.log(`\n❌ 失败测试详情:`);
    failedTests.forEach((result, idx) => {
      console.log(`  ${idx + 1}. ${result.name}`);
      console.log(`     错误: ${result.error}`);
    });
  }
  
  console.log('\n💡 建议:');
  if (failedTests.length > 0) {
    console.log('  • 检查失败的测试用例，确认系统配置正确');
    console.log('  • 验证数据库连接和Qdrant服务状态');
  }
  if (successfulTests.length > 0 && successfulTests.some(r => r.resultCount === 0)) {
    console.log('  • 部分查询返回空结果，考虑添加更多测试数据');
  }
  if (successfulTests.length > 0) {
    const slowTests = successfulTests.filter(r => r.duration > 1000);
    if (slowTests.length > 0) {
      console.log('  • 部分查询响应较慢，考虑优化向量检索性能');
    }
  }
}

async function performanceBenchmark(dbModels: MultiCollectionDatabaseModels) {
  try {
    console.log('🏃‍♂️ 执行性能基准测试...');
    
    const benchmarkQuery = '人工智能技术发展趋势';
    const iterations = 5;
    const durations: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      console.log(`  测试轮次 ${i + 1}/${iterations}...`);
      
      const startTime = Date.now();
      const result = await dbModels.intelligentSearch(benchmarkQuery, undefined, 10);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      durations.push(duration);
      
      if (result.success) {
        console.log(`    ✅ ${duration}ms (${result.results.length} 结果)`);
      } else {
        console.log(`    ❌ ${duration}ms (失败)`);
      }
    }
    
    if (durations.length > 0) {
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      console.log('\n📊 性能基准结果:');
      console.log(`  • 平均响应时间: ${avgDuration.toFixed(0)}ms`);
      console.log(`  • 最快响应时间: ${minDuration}ms`);
      console.log(`  • 最慢响应时间: ${maxDuration}ms`);
      console.log(`  • 响应时间标准差: ${Math.sqrt(durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length).toFixed(0)}ms`);
      
      if (avgDuration < 500) {
        console.log('  🚀 性能优秀: 平均响应时间 < 500ms');
      } else if (avgDuration < 1000) {
        console.log('  ✅ 性能良好: 平均响应时间 < 1s');
      } else {
        console.log('  ⚠️  性能需要优化: 平均响应时间 > 1s');
      }
    }
    
  } catch (error) {
    console.error('❌ 性能基准测试失败:', error);
  }
}

function displayUsageInfo() {
  console.log('\n📖 使用说明:');
  console.log('  基本测试: npx ts-node scripts/test-intelligent-search.ts');
  console.log('\n🧪 测试内容:');
  console.log('  • 多领域智能检索测试');
  console.log('  • 跨领域查询测试');
  console.log('  • 性能基准测试');
  console.log('  • 结果质量分析');
  console.log('\n💡 测试前准备:');
  console.log('  • 确保多集合架构已初始化');
  console.log('  • 确保已完成数据迁移');
  console.log('  • 确保Qdrant和PostgreSQL服务正常');
}

// 执行测试
if (require.main === module) {
  displayUsageInfo();
  
  runIntelligentSearchTests()
    .then(() => {
      console.log('🏁 测试脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 测试脚本执行失败:', error);
      process.exit(1);
    });
} 