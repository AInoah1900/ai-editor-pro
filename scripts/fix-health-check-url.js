#!/usr/bin/env node

/**
 * 修复健康检查中的URL重复问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 修复健康检查URL重复问题');
console.log('=' .repeat(50));

function fixHealthCheckUrl() {
  const filePath = path.join(__dirname, '..', 'lib', 'deepseek', 'deepseek-dual-client.ts');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ 文件不存在:', filePath);
    return false;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 修复第一个出现的位置（testProviderConnection方法）
  const oldPattern1 = `      const url = \`\${config.localConfig.baseURL}/v1/chat/completions\`;
      const requestBody = {
        model: config.localConfig.model,
        messages: [{ role: 'user', content: '测试连接' }],`;
        
  const newPattern1 = `      // 修复：确保URL格式正确，避免重复的/v1
      const baseURL = config.localConfig.baseURL;
      const url = baseURL.endsWith('/v1') 
        ? \`\${baseURL}/chat/completions\`
        : \`\${baseURL}/v1/chat/completions\`;
      const requestBody = {
        model: config.localConfig.model,
        messages: [{ role: 'user', content: '测试连接' }],`;
  
  // 修复第二个出现的位置（quickHealthCheck方法）
  const oldPattern2 = `      const url = \`\${config.localConfig.baseURL}/v1/chat/completions\`;
      const requestBody = {
        model: config.localConfig.model,
        messages: [{ role: 'user', content: '测试' }],`;
        
  const newPattern2 = `      // 修复：确保URL格式正确，避免重复的/v1
      const baseURL = config.localConfig.baseURL;
      const url = baseURL.endsWith('/v1') 
        ? \`\${baseURL}/chat/completions\`
        : \`\${baseURL}/v1/chat/completions\`;
      const requestBody = {
        model: config.localConfig.model,
        messages: [{ role: 'user', content: '测试' }],`;
  
  let fixed = false;
  
  // 执行替换
  if (content.includes(oldPattern1)) {
    content = content.replace(oldPattern1, newPattern1);
    console.log('✅ 修复了testProviderConnection方法');
    fixed = true;
  }
  
  if (content.includes(oldPattern2)) {
    content = content.replace(oldPattern2, newPattern2);
    console.log('✅ 修复了quickHealthCheck方法');
    fixed = true;
  }
  
  if (fixed) {
    // 备份原文件
    const backupPath = filePath + '.backup2';
    if (!fs.existsSync(backupPath)) {
      fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'));
      console.log('📁 创建备份文件:', backupPath);
    }
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, content);
    console.log('✅ 健康检查URL问题已修复');
    return true;
  } else {
    console.log('ℹ️  未找到需要修复的模式，可能已经修复');
    return true;
  }
}

// 测试修复效果
async function testFix() {
  console.log('\n🧪 测试修复效果...');
  
  try {
    // 等待应用重新加载
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch('http://localhost:3000/api/deepseek-config?action=health');
    if (response.ok) {
      const data = await response.json();
      console.log('📊 修复后健康状态:', JSON.stringify(data.data, null, 2));
      
      if (data.data.local.available) {
        console.log('🎉 修复成功！本地API健康检查现在正常');
        return true;
      } else {
        console.log(`⚠️  本地API健康检查仍有问题: ${data.data.local.error}`);
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
    const fixed = fixHealthCheckUrl();
    
    if (fixed) {
      const testResult = await testFix();
      
      if (testResult) {
        console.log('\n🎉 健康检查URL问题修复完成！');
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

module.exports = { fixHealthCheckUrl, testFix }; 