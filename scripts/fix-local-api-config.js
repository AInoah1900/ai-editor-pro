/**
 * 修复本地API配置脚本
 * 自动检测可用的本地模型并更新配置
 */

const fs = require('fs');
const path = require('path');

async function fixLocalAPIConfig() {
  console.log('🔧 修复本地API配置...');
  
  try {
    // 1. 检查本地API是否可用
    console.log('📡 检查本地API状态...');
    const response = await fetch('http://localhost:11434/api/tags');
    
    if (!response.ok) {
      console.log('❌ 本地API不可用，请确保Ollama服务正在运行');
      console.log('💡 启动命令: ollama serve');
      return false;
    }
    
    const data = await response.json();
    console.log('✅ 本地API可用');
    
    if (!data.models || data.models.length === 0) {
      console.log('❌ 没有可用的模型');
      console.log('💡 下载模型: ollama pull deepseek-r1:8b');
      return false;
    }
    
    const availableModels = data.models.map(m => m.name);
    console.log('📋 可用模型:', availableModels.join(', '));
    
    // 2. 选择最佳模型
    let bestModel = availableModels[0]; // 默认使用第一个
    
    // 优先选择deepseek相关模型
    const deepseekModels = availableModels.filter(name => 
      name.toLowerCase().includes('deepseek')
    );
    
    if (deepseekModels.length > 0) {
      bestModel = deepseekModels[0];
    }
    
    console.log('🎯 选择模型:', bestModel);
    
    // 3. 测试模型是否能正常工作
    console.log('💬 测试模型响应...');
    const testResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: bestModel,
        messages: [{ role: 'user', content: '测试' }],
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 10
        }
      })
    });
    
    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      console.log('❌ 模型测试失败:', testResponse.status, errorText);
      return false;
    }
    
    const testResult = await testResponse.json();
    console.log('✅ 模型测试成功');
    console.log('📝 测试响应:', testResult.message.content.substring(0, 50) + '...');
    
    // 4. 更新配置文件
    console.log('📝 更新配置文件...');
    
    const configPath = path.join(__dirname, '../lib/deepseek/deepseek-config.ts');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // 替换默认模型名称
    configContent = configContent.replace(
      /model: 'deepseek-chat'.*\/\/ 使用实际可用的本地模型名称/,
      `model: '${bestModel}' // 自动检测的本地模型名称`
    );
    
    // 如果没有找到上面的模式，尝试替换原始的配置
    if (!configContent.includes(bestModel)) {
      configContent = configContent.replace(
        /model: '[^']*'/g,
        (match, offset) => {
          // 只替换localConfig中的model
          const beforeMatch = configContent.substring(0, offset);
          const lastLocalConfig = beforeMatch.lastIndexOf('localConfig');
          const lastCloudConfig = beforeMatch.lastIndexOf('cloudConfig');
          
          if (lastLocalConfig > lastCloudConfig) {
            return `model: '${bestModel}'`;
          }
          return match;
        }
      );
    }
    
    fs.writeFileSync(configPath, configContent);
    console.log('✅ 配置文件更新成功');
    
    // 5. 生成环境变量建议
    console.log('');
    console.log('🎉 本地API配置修复完成！');
    console.log('');
    console.log('💡 环境变量建议:');
    console.log('  export DEEPSEEK_PROVIDER=local');
    console.log(`  export DEEPSEEK_LOCAL_MODEL=${bestModel}`);
    console.log('  export DEEPSEEK_LOCAL_BASE_URL=http://localhost:11434/api');
    console.log('');
    console.log('🚀 现在可以使用本地API了:');
    console.log('  1. 启动开发服务器: npm run dev');
    console.log('  2. 访问配置页面: http://localhost:3000/deepseek-config');
    console.log('  3. 切换到本地API模式');
    
    return true;
    
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    return false;
  }
}

// 运行修复
if (require.main === module) {
  fixLocalAPIConfig().catch(console.error);
}

module.exports = { fixLocalAPIConfig }; 