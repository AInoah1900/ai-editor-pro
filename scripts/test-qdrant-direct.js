const { QdrantClient } = require('@qdrant/js-client-rest');

async function testQdrantDirect() {
  try {
    console.log('直接测试 Qdrant 客户端...');
    
    const client = new QdrantClient({
      url: 'http://localhost:6333',
    });

    console.log('1. 测试获取集合列表...');
    try {
      const collections = await client.getCollections();
      console.log('✅ 获取集合列表成功:', collections);
    } catch (error) {
      console.log('❌ 获取集合列表失败:', error.message);
    }

    console.log('\n2. 测试创建集合...');
    try {
      await client.createCollection('test-collection', {
        vectors: {
          size: 4096,
          distance: 'Cosine',
        },
      });
      console.log('✅ 创建集合成功');
    } catch (error) {
      console.log('❌ 创建集合失败:', error.message);
    }

    console.log('\n3. 测试获取集合信息...');
    try {
      const info = await client.getCollection('test-collection');
      console.log('✅ 获取集合信息成功:', info);
    } catch (error) {
      console.log('❌ 获取集合信息失败:', error.message);
    }

    console.log('\n4. 测试添加向量点...');
    try {
      const testVector = new Array(4096).fill(0).map(() => Math.random());
      await client.upsert('test-collection', {
        points: [
          {
            id: 'test_point_1',
            vector: testVector,
            payload: { test: 'data' },
          },
        ],
      });
      console.log('✅ 添加向量点成功');
    } catch (error) {
      console.log('❌ 添加向量点失败:', error.message);
    }

    console.log('\n5. 测试搜索向量...');
    try {
      const queryVector = new Array(4096).fill(0).map(() => Math.random());
      const searchResult = await client.search('test-collection', {
        vector: queryVector,
        limit: 5,
        with_payload: true,
      });
      console.log('✅ 搜索向量成功:', searchResult);
    } catch (error) {
      console.log('❌ 搜索向量失败:', error.message);
    }

    console.log('\n6. 清理测试集合...');
    try {
      await client.deleteCollection('test-collection');
      console.log('✅ 删除测试集合成功');
    } catch (error) {
      console.log('❌ 删除测试集合失败:', error.message);
    }

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testQdrantDirect(); 