const { NewKnowledgeRetriever } = require('../lib/rag/new-knowledge-retriever.ts');

async function testVectorGeneration() {
  console.log('🧪 测试向量生成修复...\n');
  
  try {
    const retriever = new NewKnowledgeRetriever();
    
    // 测试用例
    const testCases = [
      { name: '正常文本', text: '这是一个测试文档，包含技术内容和学术研究。' },
      { name: '空文本', text: '' },
      { name: '只有空格', text: '   ' },
      { name: '只有标点', text: '。！？，；：' },
      { name: '纯数字', text: '123456789' },
      { name: '纯英文', text: 'This is a test document with technical content.' },
      { name: '混合内容', text: '技术文档123 technical content！研究方法。' }
    ];
    
    let successCount = 0;
    let totalTests = testCases.length;
    
    for (const testCase of testCases) {
      try {
        console.log(`测试: ${testCase.name}`);
        console.log(`文本: "${testCase.text}"`);
        
        // 通过反射调用私有方法进行测试
        const vector = await retriever.generateEmbedding(testCase.text);
        
        // 验证向量
        if (!Array.isArray(vector)) {
          throw new Error('返回值不是数组');
        }
        
        if (vector.length !== 4096) {
          throw new Error(`向量维度错误: ${vector.length}, 期望: 4096`);
        }
        
        // 检查是否有无效值
        const invalidValues = vector.filter(val => 
          val === null || val === undefined || !isFinite(val) || isNaN(val)
        );
        
        if (invalidValues.length > 0) {
          throw new Error(`发现 ${invalidValues.length} 个无效值: ${invalidValues.slice(0, 5).join(', ')}`);
        }
        
        // 检查向量是否全为0
        const nonZeroCount = vector.filter(val => Math.abs(val) > 0.0001).length;
        if (nonZeroCount === 0) {
          console.log('⚠️  警告: 向量全为零');
        }
        
        console.log(`✅ 成功 - 维度: ${vector.length}, 非零值: ${nonZeroCount}`);
        console.log(`   前5个值: [${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`);
        successCount++;
        
      } catch (error) {
        console.log(`❌ 失败: ${error.message}`);
      }
      
      console.log('');
    }
    
    console.log('\n📊 测试总结:');
    console.log(`总测试数: ${totalTests}`);
    console.log(`成功: ${successCount}`);
    console.log(`失败: ${totalTests - successCount}`);
    console.log(`成功率: ${((successCount / totalTests) * 100).toFixed(1)}%`);
    
    return successCount === totalTests;
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return false;
  }
}

// 运行测试
testVectorGeneration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  }); 