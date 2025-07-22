/**
 * 期刊领域API功能测试脚本
 * 测试所有期刊领域相关的API接口功能
 */

const fetch = require('node-fetch');

// 测试配置
const CONFIG = {
  baseUrl: 'http://localhost:3000'
};

let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  results: []
};

/**
 * 执行单个测试
 */
async function runTest(testName, testFunction) {
  testResults.total++;
  console.log(`\n🧪 执行测试: ${testName}`);
  
  try {
    await testFunction();
    testResults.passed++;
    testResults.results.push({ name: testName, status: 'PASSED' });
    console.log(`✅ 测试通过: ${testName}`);
  } catch (error) {
    testResults.failed++;
    testResults.results.push({ name: testName, status: 'FAILED', error: error.message });
    console.log(`❌ 测试失败: ${testName}`);
    console.log(`   错误信息: ${error.message}`);
  }
}

/**
 * 测试获取所有期刊领域
 */
async function testGetAllDomains() {
  const response = await fetch(`${CONFIG.baseUrl}/api/journal-domains`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`获取期刊领域失败: ${data.error}`);
  }
  
  if (!data.success || !data.data || !Array.isArray(data.data.domains)) {
    throw new Error('返回数据格式不正确');
  }
  
  if (data.data.domains.length < 60) {
    throw new Error(`期刊领域数量不足，期望至少60个，实际: ${data.data.domains.length}`);
  }
  
  console.log(`   📊 获取到 ${data.data.domains.length} 个期刊领域`);
  
  // 验证必要字段
  const firstDomain = data.data.domains[0];
  if (!firstDomain.code || !firstDomain.name || !firstDomain.category_name) {
    throw new Error('期刊领域缺少必要字段');
  }
  
  console.log(`   💡 示例领域: ${firstDomain.name} (${firstDomain.category_name})`);
}

/**
 * 测试按类别获取期刊领域
 */
async function testGetDomainsByCategory() {
  const response = await fetch(`${CONFIG.baseUrl}/api/journal-domains?category=natural_science`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`按类别获取期刊领域失败: ${data.error}`);
  }
  
  if (!data.success || !data.data || !Array.isArray(data.data.domains)) {
    throw new Error('返回数据格式不正确');
  }
  
  if (data.data.domains.length === 0) {
    throw new Error('自然科学类别下应该有期刊领域');
  }
  
  // 验证所有返回的领域都属于指定类别
  const wrongCategory = data.data.domains.find(domain => domain.category !== 'natural_science');
  if (wrongCategory) {
    throw new Error(`返回了错误类别的领域: ${wrongCategory.name} (${wrongCategory.category})`);
  }
  
  console.log(`   📚 自然科学类别下有 ${data.data.domains.length} 个期刊领域`);
  console.log(`   💡 示例: ${data.data.domains.slice(0, 3).map(d => d.name).join(', ')}`);
}

/**
 * 测试期刊领域搜索功能
 */
async function testSearchDomains() {
  const response = await fetch(`${CONFIG.baseUrl}/api/journal-domains?search=计算机`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`搜索期刊领域失败: ${data.error}`);
  }
  
  if (!data.success || !data.data || !Array.isArray(data.data.domains)) {
    throw new Error('返回数据格式不正确');
  }
  
  if (data.data.domains.length === 0) {
    throw new Error('搜索"计算机"应该返回结果');
  }
  
  // 验证搜索结果包含搜索关键词
  const relevantResults = data.data.domains.filter(domain => 
    domain.name.includes('计算机') || 
    domain.description?.includes('计算机') || 
    domain.code.includes('computer')
  );
  
  if (relevantResults.length === 0) {
    throw new Error('搜索结果与关键词不匹配');
  }
  
  console.log(`   🔍 搜索"计算机"找到 ${data.data.domains.length} 个相关领域`);
  console.log(`   💡 匹配结果: ${relevantResults.slice(0, 2).map(d => d.name).join(', ')}`);
}

/**
 * 测试分组格式返回
 */
async function testGroupedFormat() {
  const response = await fetch(`${CONFIG.baseUrl}/api/journal-domains?format=grouped`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`获取分组格式失败: ${data.error}`);
  }
  
  if (!data.success || !data.data || !Array.isArray(data.data.categories)) {
    throw new Error('分组格式返回数据不正确');
  }
  
  if (data.data.categories.length < 4) {
    throw new Error(`类别数量不足，期望至少4个，实际: ${data.data.categories.length}`);
  }
  
  // 验证每个类别都有领域
  const emptyCategory = data.data.categories.find(cat => cat.domains.length === 0);
  if (emptyCategory) {
    throw new Error(`类别 ${emptyCategory.category_name} 下没有期刊领域`);
  }
  
  console.log(`   📋 共 ${data.data.categories.length} 个期刊类别`);
  for (const category of data.data.categories.slice(0, 3)) {
    console.log(`      • ${category.category_name}: ${category.domain_count}个领域`);
  }
}

