#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'lib', 'deepseek', 'deepseek-dual-client.ts');

console.log('🔧 修复双客户端语法错误...');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. 将 /api/chat 替换为 /v1/chat/completions
  content = content.replace(/\/api\/chat/g, '/v1/chat/completions');
  
  // 2. 修复本地API请求体格式 - 移除 options 并使用标准参数
  content = content.replace(
    /stream: false,\s*options: \{\s*temperature: 0\.1,\s*num_predict: (\d+)\s*\}/g,
    'temperature: 0.1,\n        max_tokens: $1,\n        stream: false'
  );
  
  // 3. 为本地API添加Authorization头
  content = content.replace(
    /(headers: \{\s*'Content-Type': 'application\/json',)\s*(\},)/g,
    "$1\n          'Authorization': 'Bearer ollama'\n        $2"
  );
  
  // 4. 修复云端API的Authorization头（确保不被覆盖）
  content = content.replace(
    /'Authorization': 'Bearer ollama'\n        \},\n      body: JSON\.stringify\(requestBody\)\n    \}\);[\s\S]*?if \(!response\.ok\) \{[\s\S]*?throw new Error\(`云端API错误/g,
    function(match) {
      return match.replace("'Authorization': 'Bearer ollama'", "'Authorization': `Bearer ${config.cloudConfig.apiKey}`");
    }
  );
  
  fs.writeFileSync(filePath, content);
  console.log('✅ 双客户端语法修复完成');
  
} catch (error) {
  console.error('❌ 修复失败:', error.message);
}
