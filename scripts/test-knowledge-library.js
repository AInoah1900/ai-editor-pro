const http = require('http');

// HTTP请求帮助函数
function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (err) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testKnowledgeLibrary() {
  console.log('🧪 测试知识库功能...\n');
  
  try {
    // 1. 测试获取专属知识库文档
    console.log('📚 测试专属知识库...');
    const privateResponse = await makeRequest('GET', '/api/knowledge-base?action=getLibraryFiles&libraryType=private&ownerId=default_user');
    
    if (privateResponse.status === 200 && privateResponse.data.success) {
      console.log(`✅ 专属知识库获取成功: ${privateResponse.data.files.length} 个文档`);
      privateResponse.data.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.filename} (${file.domain || '未分类'}) - ${file.file_size} 字节`);
      });
    } else {
      console.log('❌ 专属知识库获取失败:', privateResponse.data);
    }
    
    console.log('');
    
    // 2. 测试获取共享知识库文档
    console.log('🌐 测试共享知识库...');
    const sharedResponse = await makeRequest('GET', '/api/knowledge-base?action=getLibraryFiles&libraryType=shared');
    
    if (sharedResponse.status === 200 && sharedResponse.data.success) {
      console.log(`✅ 共享知识库获取成功: ${sharedResponse.data.files.length} 个文档`);
      sharedResponse.data.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.filename} (${file.domain || '未分类'}) - ${file.file_size} 字节`);
      });
    } else {
      console.log('❌ 共享知识库获取失败:', sharedResponse.data);
    }
    
    console.log('');
    
    // 3. 测试获取知识库统计信息
    console.log('📊 测试知识库统计信息...');
    const statsResponse = await makeRequest('GET', '/api/knowledge-base?action=getLibraryStats');
    
    if (statsResponse.status === 200 && statsResponse.data.success) {
      console.log('✅ 知识库统计获取成功:');
      const stats = statsResponse.data.stats;
      console.log(`   专属知识库: ${stats.total_private} 个文档`);
      console.log(`   共享知识库: ${stats.total_shared} 个文档`);
      console.log('   专属知识库领域分布:', stats.private_by_domain);
      console.log('   共享知识库领域分布:', stats.shared_by_domain);
    } else {
      console.log('❌ 知识库统计获取失败:', statsResponse.data);
    }
    
    console.log('');
    
    // 4. 测试文档访问API
    console.log('📄 测试文档访问API...');
    
    // 获取一个文档ID进行测试
    if (privateResponse.data.success && privateResponse.data.files.length > 0) {
      const testDoc = privateResponse.data.files[0];
      console.log(`测试文档: ${testDoc.filename} (ID: ${testDoc.vector_id})`);
      
      // 测试获取文档信息
      const infoResponse = await makeRequest('GET', `/api/documents/${testDoc.vector_id}?action=info`);
      if (infoResponse.status === 200 && infoResponse.data.success) {
        console.log('✅ 文档信息获取成功');
        console.log(`   文件名: ${infoResponse.data.file.filename}`);
        console.log(`   文件大小: ${infoResponse.data.file.file_size} 字节`);
        console.log(`   所有权: ${infoResponse.data.file.ownership_type}`);
      } else {
        console.log('❌ 文档信息获取失败:', infoResponse.data);
      }
    }
    
    console.log('\n🎉 知识库功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

// 运行测试
testKnowledgeLibrary().catch(console.error); 