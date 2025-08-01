const http = require('http');

console.log('🧪 测试AI分析结果显示');

// 测试AI分析API
function testAIAnalysisAPI() {
  return new Promise((resolve, reject) => {
    const testContent = "这是一个测试文档，包含一些错误。";
    const requestBody = JSON.stringify({
      content: testContent,
      ownerId: 'default_user'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analyze-document-rag',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📡 API响应状态: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            console.log('✅ API调用成功');
            
            // 检查返回数据结构
            const hasErrors = Array.isArray(result.errors);
            const hasDomainInfo = result.domain_info && typeof result.domain_info === 'object';
            const hasKnowledgeUsed = Array.isArray(result.knowledge_used);
            const hasKnowledgeSources = result.knowledge_sources && typeof result.knowledge_sources === 'object';
            
            console.log(`🔍 数据结构检查:`);
            console.log(`   - errors数组: ${hasErrors ? '✅' : '❌'} (${result.errors?.length || 0}个错误)`);
            console.log(`   - domain_info: ${hasDomainInfo ? '✅' : '❌'}`);
            console.log(`   - knowledge_used: ${hasKnowledgeUsed ? '✅' : '❌'} (${result.knowledge_used?.length || 0}条知识)`);
            console.log(`   - knowledge_sources: ${hasKnowledgeSources ? '✅' : '❌'}`);
            
            if (hasErrors && result.errors.length > 0) {
              console.log(`📝 错误详情:`);
              result.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error.type} - "${error.original}" → "${error.suggestion}"`);
                console.log(`      位置: ${error.position.start}-${error.position.end}`);
                console.log(`      分类: ${error.category}`);
              });
            }
            
            resolve({
              success: true,
              statusCode: res.statusCode,
              hasErrors,
              errorCount: result.errors?.length || 0,
              hasDomainInfo,
              hasKnowledgeUsed,
              hasKnowledgeSources,
              result
            });
          } catch (parseError) {
            console.log(`❌ JSON解析失败: ${parseError.message}`);
            resolve({
              success: false,
              statusCode: res.statusCode,
              error: 'JSON解析失败',
              data: data.substring(0, 200) + '...'
            });
          }
        } else {
          console.log(`❌ API调用失败: ${res.statusCode}`);
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`,
            data: data.substring(0, 200) + '...'
          });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ 请求错误: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('❌ 请求超时');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(requestBody);
    req.end();
  });
}

// 测试编辑器页面
function testEditorPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/editor',
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 编辑器页面状态: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ 编辑器页面访问成功');
          
          // 检查关键功能
          const hasRAGEnhancedEditor = data.includes('RAGEnhancedEditor') || data.includes('RAG增强分析');
          const hasQingCiStyleEditor = data.includes('QingCiStyleEditor');
          const hasErrorDisplay = data.includes('error-underline') || data.includes('warning-underline');
          const hasAnalysisButton = data.includes('AI分析') || data.includes('analyzeDocumentWithRAG');
          
          console.log(`🔍 页面功能检查:`);
          console.log(`   - RAG增强编辑器: ${hasRAGEnhancedEditor ? '✅' : '❌'}`);
          console.log(`   - 清辞风格编辑器: ${hasQingCiStyleEditor ? '✅' : '❌'}`);
          console.log(`   - 错误显示样式: ${hasErrorDisplay ? '✅' : '❌'}`);
          console.log(`   - AI分析按钮: ${hasAnalysisButton ? '✅' : '❌'}`);
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            hasRAGEnhancedEditor,
            hasQingCiStyleEditor,
            hasErrorDisplay,
            hasAnalysisButton
          });
        } else {
          console.log(`❌ 页面访问失败: ${res.statusCode}`);
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`
          });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ 请求错误: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('❌ 请求超时');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 主测试函数
async function runTests() {
  try {
    console.log('🚀 开始测试AI分析结果显示...');
    console.log('');
    
    // 等待服务器启动
    console.log('⏳ 等待开发服务器启动...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 测试API
    console.log('📡 测试AI分析API...');
    const apiResult = await testAIAnalysisAPI();
    
    console.log('');
    
    // 测试编辑器页面
    console.log('📄 测试编辑器页面...');
    const pageResult = await testEditorPage();
    
    console.log('');
    console.log('📊 测试结果汇总:');
    console.log(`   API测试: ${apiResult.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`   页面测试: ${pageResult.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (apiResult.success) {
      console.log(`   API错误数量: ${apiResult.errorCount}`);
      console.log(`   数据结构完整性: ${apiResult.hasErrors && apiResult.hasDomainInfo ? '✅' : '❌'}`);
    }
    
    if (pageResult.success) {
      console.log(`   页面功能完整性: ${pageResult.hasRAGEnhancedEditor && pageResult.hasErrorDisplay ? '✅' : '❌'}`);
    }
    
    const allPassed = apiResult.success && pageResult.success && 
                     apiResult.hasErrors && apiResult.errorCount > 0 &&
                     pageResult.hasRAGEnhancedEditor && pageResult.hasErrorDisplay;
    
    console.log('');
    console.log(`🎯 总体状态: ${allPassed ? '✅ 全部通过' : '⚠️ 存在问题'}`);
    
    if (allPassed) {
      console.log('');
      console.log('🎉 测试完成！AI分析结果显示功能正常');
      console.log('');
      console.log('📝 功能说明:');
      console.log('   1. ✅ AI分析API正常工作');
      console.log('   2. ✅ 返回正确的数据结构');
      console.log('   3. ✅ 编辑器页面正常加载');
      console.log('   4. ✅ 错误显示功能可用');
      console.log('');
      console.log('🔧 测试方法:');
      console.log('   1. 访问 http://localhost:3000/editor');
      console.log('   2. 输入或粘贴文档内容');
      console.log('   3. 等待AI分析完成');
      console.log('   4. 观察错误文字的彩色下划线');
      console.log('   5. 鼠标悬停查看弹窗');
    } else {
      console.log('');
      console.log('⚠️ 存在问题，需要进一步检查:');
      if (!apiResult.success) {
        console.log('   - AI分析API调用失败');
      }
      if (!apiResult.hasErrors || apiResult.errorCount === 0) {
        console.log('   - API未返回错误数据');
      }
      if (!pageResult.success) {
        console.log('   - 编辑器页面访问失败');
      }
      if (!pageResult.hasRAGEnhancedEditor) {
        console.log('   - RAG增强编辑器组件缺失');
      }
      if (!pageResult.hasErrorDisplay) {
        console.log('   - 错误显示功能缺失');
      }
    }
    
  } catch (error) {
    console.log(`❌ 测试过程中出现错误: ${error.message}`);
  }
}

// 运行测试
runTests(); 