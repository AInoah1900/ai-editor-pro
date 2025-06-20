#!/usr/bin/env node

/**
 * Qdrant向量搜索测试脚本
 * 测试向量搜索功能是否正常
 */

const { QdrantClient } = require('@qdrant/js-client-rest');

async function testQdrantSearch() {
  console.log('🔍 测试Qdrant向量搜索...\n');

  const client = new QdrantClient({
    url: 'http://localhost:6333',
  });

  try {
    // 1. 检查集合状态
    console.log('📊 检查集合状态...');
    const collectionInfo = await client.getCollection('knowledge-base');
    console.log(`   集合状态: ${collectionInfo.status}`);
    console.log(`   数据点数量: ${collectionInfo.points_count}`);
    console.log(`   向量维度: ${collectionInfo.config.params.vectors.size}`);
    console.log('');

    if (collectionInfo.points_count === 0) {
      console.log('⚠️  集合为空，添加测试数据...');
      
      // 添加测试向量
      const testVector = new Array(1024).fill(0);
      // 生成一些随机值
      for (let i = 0; i < 100; i++) {
        testVector[i] = Math.random();
      }
      
      // 标准化向量
      const magnitude = Math.sqrt(testVector.reduce((sum, val) => sum + val * val, 0));
      const normalizedVector = testVector.map(val => val / magnitude);
      
      await client.upsert('knowledge-base', {
        points: [
          {
            id: 1,
            vector: normalizedVector,
            payload: {
              original_id: 'test_1',
              content: '这是一个测试知识项',
              domain: 'test',
              type: 'test'
            }
          }
        ]
      });
      
      console.log('✅ 测试数据添加成功\n');
    }

    // 2. 测试向量搜索
    console.log('🔎 测试向量搜索...');
    
    // 生成查询向量
    const queryVector = new Array(1024).fill(0);
    for (let i = 0; i < 100; i++) {
      queryVector[i] = Math.random();
    }
    
    // 标准化查询向量
    const queryMagnitude = Math.sqrt(queryVector.reduce((sum, val) => sum + val * val, 0));
    const normalizedQueryVector = queryVector.map(val => val / queryMagnitude);
    
    console.log(`   查询向量维度: ${normalizedQueryVector.length}`);
    console.log(`   查询向量模长: ${Math.sqrt(normalizedQueryVector.reduce((sum, val) => sum + val * val, 0)).toFixed(6)}`);
    
    // 执行搜索
    const searchResults = await client.search('knowledge-base', {
      vector: normalizedQueryVector,
      limit: 5,
      with_payload: true
    });
    
    console.log(`   搜索结果数量: ${searchResults.length}`);
    
    if (searchResults.length > 0) {
      console.log('✅ 搜索成功！');
      searchResults.forEach((result, index) => {
        console.log(`   结果 ${index + 1}:`);
        console.log(`     ID: ${result.id}`);
        console.log(`     相似度: ${result.score.toFixed(6)}`);
        console.log(`     原始ID: ${result.payload?.original_id || 'N/A'}`);
        console.log(`     内容: ${result.payload?.content || 'N/A'}`);
      });
    } else {
      console.log('❌ 搜索失败，没有找到结果');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('   HTTP状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

async function testWithFilter() {
  console.log('\n🔍 测试带过滤条件的搜索...');
  
  const client = new QdrantClient({
    url: 'http://localhost:6333',
  });

  try {
    const queryVector = new Array(1024).fill(0.001); // 简单的查询向量
    
    // 测试不同的过滤条件（使用正确的Qdrant格式和实际数据）
    const filters = [
      undefined, // 无过滤
      { must: [{ key: 'domain', match: { value: 'academic' } }] }, // 域过滤（实际存在的值）
      { must: [{ key: 'type', match: { value: 'case' } }] }, // 类型过滤（实际存在的值）
      { must: [{ key: 'domain', match: { value: 'nonexistent' } }] } // 不存在的域
    ];
    
    for (let i = 0; i < filters.length; i++) {
      const filter = filters[i];
      console.log(`\n   测试过滤条件 ${i + 1}: ${filter ? JSON.stringify(filter) : '无过滤'}`);
      
      try {
        const searchParams = {
          vector: queryVector,
          limit: 5,
          with_payload: true
        };
        
        if (filter) {
          searchParams.filter = filter;
        }
        
        const results = await client.search('knowledge-base', searchParams);
        console.log(`     结果数量: ${results.length}`);
        
        if (results.length > 0) {
          console.log(`     首个结果相似度: ${results[0].score.toFixed(6)}`);
        }
        
      } catch (error) {
        console.log(`     ❌ 搜索失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 过滤测试失败:', error.message);
  }
}

async function main() {
  console.log('🚀 开始Qdrant向量搜索测试\n');
  
  try {
    await testQdrantSearch();
    await testWithFilter();
    
    console.log('\n🏁 测试完成');
  } catch (error) {
    console.error('💥 测试异常:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testQdrantSearch }; 