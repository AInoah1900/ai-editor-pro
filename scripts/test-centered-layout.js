const http = require('http');

console.log('🧪 测试个人中心页面居中布局优化...\n');

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
  let totalTests = 7;

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

    // 测试2: 检查最大宽度居中设置
    console.log('\n📊 测试2: 验证居中宽度容器设置...');
    if (response.content.includes('max-w-screen-xl')) {
      console.log('✅ 找到居中宽度设置: max-w-screen-xl');
      passedTests++;
    } else {
      console.log('❌ 未找到居中宽度设置');
    }

    // 测试3: 检查居中对齐
    console.log('\n📊 测试3: 验证mx-auto居中对齐...');
    const centeringPattern = /max-w-screen-xl mx-auto/g;
    const centeringMatches = response.content.match(centeringPattern);
    
    if (centeringMatches && centeringMatches.length >= 2) {
      console.log('✅ 找到居中对齐设置: mx-auto');
      passedTests++;
    } else {
      console.log('❌ 未找到足够的居中对齐设置');
    }

    // 测试4: 检查导航栏和内容区域宽度一致性
    console.log('\n📊 测试4: 验证导航栏和内容区域宽度一致性...');
    const consistentWidthMatches = response.content.match(/max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8/g);
    
    if (consistentWidthMatches && consistentWidthMatches.length >= 2) {
      console.log('✅ 导航栏和内容区域宽度设置一致');
      passedTests++;
    } else {
      console.log('❌ 导航栏和内容区域宽度设置不一致');
    }

    // 测试5: 检查内边距恢复
    console.log('\n📊 测试5: 验证内边距设置恢复...');
    const paddingPattern = /px-4 sm:px-6 lg:px-8/;
    
    if (paddingPattern.test(response.content)) {
      console.log('✅ 找到标准内边距设置');
      passedTests++;
    } else {
      console.log('❌ 未找到标准内边距设置');
    }

    // 测试6: 检查垂直间距恢复
    console.log('\n📊 测试6: 验证垂直间距设置...');
    if (response.content.includes('py-8')) {
      console.log('✅ 找到标准垂直间距: py-8');
      passedTests++;
    } else {
      console.log('❌ 未找到标准垂直间距');
    }

    // 测试7: 检查是否移除了无限制宽度
    console.log('\n📊 测试7: 验证无限制宽度已移除...');
    if (!response.content.includes('max-w-none')) {
      console.log('✅ 已移除无限制宽度设置');
      passedTests++;
    } else {
      console.log('❌ 仍存在无限制宽度设置');
    }

    // 输出测试结果
    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`🎯 成功率: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试通过！页面居中布局优化成功完成！');
      console.log('\n📐 当前布局特点:');
      console.log('✨ 容器宽度: max-w-none → max-w-screen-xl (居中显示)');
      console.log('✨ 对齐方式: mx-auto (水平居中)');
      console.log('✨ 响应式内边距: px-4 sm:px-6 lg:px-8 (标准设置)');
      console.log('✨ 垂直间距: py-8 (标准设置)');
      console.log('✨ 视觉效果: 内容居中，左右空白协调');
    } else {
      console.log('\n⚠️  部分测试失败，请检查居中布局配置');
    }

  } catch (error) {
    console.log(`❌ 测试执行失败: ${error.message}`);
    console.log('\n💡 提示: 请确保开发服务器正在运行 (npm run dev)');
  }
}

runTests(); 