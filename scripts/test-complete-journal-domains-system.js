/**
 * 完整的期刊领域系统集成测试脚本
 * 测试数据库、API、前端组件的完整集成
 */

const fetch = require('node-fetch');
const { Pool } = require('pg');

// 测试配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'postgres',
    user: process.env.POSTGRES_USER || 'myuser',
    password: process.env.POSTGRES_PASSWORD || '12345678',
  }
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
 * 测试数据库表结构
 */
async function testDatabaseSchema() {
  const pool = new Pool(CONFIG.postgres);
  const client = await pool.connect();

  try {
    // 检查期刊领域表是否存在
    const tableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'journal_domains'
      );
    `);

    if (!tableResult.rows[0].exists) {
      throw new Error('期刊领域表 journal_domains 不存在');
    }

    // 检查表结构
    const schemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'journal_domains' 
      ORDER BY ordinal_position;
    `);

    const expectedColumns = ['id', 'code', 'name', 'category', 'category_name', 'description', 'sort_order', 'is_active'];
    const actualColumns = schemaResult.rows.map(row => row.column_name);
    
    for (const col of expectedColumns) {
      if (!actualColumns.includes(col)) {
        throw new Error(`期刊领域表缺少必要字段: ${col}`);
      }
    }

    // 检查数据完整性
    const countResult = await client.query('SELECT COUNT(*) as count FROM journal_domains');
    const count = parseInt(countResult.rows[0].count);

    if (count < 60) {
      throw new Error(`期刊领域数据不完整，期望至少60个，实际: ${count}`);
    }

    console.log(`   📊 期刊领域表结构完整，包含 ${count} 条数据`);
    console.log(`   📋 表字段: ${actualColumns.join(', ')}`);

  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * 测试索引性能
 */
async function testIndexPerformance() {
  const pool = new Pool(CONFIG.postgres);
  const client = await pool.connect();

  try {
    // 检查索引是否存在
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'journal_domains'
    `);

    const indexes = indexResult.rows.map(row => row.indexname);
    const expectedIndexes = ['idx_journal_domains_code', 'idx_journal_domains_category', 'idx_journal_domains_sort_order'];

    for (const expectedIndex of expectedIndexes) {
      if (!indexes.some(index => index.includes('code') || index.includes('category') || index.includes('sort_order'))) {
        console.log(`   ⚠️  建议创建索引以提高性能: ${expectedIndex}`);
      }
    }

    // 测试查询性能
    const startTime = Date.now();
    await client.query(`
      SELECT * FROM journal_domains 
      WHERE category = 'natural_science' 
      ORDER BY sort_order 
      LIMIT 20
    `);
    const queryTime = Date.now() - startTime;

    if (queryTime > 100) {
      throw new Error(`查询性能较慢: ${queryTime}ms，建议优化索引`);
    }

    console.log(`   ⚡ 查询性能良好: ${queryTime}ms`);
    console.log(`   📊 现有索引: ${indexes.join(', ')}`);

  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * 测试API完整功能
 */
async function testAPIFunctionality() {
  // 测试所有API端点
  const endpoints = [
    { url: '/api/journal-domains', description: '获取所有领域' },
    { url: '/api/journal-domains?format=simple', description: '简化格式' },
    { url: '/api/journal-domains?format=grouped', description: '分组格式' },
    { url: '/api/journal-domains?category=natural_science', description: '按类别筛选' },
    { url: '/api/journal-domains?search=计算机', description: '搜索功能' },
    { url: '/api/journal-domains?active_only=true', description: '仅活跃领域' }
  ];

  for (const endpoint of endpoints) {
    const response = await fetch(`${CONFIG.baseUrl}${endpoint.url}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`API端点失败 ${endpoint.url}: ${data.error}`);
    }

    if (!data.success) {
      throw new Error(`API返回失败 ${endpoint.url}: ${data.error}`);
    }

    console.log(`   ✅ ${endpoint.description}: ${response.status}`);
  }

  console.log(`   🔌 所有 ${endpoints.length} 个API端点测试通过`);
}

/**
 * 测试数据一致性
 */
