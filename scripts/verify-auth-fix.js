#!/usr/bin/env node

/**
 * 验证云端API认证修复
 */

const fs = require('fs');
const path = require('path');

function verifyCodeFix() {
  console.log('🔍 验证代码修复状态...\n');
  
  const filePath = path.join(__dirname, '../lib/deepseek/deepseek-dual-client.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // 检查是否还有错误的ollama认证头用于云端API
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    if (line.includes("'Authorization': 'Bearer ollama'") || 
        line.includes('"Authorization": "Bearer ollama"')) {
      
      // 检查上下文，确定是否是云端API相关
      const context = lines.slice(Math.max(0, index - 5), index + 5).join('\n');
      
      if (context.includes('cloud') || 
          context.includes('云端') || 
          context.includes('testProviderConnection') ||
          context.includes('quickHealthCheck')) {
        issues.push({
          line: index + 1,
          content: line.trim(),
          context: '云端API相关'
        });
      }
    }
  });
  
  console.log('📋 代码检查结果:');
  if (issues.length === 0) {
    console.log('✅ 代码修复完成！没有发现云端API认证问题');
  } else {
    console.log('❌ 发现以下问题:');
    issues.forEach(issue => {
      console.log(`  行 ${issue.line}: ${issue.content} (${issue.context})`);
    });
  }
  
  // 检查正确的认证头
  const correctAuthCount = (content.match(/Bearer \$\{config\.cloudConfig\.apiKey\}/g) || []).length;
  console.log(`✅ 找到 ${correctAuthCount} 处正确的云端API认证头`);
  
  console.log('\n🔑 环境变量检查:');
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    console.log('✅ DEEPSEEK_API_KEY已设置');
    console.log(`📝 密钥格式: ${apiKey.substring(0, 8)}...`);
    console.log(`📏 密钥长度: ${apiKey.length} 字符`);
    
    if (apiKey.startsWith('sk-')) {
      console.log('✅ API密钥格式正确');
    } else {
      console.log('⚠️  API密钥格式可能不正确（应以sk-开头）');
    }
  } else {
    console.log('❌ DEEPSEEK_API_KEY未设置');
    console.log('请运行: export DEEPSEEK_API_KEY="your_api_key_here"');
  }
  
  console.log('\n📊 修复状态总结:');
  console.log('代码修复:', issues.length === 0 ? '✅ 完成' : '❌ 需要修复');
  console.log('API密钥:', apiKey ? '✅ 已设置' : '❌ 未设置');
  console.log('整体状态:', (issues.length === 0 && apiKey) ? '✅ 可以使用' : '⚠️  需要配置');
  
  return {
    codeFixed: issues.length === 0,
    apiKeySet: !!apiKey,
    issues
  };
}

function main() {
  console.log('🚀 云端API认证修复验证\n');
  console.log('='.repeat(50));
  
  const result = verifyCodeFix();
  
  console.log('\n📋 下一步操作:');
  
  if (!result.codeFixed) {
    console.log('1. 🔧 修复代码中的认证问题');
  }
  
  if (!result.apiKeySet) {
    console.log('2. 🔑 设置DEEPSEEK_API_KEY环境变量');
    console.log('   export DEEPSEEK_API_KEY="your_api_key_here"');
  }
  
  if (result.codeFixed && result.apiKeySet) {
    console.log('🎉 修复完成！您现在可以:');
    console.log('1. 重启开发服务器: npm run dev');
    console.log('2. 测试云端API功能');
    console.log('3. 在编辑器中体验AI增强功能');
  }
  
  console.log('\n✅ 验证完成！');
}

if (require.main === module) {
  main();
}

module.exports = { verifyCodeFix }; 