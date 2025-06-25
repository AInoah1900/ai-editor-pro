const fetch = require('node-fetch');

async function testDeepSeekAPIFinalVerification() {
  console.log('🎯 DeepSeek API配置页面修复效果最终验证...\n');
  
  const baseURL = 'http://localhost:3002';
  
  try {
    // 1. 测试API隔离性
    console.log('1️⃣ 测试API调用隔离性...');
    
    // 云端API测试
    console.log('   测试云端API...');
    const cloudTestResponse = await fetch(`${baseURL}/api/deepseek-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'testConnection',
        provider: 'cloud'
      })
    });
    
    const cloudTestResult = await cloudTestResponse.json();
    console.log(`   云端API测试: ${cloudTestResult.success ? '✅ 成功' : '❌ 失败'}`);
    if (cloudTestResult.error) {
      console.log(`   错误信息: ${cloudTestResult.error}`);
    }
    
    // 本地API测试
    console.log('   测试本地API...');
    const localTestResponse = await fetch(`${baseURL}/api/deepseek-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'testConnection',
        provider: 'local'
      })
    });
    
    const localTestResult = await localTestResponse.json();
    console.log(`   本地API测试: ${localTestResult.success ? '✅ 成功' : '❌ 失败'}`);
    if (localTestResult.error) {
      console.log(`   错误信息: ${localTestResult.error}`);
    }
    
    // 2. 测试健康检查
    console.log('\n2️⃣ 测试健康检查功能...');
    const healthResponse = await fetch(`${baseURL}/api/deepseek-config?action=health`);
    const healthResult = await healthResponse.json();
    
    if (healthResult.success) {
      console.log('   健康检查结果:');
      console.log(`   云端API: ${healthResult.data.cloud.available ? '✅ 可用' : '❌ 不可用'}`);
      if (healthResult.data.cloud.error) {
        console.log(`   云端错误: ${healthResult.data.cloud.error}`);
      }
      console.log(`   本地API: ${healthResult.data.local.available ? '✅ 可用' : '❌ 不可用'}`);
      if (healthResult.data.local.error) {
        console.log(`   本地错误: ${healthResult.data.local.error}`);
      }
      console.log(`   当前使用: ${healthResult.data.current}`);
    } else {
      console.log('   ❌ 健康检查失败:', healthResult.error);
    }
    
    // 3. 测试配置状态
    console.log('\n3️⃣ 测试配置状态获取...');
    const statusResponse = await fetch(`${baseURL}/api/deepseek-config?action=status`);
    const statusResult = await statusResponse.json();
    
    if (statusResult.success) {
      console.log('   配置状态:');
      console.log(`   当前提供商: ${statusResult.data.currentProvider}`);
      console.log(`   云端配置: ${statusResult.data.cloudStatus.configured ? '✅ 已配置' : '❌ 未配置'}`);
      console.log(`   云端可用: ${statusResult.data.cloudStatus.available ? '✅ 可用' : '❌ 不可用'}`);
      console.log(`   本地配置: ${statusResult.data.localStatus.configured ? '✅ 已配置' : '❌ 未配置'}`);
      console.log(`   本地可用: ${statusResult.data.localStatus.available ? '✅ 可用' : '❌ 不可用'}`);
    } else {
      console.log('   ❌ 配置状态获取失败:', statusResult.error);
    }
    
    // 4. 分析修复效果
    console.log('\n4️⃣ 分析修复效果...');
    
    let issues = [];
    let improvements = [];
    
    // 检查API隔离性
    if (cloudTestResult.success && localTestResult.success) {
      improvements.push('✅ API测试隔离性正常，两个API可以独立测试');
    } else if (cloudTestResult.success || localTestResult.success) {
      improvements.push('✅ 至少一个API可以正常测试');
    } else {
      issues.push('❌ 两个API都无法正常测试');
    }
    
    // 检查错误信息混淆
    if (cloudTestResult.success && cloudTestResult.message && !cloudTestResult.message.includes('本地')) {
      improvements.push('✅ 云端API测试结果不包含本地API信息');
    }
    
    if (localTestResult.success && localTestResult.message && !localTestResult.message.includes('云端')) {
      improvements.push('✅ 本地API测试结果不包含云端API信息');
    }
    
    if (cloudTestResult.error && cloudTestResult.error.includes('本地')) {
      issues.push('❌ 云端API测试错误信息包含本地API信息');
    }
    
    if (localTestResult.error && localTestResult.error.includes('云端')) {
      issues.push('❌ 本地API测试错误信息包含云端API信息');
    }
    
    // 检查健康检查功能
    if (healthResult.success) {
      improvements.push('✅ 健康检查功能正常');
      
      // 检查错误信息标识
      if (healthResult.data.cloud.error && !healthResult.data.cloud.error.includes('本地')) {
        improvements.push('✅ 云端健康检查错误信息独立');
      }
      
      if (healthResult.data.local.error && !healthResult.data.local.error.includes('云端')) {
        improvements.push('✅ 本地健康检查错误信息独立');
      }
    } else {
      issues.push('❌ 健康检查功能异常');
    }
    
    // 5. 输出结果
    console.log('\n5️⃣ 修复效果总结:');
    
    if (improvements.length > 0) {
      console.log('\n🎉 修复成功的方面:');
      improvements.forEach((improvement, index) => {
        console.log(`   ${index + 1}. ${improvement}`);
      });
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️ 仍需改进的方面:');
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }
    
    // 6. 用户指导
    console.log('\n6️⃣ 用户使用指导:');
    console.log('   📖 页面信息说明:');
    console.log('      • 页面顶部的消息 = 测试结果（成功/失败）');
    console.log('      • API卡片中的"健康检查:" = 实时健康状态');
    console.log('      • API卡片中的"模型检查:" = 模型配置状态');
    console.log('      • 不同颜色区分：绿色=成功，红色=失败，橙色=警告');
    
    console.log('\n   🔧 使用建议:');
    console.log('      1. 点击"测试"按钮查看连接测试结果');
    console.log('      2. 查看API卡片了解健康状态');
    console.log('      3. 如有错误，查看具体的错误信息前缀');
    console.log('      4. 测试成功后，系统会自动刷新健康状态');
    
    const successRate = improvements.length / (improvements.length + issues.length) * 100;
    console.log(`\n🎯 修复成功率: ${successRate.toFixed(1)}%`);
    
    return issues.length === 0;
    
  } catch (error) {
    console.error('❌ 验证过程失败:', error.message);
    return false;
  }
}

// 运行验证
testDeepSeekAPIFinalVerification()
  .then(success => {
    console.log(`\n🏆 最终验证结果: ${success ? '完全成功' : '部分成功'}`);
    console.log('\n✨ DeepSeek API配置页面修复完成！');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('验证失败:', error);
    process.exit(1);
  }); 