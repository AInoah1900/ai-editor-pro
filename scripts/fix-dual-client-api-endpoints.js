#!/usr/bin/env node

/**
 * 修复双客户端中的API端点，使用OpenAI兼容格式
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'deepseek', 'deepseek-dual-client.ts');

function fixDualClientEndpoints() {
  console.log('🔧 修复双客户端API端点...');
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复testProviderConnection方法中的本地API端点
    content = content.replace(
      /const url = `\${config\.localConfig\.baseURL}\/api\/chat`;/g,
      'const url = `${config.localConfig.baseURL}/v1/chat/completions`;'
    );
    
    // 修复testProviderConnection方法中的请求体格式
    content = content.replace(
      /const requestBody = \{[\s\S]*?model: config\.localConfig\.model,[\s\S]*?messages: \[\{ role: 'user', content: '测试连接' \}\],[\s\S]*?stream: false,[\s\S]*?options: \{[\s\S]*?temperature: 0\.1,[\s\S]*?num_predict: 10[\s\S]*?\}[\s\S]*?\};/g,
      `const requestBody = {
        model: config.localConfig.model,
        messages: [{ role: 'user', content: '测试连接' }],
        temperature: 0.1,
        max_tokens: 10,
        stream: false
      };`
    );
    
    // 修复quickHealthCheck方法中的本地API端点
    content = content.replace(
      /const url = `\${config\.localConfig\.baseURL}\/api\/chat`;[\s\S]*?const requestBody = \{[\s\S]*?model: config\.localConfig\.model,[\s\S]*?messages: \[\{ role: 'user', content: '测试' \}\],[\s\S]*?stream: false,[\s\S]*?options: \{[\s\S]*?temperature: 0\.1,[\s\S]*?num_predict: 5[\s\S]*?\}[\s\S]*?\};/g,
      `const url = \`\${config.localConfig.baseURL}/v1/chat/completions\`;
      const requestBody = {
        model: config.localConfig.model,
        messages: [{ role: 'user', content: '测试' }],
        temperature: 0.1,
        max_tokens: 5,
        stream: false
      };`
    );
    
    // 修复请求头，添加Authorization
    content = content.replace(
      /headers: \{[\s\S]*?'Content-Type': 'application\/json',[\s\S]*?\},/g,
      `headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ollama'
        },`
    );
    
    fs.writeFileSync(filePath, content);
    console.log('✅ 双客户端API端点修复完成');
    
    return true;
  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    return false;
  }
}

if (require.main === module) {
  fixDualClientEndpoints();
}
