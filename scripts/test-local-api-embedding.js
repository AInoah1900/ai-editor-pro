const { LocalApiEmbeddingClient } = require('../lib/embeddings/local-api-client');

/**
 * 测试本地API嵌入向量生成功能
 */
async function testLocalApiEmbedding() {
  console.log('🧠 本地API嵌入向量测试');
  console.log('='.repeat(50));
  
  try {
    // 创建本地API客户端
    const client = new LocalApiEmbeddingClient();
    
    console.log('\n📋 配置信息:');
    const config = client.getConfig();
    console.log(`   基础URL: ${config.baseUrl}`);
    console.log(`   模型: ${config.model}`);
    console.log(`   超时时间: ${config.timeout}ms`);
    
    // 1. 检查API服务状态
    console.log('\n1. 检查API服务状态...');
    const apiStatus = await client.checkApiStatus();
    if (!apiStatus) {
      console.log('❌ API服务不可用，请确保Ollama服务正在运行');
      console.log('💡 启动命令: ollama serve');
      return;
    }
    
    // 2. 检查模型可用性
    console.log('\n2. 检查模型可用性...');
    const modelStatus = await client.checkModelAvailability();
    if (!modelStatus) {
      console.log('❌ 模型不可用，请确保模型已下载');
      console.log('💡 下载命令: ollama pull deepseek-r1:8b');
      return;
    }
    
    // 3. 测试单个文本嵌入
    console.log('\n3. 测试单个文本嵌入...');
    const testTexts = [
      '量子纠缠是量子力学中的现象',
      'Quantum mechanics is fundamental to physics',
      '这是一个用于测试嵌入向量生成的中文文本示例，包含了技术、科学等多个领域的内容。',
      'This is a test document for embedding generation.',
      'AI编辑器智能校对功能测试'
    ];
    
    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      console.log(`\n   测试 ${i + 1}: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
      
      try {
        const startTime = Date.now();
        const embedding = await client.generateEmbedding(text);
        const endTime = Date.now();
        
        console.log(`   ✅ 成功 (${endTime - startTime}ms)`);
        console.log(`   📊 向量维度: ${embedding.length}`);
        console.log(`   📈 向量范围: [${Math.min(...embedding).toFixed(4)}, ${Math.max(...embedding).toFixed(4)}]`);
        console.log(`   🎯 前5个值: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
        
        // 验证向量质量
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        console.log(`   📏 向量模长: ${magnitude.toFixed(6)}`);
        
        // 检查是否有无效值
        const invalidCount = embedding.filter(val => 
          val === null || val === undefined || !isFinite(val) || isNaN(val)
        ).length;
        
        if (invalidCount > 0) {
          console.log(`   ⚠️  发现 ${invalidCount} 个无效值`);
        } else {
          console.log(`   ✅ 向量数据有效`);
        }
        
      } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
      }
      
      // 添加延迟避免API过载
      if (i < testTexts.length - 1) {
        console.log('   ⏳ 等待1秒...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 4. 测试批量嵌入
    console.log('\n4. 测试批量嵌入...');
    const batchTexts = [
      '第一个测试文本',
      '第二个测试文本',
      '第三个测试文本'
    ];
    
    try {
      const startTime = Date.now();
      const batchEmbeddings = await client.generateBatchEmbeddings(batchTexts);
      const endTime = Date.now();
      
      console.log(`   ✅ 批量嵌入成功 (${endTime - startTime}ms)`);
      console.log(`   📊 生成向量数: ${batchEmbeddings.length}`);
      console.log(`   📈 每个向量维度: ${batchEmbeddings[0]?.length || 0}`);
      
    } catch (error) {
      console.log(`   ❌ 批量嵌入失败: ${error.message}`);
    }
    
    // 5. 性能测试
    console.log('\n5. 性能测试...');
    const performanceText = '这是一个性能测试文本，用于评估API的响应速度和稳定性。';
    const iterations = 3;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const startTime = Date.now();
        await client.generateEmbedding(performanceText);
        const endTime = Date.now();
        times.push(endTime - startTime);
        console.log(`   测试 ${i + 1}: ${endTime - startTime}ms`);
      } catch (error) {
        console.log(`   测试 ${i + 1}: 失败 - ${error.message}`);
      }
      
      if (i < iterations - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (times.length > 0) {
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`\n📊 性能统计:`);
      console.log(`   平均响应时间: ${avgTime.toFixed(2)}ms`);
      console.log(`   最快响应时间: ${minTime}ms`);
      console.log(`   最慢响应时间: ${maxTime}ms`);
    }
    
    console.log('\n🎉 本地API嵌入测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testLocalApiEmbedding();
