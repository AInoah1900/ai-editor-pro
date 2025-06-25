const { QdrantClient } = require('@qdrant/js-client-rest');

async function debugVectorError() {
  console.log('🔍 调试向量操作错误...\n');
  
  try {
    const client = new QdrantClient({ url: 'http://localhost:6333' });
    
    // 1. 检查现有集合
    console.log('1. 检查现有集合...');
    const collections = await client.getCollections();
    console.log('现有集合:', collections.collections.map(c => c.name));
    
    // 2. 创建测试集合
    console.log('\n2. 创建测试集合...');
    try {
      await client.createCollection('debug-test', {
        vectors: { size: 4096, distance: 'Cosine' }
      });
      console.log('✅ 集合创建成功');
    } catch (error) {
      console.log('❌ 集合创建失败:', error.message);
      if (error.data) {
        console.log('错误详情:', JSON.stringify(error.data, null, 2));
      }
    }
    
    // 3. 测试不同的向量数据
    console.log('\n3. 测试向量数据...');
    
    // 测试1: 基本向量
    try {
      const basicVector = new Array(4096).fill(0.1);
      await client.upsert('debug-test', {
        points: [{
          id: 'test1',
          vector: basicVector,
          payload: { type: 'test' }
        }]
      });
      console.log('✅ 基本向量添加成功');
    } catch (error) {
      console.log('❌ 基本向量失败:', error.message);
      if (error.data) {
        console.log('错误详情:', JSON.stringify(error.data, null, 2));
      }
    }
    
    // 测试2: 随机向量
    try {
      const randomVector = new Array(4096).fill(0).map(() => Math.random());
      await client.upsert('debug-test', {
        points: [{
          id: 'test2',
          vector: randomVector,
          payload: { type: 'random' }
        }]
      });
      console.log('✅ 随机向量添加成功');
    } catch (error) {
      console.log('❌ 随机向量失败:', error.message);
      if (error.data) {
        console.log('错误详情:', JSON.stringify(error.data, null, 2));
      }
    }
    
    // 测试3: 复杂 payload
    try {
      const complexVector = new Array(4096).fill(0.5);
      await client.upsert('debug-test', {
        points: [{
          id: 'test3',
          vector: complexVector,
          payload: {
            type: 'complex',
            nested: { value: 'test' },
            array: [1, 2, 3],
            boolean: true,
            number: 42
          }
        }]
      });
      console.log('✅ 复杂 payload 添加成功');
    } catch (error) {
      console.log('❌ 复杂 payload 失败:', error.message);
      if (error.data) {
        console.log('错误详情:', JSON.stringify(error.data, null, 2));
      }
    }
    
    // 测试4: 字符串 ID
    try {
      const stringVector = new Array(4096).fill(0.3);
      await client.upsert('debug-test', {
        points: [{
          id: 'string_id_test',
          vector: stringVector,
          payload: { type: 'string_id' }
        }]
      });
      console.log('✅ 字符串 ID 添加成功');
    } catch (error) {
      console.log('❌ 字符串 ID 失败:', error.message);
      if (error.data) {
        console.log('错误详情:', JSON.stringify(error.data, null, 2));
      }
    }
    
    // 测试5: 数字 ID
    try {
      const numberVector = new Array(4096).fill(0.7);
      await client.upsert('debug-test', {
        points: [{
          id: 12345,
          vector: numberVector,
          payload: { type: 'number_id' }
        }]
      });
      console.log('✅ 数字 ID 添加成功');
    } catch (error) {
      console.log('❌ 数字 ID 失败:', error.message);
      if (error.data) {
        console.log('错误详情:', JSON.stringify(error.data, null, 2));
      }
    }
    
    // 4. 检查集合信息
    console.log('\n4. 检查集合信息...');
    try {
      const info = await client.getCollection('debug-test');
      console.log('集合信息:', {
        points_count: info.points_count,
        vectors_count: info.vectors_count,
        status: info.status
      });
    } catch (error) {
      console.log('获取集合信息失败:', error.message);
    }
    
    // 5. 清理测试集合
    console.log('\n5. 清理测试集合...');
    try {
      await client.deleteCollection('debug-test');
      console.log('✅ 测试集合清理成功');
    } catch (error) {
      console.log('❌ 清理失败:', error.message);
    }
    
  } catch (error) {
    console.error('调试失败:', error);
  }
}

debugVectorError(); 