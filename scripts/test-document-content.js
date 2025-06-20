const http = require('http');

async function testDocumentContent() {
  console.log('📄 测试文档内容显示...\n');
  
  // HTTP请求帮助函数
  function makeRequest(method, url) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: url,
        method: method,
      };
      
      const req = http.request(options, (res) => {
        let responseData = '';
        res.setEncoding('utf8'); // 确保正确处理UTF-8编码
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          resolve({ 
            status: res.statusCode, 
            data: responseData,
            headers: res.headers
          });
        });
      });
      
      req.on('error', reject);
      req.end();
    });
  }
  
  const testCases = [
    {
      name: '学术论文写作规范.md',
      vectorId: 'vector_doc_1750405341756_z6bl8tw0h',
      expectedContent: '# 学术论文写作规范'
    },
    {
      name: '医学术语标准化指南.txt',
      vectorId: 'vector_doc_1750405341774_4rne59x41', 
      expectedContent: '医学术语标准化指南'
    },
    {
      name: '技术文档编写最佳实践.md',
      vectorId: 'vector_doc_1750405341776_9oz6zq03r',
      expectedContent: '# 技术文档编写最佳实践'
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`🔍 测试文档: ${testCase.name}`);
      
      const url = `/api/documents/${testCase.vectorId}?action=open`;
      const result = await makeRequest('GET', url);
      
      if (result.status === 200) {
        console.log(`✅ HTTP状态: ${result.status}`);
        console.log(`📋 Content-Type: ${result.headers['content-type']}`);
        console.log(`📏 Content-Length: ${result.headers['content-length']}`);
        
        // 检查内容是否包含预期的文本
        if (result.data.includes(testCase.expectedContent)) {
          console.log(`✅ 内容验证通过: 包含"${testCase.expectedContent}"`);
        } else {
          console.log(`❌ 内容验证失败: 未找到"${testCase.expectedContent}"`);
        }
        
        // 显示文档前几行内容
        const lines = result.data.split('\n').slice(0, 3);
        console.log(`📖 文档前3行:`);
        lines.forEach((line, index) => {
          console.log(`   ${index + 1}. ${line}`);
        });
        
        // 检查是否有乱码（通常乱码会包含�字符）
        if (result.data.includes('�')) {
          console.log(`⚠️  警告: 检测到可能的乱码字符`);
        } else {
          console.log(`✅ 字符编码正常，无乱码`);
        }
        
      } else {
        console.log(`❌ HTTP错误: ${result.status}`);
        console.log(`错误内容: ${result.data}`);
      }
      
      console.log('---');
      
    } catch (error) {
      console.error(`❌ 测试文档 ${testCase.name} 失败:`, error.message);
    }
  }
  
  console.log('\n🎯 测试总结:');
  console.log('✅ 所有文档都应该能正常显示中文内容');
  console.log('✅ Content-Type应该包含charset=utf-8');
  console.log('✅ 不应该有乱码字符(�)');
  console.log('\n💡 您可以在浏览器中打开以下链接测试:');
  testCases.forEach(testCase => {
    console.log(`   http://localhost:3000/api/documents/${testCase.vectorId}?action=open`);
  });
}

// 运行测试
testDocumentContent().catch(console.error); 