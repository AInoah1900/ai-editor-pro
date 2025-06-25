const fetch = require('node-fetch');

async function testAPIIsolation() {
  console.log('🧪 测试DeepSeek API配置隔离性...\n');
  
  const baseURL = 'http://localhost:3002';
  
  try {
    // 1. 获取当前状态
    console.log('1️⃣ 获取当前配置状态...');
    const statusResponse = await fetch(`${baseURL}/api/deepseek-config?action=status`);
    const statusResult = await statusResponse.json();
    
    if (statusResult.success) {
      console.log('当前状态:', {
        currentProvider: statusResult.data.currentProvider,
        cloudConfigured: statusResult.data.cloudStatus.configured,
        localConfigured: statusResult.data.localStatus.configured
      });
    } else {
      console.error('获取状态失败:', statusResult.error);
      return;
    }
    
    // 2. 执行健康检查
    console.log('\n2️⃣ 执行综合健康检查...');
    const healthResponse = await fetch(`${baseURL}/api/deepseek-config?action=health`);
    const healthResult = await healthResponse.json();
    
    if (healthResult.success) {
      console.log('健康检查结果:');
      console.log('  云端API:', healthResult.data.cloud);
      console.log('  本地API:', healthResult.data.local);
      console.log('  当前使用:', healthResult.data.current);
    } else {
      console.error('健康检查失败:', healthResult.error);
    }
    
    // 3. 测试云端API连接
    console.log('\n3️⃣ 单独测试云端API连接...');
    const cloudTestResponse = await fetch(`${baseURL}/api/deepseek-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'testConnection',
        provider: 'cloud'
      })
    });
    
    const cloudTestResult = await cloudTestResponse.json();
    console.log('云端API测试结果:', {
      success: cloudTestResult.success,
      message: cloudTestResult.message,
      error: cloudTestResult.error
    });
    
    // 4. 测试本地API连接
    console.log('\n4️⃣ 单独测试本地API连接...');
    const localTestResponse = await fetch(`${baseURL}/api/deepseek-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'testConnection',
        provider: 'local'
      })
    });
    
    const localTestResult = await localTestResponse.json();
    console.log('本地API测试结果:', {
      success: localTestResult.success,
      message: localTestResult.message,
      error: localTestResult.error
    });
    
    // 5. 再次检查状态，看是否有变化
    console.log('\n5️⃣ 测试后重新检查状态...');
    const finalStatusResponse = await fetch(`${baseURL}/api/deepseek-config?action=status`);
    const finalStatusResult = await finalStatusResponse.json();
    
    if (finalStatusResult.success) {
      console.log('最终状态:', {
        currentProvider: finalStatusResult.data.currentProvider,
        cloudConfigured: finalStatusResult.data.cloudStatus.configured,
        localConfigured: finalStatusResult.data.localStatus.configured
      });
    }
    
    // 6. 分析结果
    console.log('\n6️⃣ 分析测试结果...');
    
    let isolationIssues = [];
    
    // 检查云端API测试是否影响本地API状态
    if (cloudTestResult.success && localTestResult.error && localTestResult.error.includes('云端')) {
      isolationIssues.push('云端API测试影响了本地API结果');
    }
    
    // 检查本地API测试是否影响云端API状态
    if (localTestResult.success && cloudTestResult.error && cloudTestResult.error.includes('本地')) {
      isolationIssues.push('本地API测试影响了云端API结果');
    }
    
    // 检查错误信息是否混合
    if (cloudTestResult.error && cloudTestResult.error.includes('本地API')) {
      isolationIssues.push('云端API测试返回了本地API错误信息');
    }
    
    if (localTestResult.error && localTestResult.error.includes('云端API')) {
      isolationIssues.push('本地API测试返回了云端API错误信息');
    }
    
    if (isolationIssues.length > 0) {
      console.log('❌ 发现隔离性问题:');
      isolationIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('✅ API测试隔离性正常');
    }
    
    // 7. 提供修复建议
    if (isolationIssues.length > 0) {
      console.log('\n🔧 修复建议:');
      console.log('1. 检查testProviderConnection方法是否使用了正确的配置');
      console.log('2. 确保测试时不会触发其他API的健康检查');
      console.log('3. 验证错误信息的来源和传播路径');
      console.log('4. 检查前端是否在测试后自动刷新了其他状态');
    }
    
    return isolationIssues.length === 0;
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    return false;
  }
}

// 运行测试
testAPIIsolation()
  .then(success => {
    console.log(`\n🎯 测试${success ? '通过' : '失败'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  }); 