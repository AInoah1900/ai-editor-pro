const http = require('http');

console.log('🧪 测试个人中心页面宽度增加1/3优化...\n');

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
  let totalTests = 8;

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

    // 测试2: 检查自定义宽度设置
    console.log('\n📊 测试2: 验证自定义宽度设置...');
    if (response.content.includes('max-w-[1700px]')) {
      console.log('✅ 找到自定义宽度设置: max-w-[1700px]');
      passedTests++;
    } else {
      console.log('❌ 未找到自定义宽度设置');
    }

    // 测试3: 检查居中对齐保持
    console.log('\n📊 测试3: 验证mx-auto居中对齐保持...');
    const centeringPattern = /max-w-\[1700px\] mx-auto/g;
    const centeringMatches = response.content.match(centeringPattern);
    
    if (centeringMatches && centeringMatches.length >= 2) {
      console.log('✅ 居中对齐保持正常: mx-auto');
      passedTests++;
    } else {
      console.log('❌ 居中对齐设置异常');
    }

    // 测试4: 检查导航栏和内容区域一致性
    console.log('\n📊 测试4: 验证导航栏和内容区域宽度一致性...');
    const consistentWidthMatches = response.content.match(/max-w-\[1700px\] mx-auto px-4 sm:px-6 lg:px-8/g);
    
    if (consistentWidthMatches && consistentWidthMatches.length >= 2) {
      console.log('✅ 导航栏和内容区域宽度设置一致');
      passedTests++;
    } else {
      console.log('❌ 导航栏和内容区域宽度设置不一致');
    }

    // 测试5: 检查是否移除了旧的宽度设置
    console.log('\n📊 测试5: 验证旧宽度设置已移除...');
    if (!response.content.includes('max-w-screen-xl') && !response.content.includes('max-w-screen-2xl')) {
      console.log('✅ 已移除旧的宽度设置');
      passedTests++;
    } else {
      console.log('❌ 仍存在旧的宽度设置');
    }

    // 测试6: 检查网格布局保持
    console.log('\n📊 测试6: 验证网格布局保持...');
    if (response.content.includes('lg:grid-cols-4') && response.content.includes('lg:col-span-1') && response.content.includes('lg:col-span-3')) {
      console.log('✅ 网格布局保持正常: 1:3比例');
      passedTests++;
    } else {
      console.log('❌ 网格布局设置异常');
    }

    // 测试7: 检查响应式设计保持
    console.log('\n📊 测试7: 验证响应式设计保持...');
    const responsivePattern = /px-4 sm:px-6 lg:px-8/;
    
    if (responsivePattern.test(response.content)) {
      console.log('✅ 响应式内边距保持正常');
      passedTests++;
    } else {
      console.log('❌ 响应式内边距设置异常');
    }

    // 测试8: 检查3/4宽度设置保持
    console.log('\n📊 测试8: 验证3/4宽度设置保持...');
    if (response.content.includes('w-3/4')) {
      console.log('✅ 3/4宽度设置保持正常');
      passedTests++;
    } else {
      console.log('❌ 3/4宽度设置异常');
    }

    // 输出测试结果
    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`🎯 成功率: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 所有测试通过！页面宽度增加1/3优化成功完成！');
      console.log('\n📐 当前布局特点:');
      console.log('✨ 容器宽度: max-w-screen-xl → max-w-[1700px] (增加33%)');
      console.log('✨ 对齐方式: mx-auto (保持居中)');
      console.log('✨ 响应式设计: px-4 sm:px-6 lg:px-8 (保持不变)');
      console.log('✨ 网格布局: 1:3比例 (保持不变)');
      console.log('✨ 实际效果: 左右两侧区域都增加约33%宽度');
      
      console.log('\n📊 宽度增长分析 (以1920px屏幕为例):');
      console.log('   优化前容器: 1280px');
      console.log('   优化后容器: 1700px');
      console.log('   增长幅度: +420px (+33%)');
      console.log('   左侧用户信息: 320px → 425px (+105px)');
      console.log('   右侧内容区域: 960px → 1275px (+315px)');
      console.log('   左右空白: 320px → 110px (对称)');
    } else {
      console.log('\n⚠️  部分测试失败，请检查宽度增加配置');
    }

  } catch (error) {
    console.log(`❌ 测试执行失败: ${error.message}`);
    console.log('\n💡 提示: 请确保开发服务器正在运行 (npm run dev)');
  }
}

runTests(); 