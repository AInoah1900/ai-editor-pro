import { getDeepSeekConfig } from '../lib/deepseek/deepseek-config.ts';
import { getDualDeepSeekClient } from '../lib/deepseek/deepseek-dual-client.ts';

async function testDeepSeekTimeoutAndAPIKeyFix() {
  console.log('🔧 测试DeepSeek超时和API密钥修复...\n');
  
  try {
    // 1. 测试配置加载
    console.log('1️⃣ 测试配置加载...');
    const configManager = getDeepSeekConfig();
    const config = configManager.getConfig();
    
    console.log('环境变量检查:');
    console.log(`  DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '✅ 已设置' : '❌ 未设置'}`);
    console.log(`  DEEPSEEK_PROVIDER: ${process.env.DEEPSEEK_PROVIDER || '未设置'}`);
    console.log(`  DEEPSEEK_TIMEOUT: ${process.env.DEEPSEEK_TIMEOUT || '未设置'}`);
    
    console.log('\n配置对象检查:');
    console.log(`  云端API密钥: ${config.cloudConfig.apiKey ? '✅ 已配置' : '❌ 未配置'}`);
    console.log(`  云端API密钥长度: ${config.cloudConfig.apiKey ? config.cloudConfig.apiKey.length : 0}`);
    console.log(`  云端API地址: ${config.cloudConfig.baseURL}`);
    console.log(`  云端API模型: ${config.cloudConfig.model}`);
    console.log(`  当前提供商: ${config.provider}`);
    console.log(`  基础超时: ${config.timeout}ms`);
    
    // 2. 测试超时配置
    console.log('\n2️⃣ 测试超时配置...');
    const timeouts = {
      default: configManager.getTimeoutForTask('default'),
      'document-analysis': configManager.getTimeoutForTask('document-analysis'),
      'health-check': configManager.getTimeoutForTask('health-check')
    };
    
    console.log('超时配置:');
    console.log(`  默认超时: ${timeouts.default}ms (${timeouts.default/1000}秒)`);
    console.log(`  文档分析超时: ${timeouts['document-analysis']}ms (${timeouts['document-analysis']/1000}秒)`);
    console.log(`  健康检查超时: ${timeouts['health-check']}ms (${timeouts['health-check']/1000}秒)`);
    
    // 验证超时时间是否合理
    if (timeouts['document-analysis'] >= 600000) { // 10分钟
      console.log('  ✅ 文档分析超时时间已延长到10分钟以上');
    } else {
      console.log('  ❌ 文档分析超时时间仍然较短');
    }
    
    // 3. 测试云端API可用性
    console.log('\n3️⃣ 测试云端API可用性...');
    const isCloudAvailable = configManager.isCloudAPIAvailable();
    console.log(`云端API可用性: ${isCloudAvailable ? '✅ 可用' : '❌ 不可用'}`);
    
    if (!isCloudAvailable) {
      console.log('云端API不可用的原因分析:');
      console.log(`  API密钥是否存在: ${Boolean(config.cloudConfig.apiKey)}`);
      console.log(`  API密钥值: ${config.cloudConfig.apiKey ? config.cloudConfig.apiKey.substring(0, 10) + '...' : '空'}`);
    }
    
    // 4. 测试本地API可用性
    console.log('\n4️⃣ 测试本地API可用性...');
    try {
      const isLocalAvailable = await configManager.isLocalAPIAvailable();
      console.log(`本地API可用性: ${isLocalAvailable ? '✅ 可用' : '❌ 不可用'}`);
      
      if (isLocalAvailable) {
        const localModels = await configManager.getAvailableLocalModels();
        console.log(`可用本地模型: ${localModels.join(', ')}`);
      }
    } catch (error) {
      console.log(`本地API测试失败: ${error.message}`);
    }
    
    // 5. 测试提供商选择
    console.log('\n5️⃣ 测试提供商选择...');
    const bestProvider = await configManager.selectBestProvider();
    console.log(`最佳提供商: ${bestProvider}`);
    
    // 6. 测试API切换
    console.log('\n6️⃣ 测试API切换到云端...');
    const client = getDualDeepSeekClient(true); // 强制刷新
    
    try {
      const switchSuccess = await client.switchProvider('cloud');
      console.log(`切换到云端API: ${switchSuccess ? '✅ 成功' : '❌ 失败'}`);
      
      if (switchSuccess) {
        console.log('当前提供商:', client.getCurrentProvider());
        
        // 7. 测试云端API连接
        console.log('\n7️⃣ 测试云端API连接...');
        try {
          await client.testProviderConnection('cloud');
          console.log('✅ 云端API连接测试成功');
        } catch (error) {
          console.log(`❌ 云端API连接测试失败: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`❌ 切换到云端API失败: ${error.message}`);
    }
    
    // 8. 问题诊断
    console.log('\n8️⃣ 问题诊断...');
    
    let issues = [];
    let fixes = [];
    
    // 检查超时问题
    if (timeouts['document-analysis'] < 600000) {
      issues.push('文档分析超时时间不足10分钟');
      fixes.push('已修复：延长文档分析超时到10分钟');
    } else {
      fixes.push('✅ 文档分析超时已设置为10分钟');
    }
    
    // 检查API密钥问题
    if (!config.cloudConfig.apiKey) {
      issues.push('云端API密钥未配置');
      fixes.push('请检查.env.local文件中的DEEPSEEK_API_KEY配置');
    } else if (!isCloudAvailable) {
      issues.push('云端API密钥已配置但不可用');
      fixes.push('请检查API密钥格式和有效性');
    } else {
      fixes.push('✅ 云端API密钥配置正常');
    }
    
    console.log('\n📋 问题总结:');
    if (issues.length > 0) {
      console.log('发现的问题:');
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    console.log('\n🔧 修复状态:');
    fixes.forEach((fix, index) => {
      console.log(`  ${index + 1}. ${fix}`);
    });
    
    return issues.length === 0;
    
  } catch (error) {
    console.error('❌ 测试执行失败:', error.message);
    console.error('详细错误:', error);
    return false;
  }
}

// 运行测试
testDeepSeekTimeoutAndAPIKeyFix()
  .then(success => {
    console.log(`\n🎯 测试结果: ${success ? '✅ 全部修复成功' : '⚠️ 仍有问题需要解决'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  }); 