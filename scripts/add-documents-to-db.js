const http = require('http');
const fs = require('fs');
const path = require('path');

async function addDocumentsToDatabase() {
  console.log('📄 将示例文档添加到数据库...\n');
  
  const documentsDir = path.join(__dirname, '../public/sample-documents');
  
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
  
  // 示例文档信息
  const documents = [
    {
      filename: '学术论文写作规范.md',
      domain: 'academic',
      tags: ['学术', '论文', '写作', '规范']
    },
    {
      filename: '医学术语标准化指南.txt',
      domain: 'medical',
      tags: ['医学', '术语', '标准化', '指南']
    },
    {
      filename: '技术文档编写最佳实践.md',
      domain: 'technical',
      tags: ['技术', '文档', '编写', '最佳实践']
    }
  ];
  
  for (const doc of documents) {
    try {
      const filePath = path.join(documentsDir, doc.filename);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  文件不存在: ${filePath}`);
        continue;
      }
      
      // 读取文件内容
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      const fileExtension = path.extname(doc.filename).slice(1) || 'txt';
      
      // 通过知识库API添加文档相关的知识项
      const knowledgeData = {
        action: 'add',
        knowledge: {
          id: `doc_knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'terminology',
          domain: doc.domain,
          content: `文档: ${doc.filename} - ${content.substring(0, 200)}...`,
          context: `来源文档: ${doc.filename}`,
          source: `文档: ${doc.filename}`,
          confidence: 0.8,
          tags: [...doc.tags, '文档', doc.filename]
        }
      };
      
      console.log(`正在添加文档知识项: ${doc.filename}`);
      const result = await makeRequest('POST', '/api/knowledge-base', knowledgeData);
      
      if (result.status === 200 && result.data.success) {
        console.log(`✅ 成功添加: ${doc.filename}`);
        console.log(`   文件大小: ${stats.size} 字节`);
        console.log(`   领域: ${doc.domain}`);
        console.log(`   标签: ${doc.tags.join(', ')}`);
      } else {
        console.log(`❌ 添加失败: ${doc.filename}`);
        console.log(`   错误: ${result.data.error || '未知错误'}`);
      }
      console.log('---');
      
    } catch (error) {
      console.error(`处理文档 ${doc.filename} 时出错:`, error.message);
    }
  }
  
  console.log('\n🎉 文档添加完成!');
  console.log('💡 现在您可以在搜索界面测试文档搜索功能了');
}

// 运行脚本
addDocumentsToDatabase().catch(console.error); 