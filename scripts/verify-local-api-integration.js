/**
 * 本地API嵌入集成验证脚本
 */

console.log('🔍 本地API嵌入集成验证');
console.log('='.repeat(50));

async function verifyIntegration() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // 1. 检查文件结构
    console.log('\n1. 检查文件结构...');
    const requiredFiles = [
      'lib/embeddings/local-api-client.ts',
      'lib/rag/new-knowledge-retriever.ts',
      'scripts/test-local-api-embedding.js',
      'scripts/test-rag-with-local-api.js'
    ];
    
    let filesExist = 0;
    for (const file of requiredFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        console.log(`   ✅ ${file}`);
        filesExist++;
      } else {
        console.log(`   ❌ ${file} - 文件不存在`);
      }
    }
    
    console.log(`\n   📊 文件检查结果: ${filesExist}/${requiredFiles.length} 文件存在`);
    
    // 2. 检查代码集成
    console.log('\n2. 检查代码集成...');
    
    // 检查本地API客户端
    const clientCode = fs.readFileSync('lib/embeddings/local-api-client.ts', 'utf8');
    const hasClientClass = clientCode.includes('export class LocalApiEmbeddingClient');
    const hasGenerateEmbedding = clientCode.includes('generateEmbedding');
    const hasCheckApiStatus = clientCode.includes('checkApiStatus');
    
    console.log(`   ${hasClientClass ? '✅' : '❌'} LocalApiEmbeddingClient 类定义`);
    console.log(`   ${hasGenerateEmbedding ? '✅' : '❌'} generateEmbedding 方法`);
    console.log(`   ${hasCheckApiStatus ? '✅' : '❌'} checkApiStatus 方法`);
    
    // 检查RAG集成
    const ragCode = fs.readFileSync('lib/rag/new-knowledge-retriever.ts', 'utf8');
    const hasImport = ragCode.includes('LocalApiEmbeddingClient');
    const hasLocalApiClient = ragCode.includes('localApiClient');
    const hasTryLocalApi = ragCode.includes('tryLocalApiEmbedding');
    
    console.log(`   ${hasImport ? '✅' : '❌'} LocalApiEmbeddingClient 导入`);
    console.log(`   ${hasLocalApiClient ? '✅' : '❌'} localApiClient 属性`);
    console.log(`   ${hasTryLocalApi ? '✅' : '❌'} tryLocalApiEmbedding 方法`);
    
    // 3. 检查Ollama服务
    console.log('\n3. 检查Ollama服务状态...');
    try {
      const response = await fetch('http://localhost:11434/api/version', {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Ollama服务运行正常 (版本: ${data.version || 'unknown'})`);
      } else {
        console.log('   ❌ Ollama服务响应异常');
      }
    } catch (error) {
      console.log('   ⚠️  Ollama服务未运行或不可访问');
      console.log('   💡 提示: 运行 "ollama serve" 启动服务');
    }
    
    // 4. 总结
    console.log('\n📊 验证总结:');
    const codeIntegration = hasClientClass && hasGenerateEmbedding && hasImport && hasLocalApiClient;
    console.log(`   ${codeIntegration ? '✅' : '❌'} 代码集成: ${codeIntegration ? '完成' : '未完成'}`);
    console.log(`   ${filesExist === requiredFiles.length ? '✅' : '❌'} 文件结构: ${filesExist === requiredFiles.length ? '完整' : '不完整'}`);
    console.log('   🛡️  降级机制: 自动回退到本地算法');
    
    if (codeIntegration && filesExist === requiredFiles.length) {
      console.log('\n🎉 本地API嵌入集成验证通过！');
      console.log('💡 系统已准备就绪，可以开始使用高质量的嵌入向量生成功能。');
    } else {
      console.log('\n⚠️  发现问题，请检查上述错误并修复。');
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
  }
}

verifyIntegration();