/**
 * 测试简化格式返回
 */
async function testSimpleFormat() {
  const response = await fetch(`${CONFIG.baseUrl}/api/journal-domains?format=simple`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`获取简化格式失败: ${data.error}`);
  }
  
  if (!data.success || !data.data || !Array.isArray(data.data.domains)) {
    throw new Error('简化格式返回数据不正确');
  }
  
  // 验证简化格式只包含基本字段
  const firstDomain = data.data.domains[0];
  if (!firstDomain.code || !firstDomain.name || !firstDomain.category_name) {
    throw new Error('简化格式缺少基本字段');
  }
  
  if (firstDomain.description || firstDomain.sort_order) {
    throw new Error('简化格式不应包含详细字段');
  }
  
  console.log(`   📝 简化格式包含 ${data.data.domains.length} 个期刊领域的基本信息`);
  console.log(`   💡 示例: ${firstDomain.code} - ${firstDomain.name}`);
}

/**
 * 测试错误处理
 */
async function testErrorHandling() {
  // 测试无效的类别
  const response1 = await fetch(`${CONFIG.baseUrl}/api/journal-domains?category=invalid_category`);
  const data1 = await response1.json();
  
  if (!response1.ok) {
    throw new Error('无效类别应该返回200状态码但数据为空');
  }
  
  if (data1.data.domains.length > 0) {
    throw new Error('无效类别不应该返回数据');
  }
  
  console.log('   ✅ 无效类别正确处理');
  
  // 测试空搜索
  const response2 = await fetch(`${CONFIG.baseUrl}/api/journal-domains?search=不存在的领域xyz123`);
  const data2 = await response2.json();
  
  if (!response2.ok) {
    throw new Error('无匹配搜索应该返回200状态码但数据为空');
  }
  
  if (data2.data.domains.length > 0) {
    throw new Error('无匹配搜索不应该返回数据');
  }
  
  console.log('   ✅ 无匹配搜索正确处理');
}

/**
 * 检查服务器是否运行
 */
async function checkServerStatus() {
  try {
    const response = await fetch(`${CONFIG.baseUrl}/api/journal-domains`);
    if (!response.ok && response.status !== 404) {
      throw new Error(`服务器响应异常: ${response.status}`);
    }
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('无法连接到服务器，请确保 Next.js 开发服务器正在运行');
    }
    throw error;
  }
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log('🚀 开始测试期刊领域API...\n');
  console.log(`📡 测试服务器: ${CONFIG.baseUrl}\n`);
  
  // 检查服务器状态
  await runTest('服务器连接检查', checkServerStatus);
  
  // 执行API功能测试
  await runTest('获取所有期刊领域', testGetAllDomains);
  await runTest('按类别获取期刊领域', testGetDomainsByCategory);
  await runTest('期刊领域搜索功能', testSearchDomains);
  await runTest('分组格式返回', testGroupedFormat);
  await runTest('简化格式返回', testSimpleFormat);
  await runTest('错误处理机制', testErrorHandling);
  
  // 显示测试结果总结
  console.log('\n' + '='.repeat(60));
  console.log('🧪 测试结果总结');
  console.log('='.repeat(60));
  console.log(`总测试数: ${testResults.total}`);
  console.log(`✅ 通过: ${testResults.passed}`);
  console.log(`❌ 失败: ${testResults.failed}`);
  console.log(`📊 成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ 失败的测试：');
    testResults.results
      .filter(result => result.status === 'FAILED')
      .forEach(result => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
  }
  
  if (testResults.failed === 0) {
    console.log('\n🎉 所有测试都通过了！期刊领域API工作正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查系统配置。');
  }
  
  console.log('\n📝 使用提示：');
  console.log('1. 确保 Next.js 开发服务器正在运行 (npm run dev)');
  console.log('2. 确保期刊领域数据库已初始化 (node scripts/init-journal-domains.js)');
  console.log('3. 检查 .env.local 文件中的数据库配置');
  console.log('4. API端点汇总：');
  console.log('   - GET /api/journal-domains (获取所有领域)');
  console.log('   - GET /api/journal-domains?category=xxx (按类别获取)');
  console.log('   - GET /api/journal-domains?search=xxx (搜索领域)');
  console.log('   - GET /api/journal-domains?format=grouped (分组格式)');
  console.log('   - GET /api/journal-domains?format=simple (简化格式)');
}

// 运行测试
if (require.main === module) {
  runAllTests()
    .then(() => {
      process.exit(testResults.failed === 0 ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ 测试执行过程发生错误:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testResults }; 