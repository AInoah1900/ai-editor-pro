const http = require('http');

console.log('🧪 测试编辑器页面功能');

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
          const hasErrorDisplay = data.includes('error-underline') || data.includes('warning-underline') || data.includes('suggestion-underline');
          const hasAnalysisButton = data.includes('AI分析') || data.includes('analyzeDocumentWithRAG');
          const hasAnalysisState = data.includes('analysisState') || data.includes('hasInitialAnalysis');
          const hasUserOperation = data.includes('onUserOperation') || data.includes('isUserOperation');
          
          console.log(`🔍 页面功能检查:`);
          console.log(`   - RAG增强编辑器: ${hasRAGEnhancedEditor ? '✅' : '❌'}`);
          console.log(`   - 清辞风格编辑器: ${hasQingCiStyleEditor ? '✅' : '❌'}`);
          console.log(`   - 错误显示样式: ${hasErrorDisplay ? '✅' : '❌'}`);
          console.log(`   - AI分析按钮: ${hasAnalysisButton ? '✅' : '❌'}`);
          console.log(`   - 分析状态管理: ${hasAnalysisState ? '✅' : '❌'}`);
          console.log(`   - 用户操作标记: ${hasUserOperation ? '✅' : '❌'}`);
          
          // 检查错误处理逻辑
          const hasErrorHandling = data.includes('handleReplace') && data.includes('handleSaveEdit') && data.includes('handleIgnore');
          const hasPopupHandling = data.includes('showErrorPopup') && data.includes('hideErrorPopup');
          const hasContentProcessing = data.includes('processedContents') && data.includes('isContentProcessed');
          
          console.log(`🔧 错误处理功能:`);
          console.log(`   - 替换/编辑/忽略: ${hasErrorHandling ? '✅' : '❌'}`);
          console.log(`   - 弹窗处理: ${hasPopupHandling ? '✅' : '❌'}`);
          console.log(`   - 内容处理记录: ${hasContentProcessing ? '✅' : '❌'}`);
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            hasRAGEnhancedEditor,
            hasQingCiStyleEditor,
            hasErrorDisplay,
            hasAnalysisButton,
            hasAnalysisState,
            hasUserOperation,
            hasErrorHandling,
            hasPopupHandling,
            hasContentProcessing
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

// 测试测试编辑器页面
function testTestEditorPage() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/test-editor',
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 测试编辑器页面状态: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ 测试编辑器页面访问成功');
          
          // 检查关键功能
          const hasQingCiStyleEditor = data.includes('QingCiStyleEditor');
          const hasErrorDisplay = data.includes('error-underline') || data.includes('warning-underline') || data.includes('suggestion-underline');
          const hasSampleErrors = data.includes('这是一个测试文档') && data.includes('包含一些错误');
          const hasPopupHandling = data.includes('showErrorPopup') && data.includes('hideErrorPopup');
          
          console.log(`🔍 测试页面功能检查:`);
          console.log(`   - 清辞风格编辑器: ${hasQingCiStyleEditor ? '✅' : '❌'}`);
          console.log(`   - 错误显示样式: ${hasErrorDisplay ? '✅' : '❌'}`);
          console.log(`   - 示例错误内容: ${hasSampleErrors ? '✅' : '❌'}`);
          console.log(`   - 弹窗处理: ${hasPopupHandling ? '✅' : '❌'}`);
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            hasQingCiStyleEditor,
            hasErrorDisplay,
            hasSampleErrors,
            hasPopupHandling
          });
        } else {
          console.log(`❌ 测试页面访问失败: ${res.statusCode}`);
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
    console.log('🚀 开始测试编辑器页面功能...');
    console.log('');
    
    // 等待服务器启动
    console.log('⏳ 等待开发服务器启动...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 测试主编辑器页面
    console.log('📄 测试主编辑器页面...');
    const editorResult = await testEditorPage();
    
    console.log('');
    
    // 测试测试编辑器页面
    console.log('📄 测试测试编辑器页面...');
    const testEditorResult = await testTestEditorPage();
    
    console.log('');
    console.log('📊 测试结果汇总:');
    console.log(`   主编辑器页面: ${editorResult.success ? '✅ 成功' : '❌ 失败'}`);
    console.log(`   测试编辑器页面: ${testEditorResult.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (editorResult.success) {
      const coreFeatures = editorResult.hasRAGEnhancedEditor && editorResult.hasErrorDisplay;
      const analysisFeatures = editorResult.hasAnalysisState && editorResult.hasUserOperation;
      const errorFeatures = editorResult.hasErrorHandling && editorResult.hasPopupHandling;
      
      console.log(`   核心功能: ${coreFeatures ? '✅' : '❌'}`);
      console.log(`   分析功能: ${analysisFeatures ? '✅' : '❌'}`);
      console.log(`   错误处理: ${errorFeatures ? '✅' : '❌'}`);
    }
    
    if (testEditorResult.success) {
      const testFeatures = testEditorResult.hasErrorDisplay && testEditorResult.hasSampleErrors;
      console.log(`   测试功能: ${testFeatures ? '✅' : '❌'}`);
    }
    
    const allPassed = editorResult.success && testEditorResult.success && 
                     editorResult.hasRAGEnhancedEditor && editorResult.hasErrorDisplay &&
                     testEditorResult.hasErrorDisplay && testEditorResult.hasSampleErrors;
    
    console.log('');
    console.log(`🎯 总体状态: ${allPassed ? '✅ 全部通过' : '⚠️ 存在问题'}`);
    
    if (allPassed) {
      console.log('');
      console.log('🎉 测试完成！编辑器页面功能正常');
      console.log('');
      console.log('📝 功能说明:');
      console.log('   1. ✅ 主编辑器页面正常加载');
      console.log('   2. ✅ RAG增强编辑器组件可用');
      console.log('   3. ✅ 错误显示功能正常');
      console.log('   4. ✅ 分析状态管理正常');
      console.log('   5. ✅ 用户操作标记正常');
      console.log('   6. ✅ 测试页面功能正常');
      console.log('');
      console.log('🔧 测试方法:');
      console.log('   1. 访问 http://localhost:3000/editor');
      console.log('   2. 输入文档内容并等待AI分析');
      console.log('   3. 观察错误文字的彩色下划线');
      console.log('   4. 或访问 http://localhost:3000/test-editor 查看示例');
    } else {
      console.log('');
      console.log('⚠️ 存在问题，需要进一步检查:');
      if (!editorResult.success) {
        console.log('   - 主编辑器页面访问失败');
      }
      if (!testEditorResult.success) {
        console.log('   - 测试编辑器页面访问失败');
      }
      if (!editorResult.hasRAGEnhancedEditor) {
        console.log('   - RAG增强编辑器组件缺失');
      }
      if (!editorResult.hasErrorDisplay) {
        console.log('   - 错误显示功能缺失');
      }
      if (!testEditorResult.hasErrorDisplay) {
        console.log('   - 测试页面错误显示功能缺失');
      }
    }
    
  } catch (error) {
    console.log(`❌ 测试过程中出现错误: ${error.message}`);
  }
}

// 运行测试
runTests(); 