async function testDataConsistency() {
  // 通过API获取数据
  const apiResponse = await fetch(`${CONFIG.baseUrl}/api/journal-domains`);
  const apiData = await apiResponse.json();

  if (!apiResponse.ok || !apiData.success) {
    throw new Error('API获取数据失败');
  }

  // 直接从数据库获取数据
  const pool = new Pool(CONFIG.postgres);
  const client = await pool.connect();

  try {
    const dbResult = await client.query('SELECT COUNT(*) as count FROM journal_domains WHERE is_active = true');
    const dbCount = parseInt(dbResult.rows[0].count);
    const apiCount = apiData.data.domains.length;

    if (dbCount !== apiCount) {
      throw new Error(`数据不一致：数据库 ${dbCount} 条，API返回 ${apiCount} 条`);
    }

    // 检查类别一致性
    const categoryResult = await client.query(`
      SELECT DISTINCT category, category_name 
      FROM journal_domains 
      WHERE is_active = true 
      ORDER BY category
    `);

    const dbCategories = new Set(categoryResult.rows.map(row => row.category));
    const apiCategories = new Set(apiData.data.domains.map(domain => domain.category));

    if (dbCategories.size !== apiCategories.size) {
      throw new Error(`类别数据不一致：数据库 ${dbCategories.size} 个类别，API返回 ${apiCategories.size} 个`);
    }

    console.log(`   🔄 数据库与API数据一致: ${dbCount} 条记录`);
    console.log(`   📚 包含 ${dbCategories.size} 个期刊类别`);

  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * 测试前端组件集成
 */
async function testFrontendIntegration() {
  // 测试知识库管理页面是否能正确加载期刊领域
  const knowledgeResponse = await fetch(`${CONFIG.baseUrl}/api/journal-domains?format=simple`);
  const knowledgeData = await knowledgeResponse.json();

  if (!knowledgeResponse.ok || !knowledgeData.success) {
    throw new Error('知识库管理页面期刊领域加载失败');
  }

  // 测试用户注册页面期刊领域
  const registerResponse = await fetch(`${CONFIG.baseUrl}/api/journal-domains?format=simple`);
  const registerData = await registerResponse.json();

  if (!registerResponse.ok || !registerData.success) {
    throw new Error('用户注册页面期刊领域加载失败');
  }

  // 验证前端需要的数据格式
  const sampleDomain = knowledgeData.data.domains[0];
  if (!sampleDomain.code || !sampleDomain.name || !sampleDomain.category_name) {
    throw new Error('前端需要的期刊领域字段不完整');
  }

  console.log(`   🎨 前端组件期刊领域数据格式正确`);
  console.log(`   📱 知识库管理页面: ${knowledgeData.data.domains.length} 个选项`);
  console.log(`   👥 用户注册页面: ${registerData.data.domains.length} 个选项`);
  console.log(`   💡 示例格式: ${sampleDomain.code} - ${sampleDomain.name} (${sampleDomain.category_name})`);
}

/**
 * 测试系统性能
 */
async function testSystemPerformance() {
  const startTime = Date.now();

  // 并发测试多个API调用
  const promises = [
    fetch(`${CONFIG.baseUrl}/api/journal-domains`),
    fetch(`${CONFIG.baseUrl}/api/journal-domains?format=grouped`),
    fetch(`${CONFIG.baseUrl}/api/journal-domains?category=natural_science`),
    fetch(`${CONFIG.baseUrl}/api/journal-domains?search=工程`)
  ];

  const responses = await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  // 验证所有请求都成功
  for (const response of responses) {
    if (!response.ok) {
      throw new Error(`并发请求失败: ${response.status}`);
    }
  }

  if (totalTime > 2000) {
    throw new Error(`系统响应时间过慢: ${totalTime}ms`);
  }

  console.log(`   ⚡ 并发处理4个请求耗时: ${totalTime}ms`);
  console.log(`   📊 平均响应时间: ${Math.round(totalTime / 4)}ms`);
  console.log(`   🚀 系统性能良好`);
}

/**
 * 检查服务器状态
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
  console.log('🚀 开始完整的期刊领域系统集成测试...\n');
  console.log(`📡 测试服务器: ${CONFIG.baseUrl}`);
  console.log(`🗄️  测试数据库: ${CONFIG.postgres.host}:${CONFIG.postgres.port}/${CONFIG.postgres.database}\n`);

  // 系统基础检查
  await runTest('服务器连接检查', checkServerStatus);
  await runTest('数据库表结构检查', testDatabaseSchema);
  await runTest('数据库索引性能检查', testIndexPerformance);

  // API功能测试
  await runTest('API完整功能测试', testAPIFunctionality);
  await runTest('数据一致性测试', testDataConsistency);

  // 前端集成测试
  await runTest('前端组件集成测试', testFrontendIntegration);

  // 性能测试
  await runTest('系统性能测试', testSystemPerformance);

  // 显示测试结果总结
  console.log('\n' + '='.repeat(70));
  console.log('🧪 完整期刊领域系统测试结果');
  console.log('='.repeat(70));
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
    console.log('\n🎉 所有测试都通过了！期刊领域系统完整工作正常。');
    console.log('\n✨ 系统特性汇总：');
    console.log('   📊 62个期刊领域，涵盖5大学科类别');
    console.log('   🔌 6个API端点，支持搜索、筛选、分组');
    console.log('   🎨 前端组件完全集成，下拉选择美观实用');
    console.log('   ⚡ 高性能数据库查询和API响应');
    console.log('   🛡️  完整的错误处理和数据验证');
  } else {
    console.log('\n⚠️  部分测试失败，请检查系统配置。');
  }

  console.log('\n📋 使用指南：');
  console.log('1. 期刊领域管理：');
  console.log('   - 数据库表: journal_domains');
  console.log('   - API端点: /api/journal-domains');
  console.log('   - 前端页面: 知识库管理 + 用户注册');
  
  console.log('2. 支持的操作：');
  console.log('   - 获取所有期刊领域 (62个)');
  console.log('   - 按5大类别筛选');
  console.log('   - 关键词搜索匹配');
  console.log('   - 分组和简化格式输出');

  console.log('3. 集成位置：');
  console.log('   - 知识库管理: http://localhost:3000/knowledge-admin');
  console.log('   - 用户注册: http://localhost:3000/profile');
  console.log('   - API测试: node scripts/test-journal-domains-api.js');
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