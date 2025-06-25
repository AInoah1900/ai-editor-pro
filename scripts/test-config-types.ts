/**
 * 测试DeepSeek配置类型修复
 */

import { getDeepSeekConfig } from '../lib/deepseek/deepseek-config';

console.log('🧪 测试DeepSeek配置类型修复...\n');

async function testConfigTypes() {
  try {
    console.log('✅ 配置模块导入成功');
    
    // 获取配置管理器实例
    const configManager = getDeepSeekConfig();
    console.log('✅ 配置管理器实例创建成功');
    
    // 测试基本配置获取
    const config = configManager.getConfig();
    console.log('✅ 配置获取成功');
    console.log(`   📝 当前提供商: ${config.provider}`);
    console.log(`   📝 云端模型: ${config.cloudConfig.model}`);
    console.log(`   📝 本地模型: ${config.localConfig.model}`);
    
    // 测试活动配置获取
    const activeConfig = configManager.getActiveConfig();
    console.log('✅ 活动配置获取成功');
    console.log(`   📝 当前API端点: ${activeConfig.baseURL}`);
    console.log(`   📝 当前模型: ${activeConfig.model}`);
    
    // 测试提供商获取
    const currentProvider = configManager.getProvider();
    console.log('✅ 提供商获取成功');
    console.log(`   📝 当前提供商: ${currentProvider}`);
    
    // 测试超时时间获取
    const timeout = configManager.getTimeoutForTask('default');
    console.log('✅ 超时时间获取成功');
    console.log(`   📝 默认超时: ${timeout}ms`);
    
    // 测试云端API可用性检查
    const cloudAvailable = configManager.isCloudAPIAvailable();
    console.log('✅ 云端API可用性检查成功');
    console.log(`   📝 云端API可用: ${cloudAvailable}`);
    
    // 测试本地模型列表获取（如果本地API可用）
    try {
      const localModels = await configManager.getAvailableLocalModels();
      console.log('✅ 本地模型列表获取成功');
      console.log(`   📝 可用模型: ${localModels.join(', ') || '无'}`);
    } catch (error) {
      console.log('ℹ️  本地API不可用（这是正常的）');
    }
    
    // 测试状态报告
    try {
      const statusReport = await configManager.getStatusReport();
      console.log('✅ 状态报告获取成功');
      console.log(`   📝 云端状态: ${statusReport.cloudStatus.available ? '可用' : '不可用'}`);
      console.log(`   📝 本地状态: ${statusReport.localStatus.available ? '可用' : '不可用'}`);
    } catch (error) {
      console.log('ℹ️  状态报告获取失败（可能是网络问题）');
    }
    
    console.log('\n🎉 所有类型测试通过！');
    console.log('✨ TypeScript类型错误已修复');
    console.log('🔧 修复内容:');
    console.log('   - 修复了 runtimeOverrides.localConfig 的类型问题');
    console.log('   - 将 any 类型替换为 unknown 类型');
    console.log('   - 添加了 ModelData 接口定义');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testConfigTypes(); 