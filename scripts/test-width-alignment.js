const http = require('http');

console.log('🧪 测试个人中心页面3/4宽度对齐优化...\n');

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
  let totalTests = 6;

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

    // 测试2: 检查4列网格布局
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

    // 测试5: 检查3/4宽度设置
    console.log('\n📊 测试5: 验证3/4宽度设置...');
    const widthPattern = /w-3\/4/g;
    const matches = response.content.match(widthPattern);
    const expectedCount = 4; // 出版社信息、权限信息、账户统计、快捷操作各一个
    
    if (matches && matches.length >= expectedCount) {
      console.log(`✅ 找到 ${matches.length} 个 w-3/4 宽度设置 (期望至少 ${expectedCount} 个)`);
      passedTests++;
    } else {
      console.log(`❌ w-3/4 宽度设置不足: 找到 ${matches ? matches.length : 0} 个，期望至少 ${expectedCount} 个`);
    }

    // 测试6: 检查快捷操作的3列布局
    console.log('\n📊 测试6: 验证快捷操作3列布局...');
    const quickActionsPattern = /快捷操作[\s\S]*?md:grid-cols-3/;
    
    if (quickActionsPattern.test(response.content)) {
      console.log('✅ 快捷操作已优化为3列布局 (md:grid-cols-3)');
      passedTests++;
    } else {
      console.log('❌ 快捷操作3列布局设置不正确');
    }

    // 输出测试结果
    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`🎯 成功率: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试通过！3/4宽度对齐优化成功完成！');
      console.log('\n📐 当前布局结构:');
      console.log('├─ 左侧 (1/4): 用户信息');
      console.log('└─ 右侧 (3/4): ');
      console.log('   ├─ 出版社信息 (w-3/4)');
      console.log('   ├─ 权限信息 (w-3/4)');
      console.log('   ├─ 账户统计 (w-3/4) - 上');
      console.log('   └─ 快捷操作 (w-3/4) - 下');
    } else {
      console.log('\n⚠️  部分测试失败，请检查布局配置');
    }

  } catch (error) {
    console.log(`❌ 测试执行失败: ${error.message}`);
    console.log('\n💡 提示: 请确保开发服务器正在运行 (npm run dev)');
  }
}

runTests(); 