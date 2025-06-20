const http = require('http');

async function testDocumentSearch() {
  console.log('🔍 测试文档搜索功能...\n');
  
  // HTTP请求帮助函数
  function makeRequest(method, url, data) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: url,
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
  
  const testCases = [
    {
      name: '测试1: 搜索"学术"关键词（包含文档）',
      url: '/api/knowledge-base?' + new URLSearchParams({
        query: '学术',
        includeDocuments: 'true',
        limit: '5'
      }).toString()
    },
    {
      name: '测试2: 搜索"医学"关键词（包含文档）',
      url: '/api/knowledge-base?' + new URLSearchParams({
        query: '医学',
        includeDocuments: 'true',
        limit: '5'
      }).toString()
    },
    {
      name: '测试3: 搜索"技术"关键词（包含文档）',
      url: '/api/knowledge-base?' + new URLSearchParams({
        query: '技术',
        includeDocuments: 'true',
        limit: '5'
      }).toString()
    },
    {
      name: '测试4: 按领域过滤搜索（学术领域）',
      url: '/api/knowledge-base?' + new URLSearchParams({
        query: '论文',
        domain: 'academic',
        includeDocuments: 'true',
        limit: '5'
      }).toString()
    },
    {
      name: '测试5: 获取所有文档',
      url: '/api/knowledge-base?' + new URLSearchParams({
        query: '文档',
        includeDocuments: 'true',
        limit: '10'
      }).toString()
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\n${testCase.name}`);
      console.log(`请求URL: ${testCase.url}`);
      
      const result = await makeRequest('GET', testCase.url);
      
      if (result.status === 200 && result.data.success) {
        console.log('✅ 请求成功');
        
        if (result.data.data.knowledge && result.data.data.documents) {
          // 综合搜索结果
          console.log(`📚 找到 ${result.data.data.knowledge.length} 个知识项`);
          console.log(`📄 找到 ${result.data.data.documents.length} 个相关文档`);
          
          if (result.data.data.documents.length > 0) {
            console.log('文档列表:');
            result.data.data.documents.forEach((doc, index) => {
              console.log(`  ${index + 1}. ${doc.filename} (${doc.domain}) - ${doc.file_size} 字节`);
              console.log(`     向量ID: ${doc.vector_id}`);
            });
          }
        } else if (Array.isArray(result.data.data)) {
          // 只有知识项
          console.log(`📚 找到 ${result.data.data.length} 个知识项`);
        }
      } else {
        console.log('❌ 请求失败');
        console.log(`状态码: ${result.status}`);
        console.log(`错误: ${result.data.error || '未知错误'}`);
      }
      
    } catch (error) {
      console.error(`测试 "${testCase.name}" 失败:`, error.message);
    }
  }
  
  console.log('\n🎯 测试文档访问API...');
  
  // 测试文档访问
  try {
    // 先获取一个文档的向量ID
    const searchUrl = '/api/knowledge-base?' + new URLSearchParams({
      query: '学术',
      includeDocuments: 'true',
      limit: '1'
    }).toString();
    const searchResult = await makeRequest('GET', searchUrl);
    
    if (searchResult.data.success && searchResult.data.data.documents && searchResult.data.data.documents.length > 0) {
      const document = searchResult.data.data.documents[0];
      const vectorId = document.vector_id;
      
      console.log(`\n测试文档访问: ${document.filename}`);
      console.log(`向量ID: ${vectorId}`);
      
      // 测试获取文档信息
      const infoResult = await makeRequest('GET', `/api/documents/${vectorId}?action=info`);
      
      if (infoResult.status === 200 && infoResult.data.success) {
        console.log('✅ 文档信息获取成功');
        console.log(`文档名: ${infoResult.data.data.filename}`);
        console.log(`文件大小: ${infoResult.data.data.file_size} 字节`);
        console.log(`文件类型: ${infoResult.data.data.file_type}`);
        console.log(`领域: ${infoResult.data.data.domain}`);
      } else {
        console.log('❌ 文档信息获取失败');
        console.log(`错误: ${infoResult.data.error || '未知错误'}`);
      }
    } else {
      console.log('⚠️  没有找到可测试的文档');
    }
    
  } catch (error) {
    console.error('文档访问测试失败:', error.message);
  }
  
  console.log('\n🎉 测试完成！');
  console.log('💡 您现在可以在浏览器中访问 http://localhost:3000/editor 测试完整功能');
}

// 运行测试
testDocumentSearch().catch(console.error); 