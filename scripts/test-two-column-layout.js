const http = require('http');

console.log('🧪 测试个人中心页面两栏布局优化...\n');

function testProfilePageAccess() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/profile',
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          content: data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function runTests() {
  let passedTests = 0;
  let totalTests = 5;

  try {
    // 测试1: 页面访问状态
    console.log('📊 测试1: 验证页面访问状态...');
    const response = await testProfilePageAccess();
    
    if (response.statusCode === 200) {
      console.log('✅ 页面访问成功: HTTP 200');
      passedTests++;
    } else {
      console.log(`❌ 页面访问失败: HTTP ${response.statusCode}`);
    }

    // 测试2: 检查4列网格布局（主网格仍然是4列）
    console.log('\n📊 测试2: 验证4列网格布局...');
    if (response.content.includes('lg:grid-cols-4')) {
      console.log('✅ 找到4列网格布局: lg:grid-cols-4');
      passedTests++;
    } else {
      console.log('❌ 未找到4列网格布局');
    }

    // 测试3: 检查左侧用户信息区域
    console.log('\n📊 测试3: 验证左侧用户信息区域...');
    if (response.content.includes('lg:col-span-1')) {
      console.log('✅ 找到左侧用户信息区域: lg:col-span-1');
      passedTests++;
    } else {
      console.log('❌ 未找到正确的左侧用户信息区域配置');
    }

    // 测试4: 检查右侧内容区域
    console.log('\n📊 测试4: 验证右侧内容区域...');
    if (response.content.includes('lg:col-span-3') && response.content.includes('右侧内容区域')) {
      console.log('✅ 找到右侧内容区域: lg:col-span-3');
      passedTests++;
    } else {
      console.log('❌ 未找到正确的右侧内容区域配置');
    }

    // 测试5: 检查账户统计与快捷操作的2列布局
    console.log('\n📊 测试5: 验证账户统计与快捷操作2列布局...');
    const twoColumnPattern = /账户统计与快捷操作区域[\s\S]*?lg:grid-cols-2/;
    
    if (twoColumnPattern.test(response.content)) {
      console.log('✅ 账户统计与快捷操作已优化为2列并排布局');
      passedTests++;
    } else {
      console.log('❌ 底部2列布局优化不完整');
    }

    // 输出测试结果
    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`🎯 成功率: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试通过！两栏布局优化成功完成！');
      console.log('\n📐 当前布局结构:');
      console.log('├─ 左侧 (1/4): 用户信息');
      console.log('└─ 右侧 (3/4): 出版社信息 + 权限信息 + [账户统计 | 快捷操作]');
    } else {
      console.log('\n⚠️  部分测试失败，请检查布局配置');
    }

  } catch (error) {
    console.log(`❌ 测试执行失败: ${error.message}`);
    console.log('\n💡 提示: 请确保开发服务器正在运行 (npm run dev)');
  }
}

runTests(); 