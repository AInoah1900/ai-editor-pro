const { Api } = require('qdrant-client');

async function testQdrantAPI() {
  try {
    console.log('正在测试 Qdrant API...');
    
    const client = new Api({
      baseURL: 'http://localhost:6333',
    });

    console.log('客户端创建成功');
    console.log('客户端属性:', Object.getOwnPropertyNames(client));

    // 检查 collections 属性
    if (client.collections) {
      console.log('\n✅ 找到 collections 属性');
      console.log('collections 方法:', Object.getOwnPropertyNames(client.collections));
      
      // 测试获取集合列表
      try {
        const collections = await client.collections.getCollections();
        console.log('✅ getCollections 成功:', collections);
      } catch (error) {
        console.log('❌ getCollections 失败:', error.message);
      }
    }

    // 检查 points 属性
    if (client.points) {
      console.log('\n✅ 找到 points 属性');
      console.log('points 方法:', Object.getOwnPropertyNames(client.points));
    }

    // 检查其他可能的属性
    const possibleProperties = ['collections', 'points', 'aliases', 'snapshots', 'cluster'];
    
    for (const prop of possibleProperties) {
      if (client[prop]) {
        console.log(`\n✅ 找到属性: ${prop}`);
        console.log(`${prop} 方法:`, Object.getOwnPropertyNames(client[prop]));
      }
    }

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testQdrantAPI(); 