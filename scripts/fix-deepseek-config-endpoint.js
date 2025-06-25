#!/usr/bin/env node

/**
 * 修复DeepSeek配置端点问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 修复DeepSeek配置端点问题');
console.log('=' .repeat(50));

function fixDeepSeekConfigEndpoints() {
  const configPath = path.join(__dirname, '..', 'lib', 'deepseek', 'deepseek-config.ts');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ 配置文件不存在:', configPath);
    return false;
  }
  
  let content = fs.readFileSync(configPath, 'utf8');
  
  // 修复isLocalAPIAvailable方法
  const oldIsLocalAPI = `      const response = await fetch(\`\${currentConfig.localConfig.baseURL}/api/tags\`, {
        method: 'GET',
      });`;
      
  const newIsLocalAPI = `      // 修复：根据baseURL的格式决定使用哪个端点
      const baseURL = currentConfig.localConfig.baseURL;
      const tagsEndpoint = baseURL.includes('/v1') 
        ? baseURL.replace('/v1', '/api/tags')
        : \`\${baseURL}/api/tags\`;
      
      console.log(\`🔍 检查本地API可用性: \${tagsEndpoint}\`);
      
      const response = await fetch(tagsEndpoint, {
        method: 'GET',
      });`;
  
  // 修复getAvailableLocalModels方法
  const oldGetModels = `      const response = await fetch(\`\${currentConfig.localConfig.baseURL}/api/tags\`, {
        method: 'GET',
      });`;
      
  const newGetModels = `      // 修复：根据baseURL的格式决定使用哪个端点
      const baseURL = currentConfig.localConfig.baseURL;
      const tagsEndpoint = baseURL.includes('/v1') 
        ? baseURL.replace('/v1', '/api/tags')
        : \`\${baseURL}/api/tags\`;
        
      const response = await fetch(tagsEndpoint, {
        method: 'GET',
      });`;
  
  // 执行替换
  let fixed = false;
  
  if (content.includes('${currentConfig.localConfig.baseURL}/api/tags')) {
    // 替换第一个出现的位置（isLocalAPIAvailable）
    const firstIndex = content.indexOf('${currentConfig.localConfig.baseURL}/api/tags');
    if (firstIndex !== -1) {
      const beforeFirst = content.substring(0, firstIndex - 50);
      const afterFirst = content.substring(firstIndex + 60);
      
      // 查找完整的方法块
      const methodStart = beforeFirst.lastIndexOf('const response = await fetch(`');
      const methodEnd = afterFirst.indexOf('});') + 3;
      
      if (methodStart !== -1 && methodEnd !== -1) {
        const before = content.substring(0, methodStart);
        const after = content.substring(methodStart + methodEnd + 60);
        
        content = before + newIsLocalAPI + after;
        fixed = true;
        console.log('✅ 修复了isLocalAPIAvailable方法');
      }
    }
    
    // 替换第二个出现的位置（getAvailableLocalModels）
    const secondIndex = content.indexOf('${currentConfig.localConfig.baseURL}/api/tags');
    if (secondIndex !== -1) {
      const beforeSecond = content.substring(0, secondIndex - 50);
      const afterSecond = content.substring(secondIndex + 60);
      
      const methodStart = beforeSecond.lastIndexOf('const response = await fetch(`');
      const methodEnd = afterSecond.indexOf('});') + 3;
      
      if (methodStart !== -1 && methodEnd !== -1) {
        const before = content.substring(0, methodStart);
        const after = content.substring(methodStart + methodEnd + 60);
        
        content = before + newGetModels + after;
        fixed = true;
        console.log('✅ 修复了getAvailableLocalModels方法');
      }
    }
  }
  
  if (fixed) {
    // 备份原文件
    const backupPath = configPath + '.backup';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, fs.readFileSync(configPath, 'utf8'));
      console.log('📁 创建备份文件:', backupPath);
    }
    
    // 写入修复后的内容
    fs.writeFileSync(configPath, content);
    console.log('✅ 配置文件已修复');
    return true;
  } else {
    console.log('ℹ️  配置文件可能已经修复或不需要修复');
    return true;
  }
}

// 测试修复效果
async function testFix() {
  console.log('\n🧪 测试修复效果...');
  
  try {
    // 重新导入配置
    delete require.cache[require.resolve('../lib/deepseek/deepseek-config.ts')];
    
    // 测试API连接
    const response = await fetch('http://localhost:3000/api/deepseek-config?action=status');
    if (response.ok) {
      const data = await response.json();
      console.log('📊 修复后状态:', JSON.stringify(data.data, null, 2));
      
      if (data.data.localStatus.available) {
        console.log('🎉 修复成功！本地API现在可用');
        return true;
      } else {
        console.log('⚠️  本地API仍然不可用，可能需要重启Next.js应用');
        return false;
      }
    } else {
      console.log('❌ 无法连接到Next.js API');
      return false;
    }
  } catch (error) {
    console.log('❌ 测试修复效果失败:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  try {
    const fixed = fixDeepSeekConfigEndpoints();
    
    if (fixed) {
      console.log('\n⏳ 等待应用重新加载...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const testResult = await testFix();
      
      if (testResult) {
        console.log('\n🎉 DeepSeek配置端点问题修复完成！');
        console.log('💡 建议：重启Next.js应用以确保配置生效');
      } else {
        console.log('\n⚠️  修复可能需要重启Next.js应用才能生效');
      }
    }
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixDeepSeekConfigEndpoints, testFix }; 