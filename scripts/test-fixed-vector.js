const { QdrantClient } = require('@qdrant/js-client-rest');

async function testFixedVector() {
  console.log('🧪 测试修复后的向量操作...\n');
  
  try {
    const client = new QdrantClient({ url: 'http://localhost:6333' });
    
    // 1. 创建测试集合
    console.log('1. 创建测试集合...');
    await client.createCollection('test-fixed', {
      vectors: { size: 1024, distance: 'Cosine' }
    });
    console.log('✅ 集合创建成功');
    
    // 2. 测试添加向量点
    console.log('\n2. 测试添加向量点...');
    const testVector = new Array(1024).fill(0).map(() => Math.random());
    
    await client.upsert('test-fixed', {
      points: [{
        id: 1, // 使用数字 ID
        vector: testVector,
        payload: {
          original_id: 'test_point_1',
          type: 'test',
          content: '测试内容',
          tags: ['test', 'vector'],
          confidence: 0.9
        }
      }]
    });
    console.log('✅ 向量点添加成功');
    
    // 3. 测试搜索向量
    console.log('\n3. 测试搜索向量...');
    const searchResult = await client.search('test-fixed', {
      vector: testVector,
      limit: 5,
      with_payload: true
    });
    
    console.log('✅ 搜索成功');
    console.log('搜索结果数量:', searchResult.length);
    if (searchResult.length > 0) {
      console.log('第一个结果:', {
        id: searchResult[0].id,
        score: searchResult[0].score,
        original_id: searchResult[0].payload?.original_id,
        type: searchResult[0].payload?.type
      });
    }
    
    // 4. 测试复杂 payload
    console.log('\n4. 测试复杂 payload...');
    const complexVector = new Array(1024).fill(0.5);
    await client.upsert('test-fixed', {
      points: [{
        id: 2,
        vector: complexVector,
        payload: {
          original_id: 'complex_test',
          type: 'complex',
          nested: {
            level1: {
              level2: 'deep_value'
            }
          },
          array: [1, 2, 3, 'string'],
          boolean: true,
          number: 42,
          null_value: null, // 这个会被过滤掉
          undefined_value: undefined // 这个也会被过滤掉
        }
      }]
    });
    console.log('✅ 复杂 payload 添加成功');
    
    // 5. 检查集合信息
    console.log('\n5. 检查集合信息...');
    const info = await client.getCollection('test-fixed');
    console.log('集合信息:', {
      points_count: info.points_count,
      vectors_count: info.vectors_count,
      status: info.status
    });
    
    // 6. 清理测试集合
    console.log('\n6. 清理测试集合...');
    await client.deleteCollection('test-fixed');
    console.log('✅ 测试集合清理成功');
    
    console.log('\n🎉 所有向量操作测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    if (error.data) {
      console.log('错误详情:', JSON.stringify(error.data, null, 2));
    }
  }
}

testFixedVector(); 