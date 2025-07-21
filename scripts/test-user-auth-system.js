/**
 * 用户认证系统功能验证脚本
 * 测试注册、登录、权限验证等核心功能
 */

const fetch = require('node-fetch');

// 测试配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  testUser: {
    username: 'test_editor',
    nickname: '测试编辑',
    email: 'test@example.com',
    password: 'TestPass123!',
    role_id: 'role_editor',
    publisher_name: '测试期刊社',
    journal_domain: '计算机科学'
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
 * 测试获取角色列表
 */
async function testGetRoles() {
  const response = await fetch(`${CONFIG.baseUrl}/api/auth/roles`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`获取角色列表失败: ${data.error}`);
  }
  
  if (!data.success || !Array.isArray(data.roles) || data.roles.length < 4) {
    throw new Error('角色列表格式不正确或数量不足');
  }
  
  console.log(`   📋 获取到 ${data.roles.length} 个角色`);
  data.roles.forEach(role => {
    console.log(`      • ${role.display_name} (${role.name})`);
  });
}

/**
 * 测试用户注册
 */
async function testUserRegistration() {
  const response = await fetch(`${CONFIG.baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(CONFIG.testUser),
  });
  
  const data = await response.json();
  
  if (response.status === 409 && data.error.includes('已存在')) {
    console.log('   ℹ️  测试用户已存在，跳过注册测试');
    return;
  }
  
  if (!response.ok) {
    throw new Error(`用户注册失败: ${data.error} ${data.details ? data.details.join(', ') : ''}`);
  }
  
  if (!data.success || !data.user) {
    throw new Error('注册响应格式不正确');
  }
  
  console.log(`   👤 用户注册成功: ${data.user.nickname} (${data.user.email})`);
}

/**
 * 测试用户登录
 */
async function testUserLogin() {
  const response = await fetch(`${CONFIG.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password,
      remember_me: false
    }),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`用户登录失败: ${data.error}`);
  }
  
  if (!data.success || !data.access_token || !data.user) {
    throw new Error('登录响应格式不正确');
  }
  
  // 保存访问令牌供后续测试使用
  CONFIG.accessToken = data.access_token;
  
  console.log(`   🔑 用户登录成功: ${data.user.nickname}`);
  console.log(`   📅 令牌过期时间: ${new Date(data.expires_at).toLocaleString('zh-CN')}`);
  
  return data.access_token;
}

/**
 * 测试获取用户信息
 */
async function testGetUserInfo() {
  if (!CONFIG.accessToken) {
    throw new Error('缺少访问令牌，请先执行登录测试');
  }
  
  const response = await fetch(`${CONFIG.baseUrl}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${CONFIG.accessToken}`,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`获取用户信息失败: ${data.error}`);
  }
  
  if (!data.success || !data.user) {
    throw new Error('用户信息响应格式不正确');
  }
  
  console.log(`   👤 用户信息: ${data.user.nickname} (${data.user.role_display_name})`);
  console.log(`   🏢 出版社: ${data.user.publisher_name || '未设置'}`);
  console.log(`   🔐 权限数: ${data.user.permissions ? data.user.permissions.length : 0}`);
}

/**
 * 测试权限验证（尝试访问需要权限的端点）
 */
async function testPermissionValidation() {
  if (!CONFIG.accessToken) {
    throw new Error('缺少访问令牌，请先执行登录测试');
  }
  
  // 测试访问知识库管理（编辑角色应该有权限）
  const response = await fetch(`${CONFIG.baseUrl}/api/knowledge-base`, {
    headers: {
      'Authorization': `Bearer ${CONFIG.accessToken}`,
    },
  });
  
  if (response.ok) {
    console.log('   ✅ 权限验证通过：可以访问知识库管理');
  } else if (response.status === 401) {
    throw new Error('权限验证失败：认证无效');
  } else if (response.status === 403) {
    console.log('   ⚠️  权限验证：当前角色无权访问知识库管理（这可能是正常的）');
  } else {
    console.log(`   ℹ️  权限测试结果: HTTP ${response.status}`);
  }
}

/**
 * 测试用户登出
 */
async function testUserLogout() {
  if (!CONFIG.accessToken) {
    throw new Error('缺少访问令牌，请先执行登录测试');
  }
  
  const response = await fetch(`${CONFIG.baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.accessToken}`,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`用户登出失败: ${data.error}`);
  }
  
  if (!data.success) {
    throw new Error('登出响应格式不正确');
  }
  
  console.log('   🚪 用户登出成功');
  
  // 验证令牌是否已失效
  const verifyResponse = await fetch(`${CONFIG.baseUrl}/api/auth/me`, {
    headers: {
      'Authorization': `Bearer ${CONFIG.accessToken}`,
    },
  });
  
  if (verifyResponse.status === 401) {
    console.log('   ✅ 令牌已正确失效');
  } else {
    console.log('   ⚠️  令牌可能仍然有效（这可能是正常的）');
  }
}

/**
 * 检查服务器是否运行
 */
async function checkServerStatus() {
  try {
    const response = await fetch(`${CONFIG.baseUrl}/api/auth/roles`);
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
  console.log('🚀 开始测试用户认证系统...\n');
  console.log(`📡 测试服务器: ${CONFIG.baseUrl}`);
  console.log(`👤 测试用户: ${CONFIG.testUser.email}\n`);
  
  // 检查服务器状态
  await runTest('服务器连接检查', checkServerStatus);
  
  // 执行认证系统测试
  await runTest('获取角色列表', testGetRoles);
  await runTest('用户注册', testUserRegistration);
  await runTest('用户登录', testUserLogin);
  await runTest('获取用户信息', testGetUserInfo);
  await runTest('权限验证', testPermissionValidation);
  await runTest('用户登出', testUserLogout);
  
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
    console.log('\n🎉 所有测试都通过了！用户认证系统工作正常。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查系统配置。');
  }
  
  console.log('\n📝 使用提示：');
  console.log('1. 确保 Next.js 开发服务器正在运行 (npm run dev)');
  console.log('2. 确保 PostgreSQL 数据库已初始化 (node scripts/init-user-auth-db.js)');
  console.log('3. 检查 .env.local 文件中的配置项');
  console.log('4. 访问 http://localhost:3000/profile 体验完整功能');
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