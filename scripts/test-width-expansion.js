const http = require('http');

console.log('🧪 测试个人中心页面宽度扩展优化...\n');

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

    // 测试2: 检查最大宽度设置
    console.log('\n📊 测试2: 验证最大宽度优化...');
    if (response.content.includes('max-w-none')) {
      console.log('✅ 找到无限制最大宽度设置: max-w-none');
      passedTests++;
    } else {
      console.log('❌ 未找到宽度优化设置');
    }

    // 测试3: 检查响应式内边距
    console.log('\n📊 测试3: 验证响应式内边距优化...');
    const paddingPattern = /px-2 sm:px-4 lg:px-6 xl:px-8/;
    
    if (paddingPattern.test(response.content)) {
      console.log('✅ 找到优化的响应式内边距设置');
      passedTests++;
    } else {
      console.log('❌ 未找到响应式内边距优化');
    }

    // 测试4: 检查网格间距优化
    console.log('\n📊 测试4: 验证网格间距优化...');
    if (response.content.includes('gap-6')) {
      console.log('✅ 找到优化的网格间距: gap-6');
      passedTests++;
    } else {
      console.log('❌ 未找到网格间距优化');
    }

    // 测试5: 检查垂直间距优化
    console.log('\n📊 测试5: 验证垂直间距优化...');
    if (response.content.includes('space-y-5')) {
      console.log('✅ 找到优化的垂直间距: space-y-5');
      passedTests++;
    } else {
      console.log('❌ 未找到垂直间距优化');
    }

    // 测试6: 检查导航栏宽度一致性
    console.log('\n📊 测试6: 验证导航栏和内容区域宽度一致性...');
    const navWidthMatches = response.content.match(/max-w-none mx-auto px-2 sm:px-4 lg:px-6 xl:px-8/g);
    
    if (navWidthMatches && navWidthMatches.length >= 2) {
      console.log('✅ 导航栏和内容区域宽度设置一致');
      passedTests++;
    } else {
      console.log('❌ 导航栏和内容区域宽度设置不一致');
    }

    // 输出测试结果
    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`🎯 成功率: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试通过！页面宽度扩展优化成功完成！');
      console.log('\n📐 当前布局优化:');
      console.log('✨ 容器最大宽度: max-w-7xl → max-w-none (移除宽度限制)');
      console.log('✨ 响应式内边距: px-4 sm:px-6 lg:px-8 → px-2 sm:px-4 lg:px-6 xl:px-8');
      console.log('✨ 网格间距: gap-8 → gap-6 (更紧凑)');
      console.log('✨ 垂直间距: space-y-6 → space-y-5 (更和谐)');
      console.log('✨ 整体效果: 左侧和右侧内容区域都获得更宽的展示空间');
    } else {
      console.log('\n⚠️  部分测试失败，请检查宽度优化配置');
    }

  } catch (error) {
    console.log(`❌ 测试执行失败: ${error.message}`);
    console.log('\n💡 提示: 请确保开发服务器正在运行 (npm run dev)');
  }
}

runTests(); 