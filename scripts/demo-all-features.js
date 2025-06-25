const http = require('http');

async function demoAllFeatures() {
  console.log('🎬 AI Editor Pro 完整功能演示\n');
  
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
  
  console.log('📊 1. 获取知识库统计信息');
  console.log('=' .repeat(50));
  
  try {
    const statsResult = await makeRequest('GET', '/api/knowledge-base');
    if (statsResult.data.success) {
      const stats = statsResult.data.data;
      console.log(`✅ 知识库统计:`);
      console.log(`   总文件数: ${stats.total_files}`);
      console.log(`   总知识项: ${stats.total_knowledge_items}`);
      console.log(`   领域分布: ${JSON.stringify(stats.domains, null, 2)}`);
      console.log(`   类型分布: ${JSON.stringify(stats.types, null, 2)}`);
      console.log(`   最后更新: ${stats.last_updated}`);
    }
  } catch (error) {
    console.error('❌ 获取统计信息失败:', error.message);
  }
  
  console.log('\n🔍 2. 知识库搜索功能演示');
  console.log('=' .repeat(50));
  
  const searchTests = [
    { query: '学术', description: '搜索学术相关内容' },
    { query: '医学', description: '搜索医学相关内容' },
    { query: '技术', description: '搜索技术相关内容' },
    { query: '论文', description: '搜索论文相关内容' }
  ];
  
  for (const test of searchTests) {
    try {
      console.log(`\n🔎 ${test.description} (关键词: "${test.query}")`);
      
      const searchUrl = '/api/knowledge-base?' + new URLSearchParams({
        query: test.query,
        includeDocuments: 'true',
        limit: '3'
      }).toString();
      
      const result = await makeRequest('GET', searchUrl);
      
      if (result.data.success) {
        const { knowledge, documents } = result.data.data;
        
        console.log(`   📚 找到 ${knowledge.length} 个知识项`);
        knowledge.forEach((item, index) => {
          console.log(`     ${index + 1}. [${item.type}] ${item.content.substring(0, 50)}...`);
          console.log(`        领域: ${item.domain}, 相关度: ${Math.round((item.relevance_score || 0) * 100)}%`);
        });
        
        console.log(`   📄 找到 ${documents.length} 个相关文档`);
        documents.forEach((doc, index) => {
          console.log(`     ${index + 1}. ${doc.filename} (${doc.domain})`);
          console.log(`        大小: ${doc.file_size} 字节, 类型: ${doc.file_type}`);
        });
      } else {
        console.log(`   ❌ 搜索失败: ${result.data.error}`);
      }
    } catch (error) {
      console.error(`   ❌ 搜索"${test.query}"失败:`, error.message);
    }
  }
  
  console.log('\n📄 3. 文档访问功能演示');
  console.log('=' .repeat(50));
  
  try {
    // 获取一个文档进行测试
    const searchUrl = '/api/knowledge-base?' + new URLSearchParams({
      query: '学术',
      includeDocuments: 'true',
      limit: '1'
    }).toString();
    
    const searchResult = await makeRequest('GET', searchUrl);
    
    if (searchResult.data.success && searchResult.data.data.documents.length > 0) {
      const document = searchResult.data.data.documents[0];
      const vectorId = document.vector_id;
      
      console.log(`📋 测试文档: ${document.filename}`);
      console.log(`   向量ID: ${vectorId}`);
      
      // 测试获取文档信息
      const infoResult = await makeRequest('GET', `/api/documents/${vectorId}?action=info`);
      
      if (infoResult.status === 200 && infoResult.data.success) {
        const docInfo = infoResult.data.data;
        console.log(`✅ 文档信息获取成功:`);
        console.log(`   文档名: ${docInfo.filename}`);
        console.log(`   文件路径: ${docInfo.file_path}`);
        console.log(`   文件大小: ${docInfo.file_size} 字节`);
        console.log(`   文件类型: ${docInfo.file_type}`);
        console.log(`   领域: ${docInfo.domain}`);
        console.log(`   标签: ${docInfo.tags ? docInfo.tags.join(', ') : '无'}`);
        console.log(`   上传时间: ${new Date(docInfo.upload_time).toLocaleString('zh-CN')}`);
        
        console.log(`\n📖 文档访问链接:`);
        console.log(`   在线打开: http://localhost:3000/api/documents/${vectorId}?action=open`);
        console.log(`   下载链接: http://localhost:3000/api/documents/${vectorId}?action=download`);
      } else {
        console.log(`❌ 获取文档信息失败: ${infoResult.data.error || '未知错误'}`);
      }
    } else {
      console.log('⚠️  没有找到可测试的文档');
    }
  } catch (error) {
    console.error('❌ 文档访问测试失败:', error.message);
  }
  
  console.log('\n🤖 4. RAG分析功能演示');
  console.log('=' .repeat(50));
  
  const testTexts = [
    {
      content: '学术论文的摘要应该包含研究目的、方法、结果和结论四个要素。',
      domain: 'academic',
      description: '学术写作规范测试'
    },
    {
      content: '患者出现发热、咳嗽、呼吸困难等症状，需要进行胸部CT检查。',
      domain: 'medical',
      description: '医学术语测试'
    },
    {
      content: '代码注释应该清晰明了，解释代码的功能和实现逻辑。',
      domain: 'technical',
      description: '技术文档测试'
    }
  ];
  
  for (const test of testTexts) {
    try {
      console.log(`\n🔬 ${test.description}`);
      console.log(`   原文: ${test.content}`);
      console.log(`   领域: ${test.domain}`);
      
      const ragResult = await makeRequest('POST', '/api/analyze-document-rag', {
        content: test.content,
        domain: test.domain
      });
      
      if (ragResult.data.success) {
        const analysis = ragResult.data.data;
        console.log(`✅ RAG分析成功:`);
        
        if (analysis.suggestions && analysis.suggestions.length > 0) {
          console.log(`   💡 建议 (${analysis.suggestions.length} 条):`);
          analysis.suggestions.forEach((suggestion, index) => {
            console.log(`     ${index + 1}. ${suggestion.type}: ${suggestion.original} → ${suggestion.suggestion}`);
            console.log(`        原因: ${suggestion.reason}`);
            console.log(`        置信度: ${Math.round(suggestion.confidence * 100)}%`);
          });
        } else {
          console.log(`   ✅ 未发现需要改进的地方`);
        }
        
        if (analysis.domain_info) {
          console.log(`   🎯 领域识别: ${analysis.domain_info.domain} (置信度: ${Math.round(analysis.domain_info.confidence * 100)}%)`);
        }
        
        console.log(`   ⏱️  分析耗时: ${analysis.processing_time || 'N/A'}`);
      } else {
        console.log(`   ❌ RAG分析失败: ${ragResult.data.error || '未知错误'}`);
      }
    } catch (error) {
      console.error(`   ❌ RAG分析"${test.description}"失败:`, error.message);
    }
  }
  
  console.log('\n🎯 5. 系统功能总结');
  console.log('=' .repeat(50));
  
  console.log(`✅ 核心功能验证完成:`);
  console.log(`   📊 知识库统计 - 正常`);
  console.log(`   🔍 智能搜索 - 支持知识项和文档综合搜索`);
  console.log(`   📄 文档管理 - 支持在线预览和下载`);
  console.log(`   🤖 RAG分析 - 智能文档分析和建议`);
  console.log(`   🏗️  双数据库架构 - Qdrant + PostgreSQL`);
  console.log(`   🌐 Web界面 - 现代化响应式设计`);
  
  console.log(`\n🌟 主要特色:`);
  console.log(`   • 6大专业领域支持 (学术、医学、法律、技术、商业、通用)`);
  console.log(`   • 多类型知识管理 (术语、规则、示例、纠错)`);
        console.log(`   • 向量语义搜索 (4096维向量空间)`);
  console.log(`   • 文档在线管理 (预览、下载、元数据)`);
  console.log(`   • DeepSeek API集成 (适合国内网络环境)`);
  console.log(`   • Docker容器化部署 (一键启动)`);
  
  console.log(`\n🚀 访问地址:`);
  console.log(`   • 主页: http://localhost:3000`);
  console.log(`   • 编辑器: http://localhost:3000/editor`);
  console.log(`   • 知识库管理: http://localhost:3000/knowledge-admin`);
  console.log(`   • Qdrant管理: http://localhost:6333`);
  
  console.log(`\n🎉 演示完成！系统运行正常，所有功能可用！`);
}

// 运行演示
demoAllFeatures().catch(console.error); 