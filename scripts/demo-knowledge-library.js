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

async function demoKnowledgeLibrary() {
  console.log('🎯 AI Editor Pro - 知识库功能完整演示\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. 展示知识库统计信息
    console.log('\n📊 知识库统计信息');
    console.log('-'.repeat(30));
    const statsResponse = await makeRequest('GET', '/api/knowledge-base?action=getLibraryStats');
    
    if (statsResponse.status === 200 && statsResponse.data.success) {
      const stats = statsResponse.data.stats;
      console.log(`总计文档数量: ${stats.total_private + stats.total_shared} 个`);
      console.log(`├─ 专属知识库: ${stats.total_private} 个文档`);
      console.log(`└─ 共享知识库: ${stats.total_shared} 个文档`);
      
      console.log('\n领域分布:');
      console.log('专属知识库:', Object.entries(stats.private_by_domain).map(([domain, count]) => `${domain}(${count})`).join(', ') || '无');
      console.log('共享知识库:', Object.entries(stats.shared_by_domain).map(([domain, count]) => `${domain}(${count})`).join(', ') || '无');
    }
    
    // 2. 展示专属知识库
    console.log('\n📚 专属知识库文档列表');
    console.log('-'.repeat(30));
    const privateResponse = await makeRequest('GET', '/api/knowledge-base?action=getLibraryFiles&libraryType=private&ownerId=default_user');
    
    if (privateResponse.status === 200 && privateResponse.data.success) {
      if (privateResponse.data.files.length > 0) {
        privateResponse.data.files.forEach((file, index) => {
          console.log(`${index + 1}. ${file.filename}`);
          console.log(`   ├─ 大小: ${formatFileSize(file.file_size)}`);
          console.log(`   ├─ 类型: ${file.file_type.toUpperCase()}`);
          console.log(`   ├─ 领域: ${getDomainName(file.domain)}`);
          console.log(`   ├─ 标签: ${file.tags ? file.tags.join(', ') : '无'}`);
          console.log(`   └─ 上传时间: ${formatDate(file.upload_time)}`);
        });
      } else {
        console.log('暂无专属文档');
      }
    }
    
    // 3. 展示共享知识库
    console.log('\n🌐 共享知识库文档列表');
    console.log('-'.repeat(30));
    const sharedResponse = await makeRequest('GET', '/api/knowledge-base?action=getLibraryFiles&libraryType=shared');
    
    if (sharedResponse.status === 200 && sharedResponse.data.success) {
      if (sharedResponse.data.files.length > 0) {
        sharedResponse.data.files.forEach((file, index) => {
          console.log(`${index + 1}. ${file.filename}`);
          console.log(`   ├─ 大小: ${formatFileSize(file.file_size)}`);
          console.log(`   ├─ 类型: ${file.file_type.toUpperCase()}`);
          console.log(`   ├─ 领域: ${getDomainName(file.domain)}`);
          console.log(`   ├─ 标签: ${file.tags ? file.tags.join(', ') : '无'}`);
          console.log(`   └─ 上传时间: ${formatDate(file.upload_time)}`);
        });
      } else {
        console.log('暂无共享文档');
      }
    }
    
    // 4. 演示文档访问功能
    console.log('\n📄 文档访问功能演示');
    console.log('-'.repeat(30));
    
    // 选择一个文档进行演示
    let testDoc = null;
    if (privateResponse.data.success && privateResponse.data.files.length > 0) {
      testDoc = privateResponse.data.files[0];
      console.log(`选择文档: ${testDoc.filename} (专属知识库)`);
    } else if (sharedResponse.data.success && sharedResponse.data.files.length > 0) {
      testDoc = sharedResponse.data.files[0];
      console.log(`选择文档: ${testDoc.filename} (共享知识库)`);
    }
    
    if (testDoc) {
      // 获取文档详细信息
      const infoResponse = await makeRequest('GET', `/api/documents/${testDoc.vector_id}?action=info`);
      if (infoResponse.status === 200 && infoResponse.data.success) {
        const fileInfo = infoResponse.data.file;
        console.log('✅ 文档信息获取成功:');
        console.log(`   ├─ 文件名: ${fileInfo.filename}`);
        console.log(`   ├─ 文件路径: ${fileInfo.file_path}`);
        console.log(`   ├─ 文件大小: ${formatFileSize(fileInfo.file_size)}`);
        console.log(`   ├─ 文件类型: ${fileInfo.file_type.toUpperCase()}`);
        console.log(`   ├─ 所有权类型: ${fileInfo.ownership_type === 'private' ? '专属' : '共享'}`);
        console.log(`   ├─ 领域: ${getDomainName(fileInfo.domain)}`);
        console.log(`   ├─ 标签: ${fileInfo.tags ? fileInfo.tags.join(', ') : '无'}`);
        console.log(`   ├─ 内容哈希: ${fileInfo.content_hash}`);
        console.log(`   ├─ 向量ID: ${fileInfo.vector_id}`);
        console.log(`   ├─ 创建时间: ${formatDate(fileInfo.created_at)}`);
        console.log(`   └─ 更新时间: ${formatDate(fileInfo.updated_at)}`);
        
        // 演示文档打开功能
        console.log('\n📖 文档内容预览:');
        console.log(`   在线打开URL: http://localhost:3000/api/documents/${testDoc.vector_id}?action=open`);
        console.log(`   下载URL: http://localhost:3000/api/documents/${testDoc.vector_id}?action=download`);
      }
    }
    
    // 5. 搜索功能演示
    console.log('\n🔍 搜索功能演示');
    console.log('-'.repeat(30));
    
    // 搜索知识项
    const searchResponse = await makeRequest('GET', '/api/knowledge-base?query=%E5%AD%A6%E6%9C%AF&domain=academic&limit=3');
    if (searchResponse.status === 200 && searchResponse.data.success) {
      console.log(`✅ 搜索结果: 找到 ${searchResponse.data.knowledge_items.length} 个知识项`);
      searchResponse.data.knowledge_items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.content.substring(0, 50)}...`);
        console.log(`      ├─ 类型: ${item.type}`);
        console.log(`      ├─ 领域: ${getDomainName(item.domain)}`);
        console.log(`      └─ 置信度: ${(item.confidence * 100).toFixed(1)}%`);
      });
    }
    
    // 综合搜索演示
    const comprehensiveResponse = await makeRequest('GET', '/api/knowledge-base?query=%E5%86%99%E4%BD%9C&includeDocuments=true&limit=2');
    if (comprehensiveResponse.status === 200 && comprehensiveResponse.data.success) {
      console.log(`\n✅ 综合搜索结果:`);
      console.log(`   知识项: ${comprehensiveResponse.data.knowledge_items.length} 个`);
      console.log(`   相关文档: ${comprehensiveResponse.data.related_documents.length} 个`);
      
      if (comprehensiveResponse.data.related_documents.length > 0) {
        console.log('\n   相关文档:');
        comprehensiveResponse.data.related_documents.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.filename} (${getDomainName(doc.domain)})`);
        });
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 知识库功能演示完成！');
    console.log('\n💡 功能总结:');
    console.log('✅ 专属知识库 - 管理个人文档');
    console.log('✅ 共享知识库 - 访问团队文档');
    console.log('✅ 文档信息查询 - 获取详细元数据');
    console.log('✅ 在线文档预览 - 浏览器中打开文档');
    console.log('✅ 文档下载 - 下载原始文件');
    console.log('✅ 知识项搜索 - 智能内容检索');
    console.log('✅ 综合搜索 - 同时搜索知识项和文档');
    console.log('✅ 统计信息 - 知识库概览');
    
    console.log('\n🖥️  前端使用说明:');
    console.log('1. 点击侧边栏"知识库"菜单');
    console.log('2. 选择"专属知识库"或"共享知识库"子菜单');
    console.log('3. 查看文档列表，点击"打开文档"按钮预览');
    console.log('4. 使用"搜索知识库"功能进行内容检索');
    
  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
  }
}

// 辅助函数
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function getDomainName(domain) {
  const domainNames = {
    'academic': '学术',
    'medical': '医学',
    'legal': '法律',
    'technical': '技术',
    'business': '商业',
    'general': '通用'
  };
  return domainNames[domain] || domain || '未分类';
}

// 运行演示
demoKnowledgeLibrary().catch(console.error); 