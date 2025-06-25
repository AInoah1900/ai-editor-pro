#!/usr/bin/env node

/**
 * DeepSeek配置问题诊断脚本
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DeepSeek配置问题诊断');
console.log('=' .repeat(50));

async function diagnoseDeepSeekIssue() {
  try {
    // 1. 检查环境变量
    console.log('\n📋 环境变量检查:');
    console.log(`DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '已设置' : '未设置'}`);
    console.log(`DEEPSEEK_PROVIDER: ${process.env.DEEPSEEK_PROVIDER || '未设置'}`);
    console.log(`DEEPSEEK_LOCAL_BASE_URL: ${process.env.DEEPSEEK_LOCAL_BASE_URL || '未设置'}`);
    console.log(`DEEPSEEK_LOCAL_MODEL: ${process.env.DEEPSEEK_LOCAL_MODEL || '未设置'}`);
    
    // 2. 检查.env文件
    console.log('\n📁 环境文件检查:');
    const envFiles = ['.env', '.env.local', '.env.development'];
    for (const file of envFiles) {
      const exists = fs.existsSync(file);
      console.log(`${file}: ${exists ? '存在' : '不存在'}`);
      if (exists) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').filter(line => line.includes('DEEPSEEK'));
        if (lines.length > 0) {
          console.log(`  DeepSeek相关配置:`);
          lines.forEach(line => console.log(`    ${line}`));
        }
      }
    }
    
    // 3. 测试本地API连接
    console.log('\n🔌 本地API连接测试:');
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 本地API连接成功');
        console.log(`📋 可用模型: ${data.models?.map(m => m.name).join(', ') || '无'}`);
        
        // 测试具体模型
        if (data.models && data.models.length > 0) {
          const firstModel = data.models[0].name;
          console.log(`\n🧪 测试模型 ${firstModel}:`);
          
          const testResponse = await fetch('http://localhost:11434/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ollama'
            },
            body: JSON.stringify({
              model: firstModel,
              messages: [{ role: 'user', content: '测试' }],
              max_tokens: 10
            })
          });
          
          if (testResponse.ok) {
            console.log('✅ OpenAI兼容接口测试成功');
          } else {
            console.log(`❌ OpenAI兼容接口测试失败: ${testResponse.status}`);
          }
        }
      } else {
        console.log(`❌ 本地API连接失败: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ 本地API连接异常: ${error.message}`);
    }
    
    // 4. 测试Next.js API
    console.log('\n🌐 Next.js API测试:');
    try {
      const response = await fetch('http://localhost:3000/api/deepseek-config?action=status');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Next.js API连接成功');
        console.log('📊 配置状态:', JSON.stringify(data, null, 2));
      } else {
        console.log(`❌ Next.js API连接失败: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Next.js API连接异常: ${error.message}`);
    }
    
    // 5. 检查DeepSeek配置管理器
    console.log('\n⚙️ DeepSeek配置管理器测试:');
    try {
      // 动态导入配置管理器
      const { getDeepSeekConfig } = await import('../lib/deepseek/deepseek-config.js');
      const configManager = getDeepSeekConfig();
      
      const config = configManager.getConfig();
      console.log('📋 当前配置:');
      console.log(`  提供商: ${config.provider}`);
      console.log(`  云端API密钥: ${config.cloudConfig.apiKey ? '已设置' : '未设置'}`);
      console.log(`  本地API地址: ${config.localConfig.baseURL}`);
      console.log(`  本地模型: ${config.localConfig.model}`);
      
      // 测试本地API可用性
      const localAvailable = await configManager.isLocalAPIAvailable();
      console.log(`  本地API可用性: ${localAvailable ? '可用' : '不可用'}`);
      
      // 获取可用模型
      const availableModels = await configManager.getAvailableLocalModels();
      console.log(`  可用模型: ${availableModels.join(', ') || '无'}`);
      
    } catch (error) {
      console.log(`❌ 配置管理器测试失败: ${error.message}`);
    }
    
    // 6. 生成修复建议
    console.log('\n💡 修复建议:');
    console.log('1. 确保Ollama服务正在运行');
    console.log('2. 检查本地API地址是否正确 (http://localhost:11434)');
    console.log('3. 确认模型名称匹配 (deepseek-r1:8b)');
    console.log('4. 检查环境变量配置');
    console.log('5. 重启Next.js应用');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error);
  }
}

// 运行诊断
if (require.main === module) {
  diagnoseDeepSeekIssue().then(() => {
    console.log('\n🎉 诊断完成');
  }).catch(error => {
    console.error('💥 诊断失败:', error);
    process.exit(1);
  });
}

module.exports = { diagnoseDeepSeekIssue }; 