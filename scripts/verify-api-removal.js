/**
 * API移除验证脚本
 * 验证基础版API移除后，系统功能是否正常工作
 */

const fs = require('fs');
const path = require('path');

// 验证配置
const VERIFICATION_CONFIG = {
  apiBaseURL: 'http://localhost:3000',
  testDocument: '这是一个测试文档，用于验证系统功能。此文档包含一些常见错误，例如：重复的的词语、标点符号错误、等等。',
  timeout: 30000
};

/**
 * 1. 验证基础版API文件已删除
 */
function verifyAPIFileRemoval() {
  console.log('\n🗑️  验证1: 基础版API文件已删除');
  console.log('=' .repeat(50));
  
  const basicAPIPath = path.join(__dirname, '../app/api/analyze-document/route.ts');
  
  if (fs.existsSync(basicAPIPath)) {
    console.log('❌ 基础版API文件仍然存在:', basicAPIPath);
    return false;
  } else {
    console.log('✅ 基础版API文件已成功删除');
    return true;
  }
}

/**
 * 2. 验证RAG增强版API是否正常工作
 */
async function verifyRAGAPIFunctionality() {
  console.log('\n🚀 验证2: RAG增强版API功能正常');
  console.log('=' .repeat(50));
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${VERIFICATION_CONFIG.apiBaseURL}/api/analyze-document-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        content: VERIFICATION_CONFIG.testDocument,
        ownerId: 'test_user'
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ RAG增强版API正常工作:');
    console.log(`   响应时间: ${duration}ms`);
    console.log(`   发现错误: ${result.errors?.length || 0} 个`);
    console.log(`   领域识别: ${result.domain_info?.domain || '未知'}`);
    console.log(`   知识库使用: ${result.knowledge_used?.length || 0} 条`);
    
    // 验证必要的响应字段
    const requiredFields = ['errors', 'domain_info', 'knowledge_used'];
    const missingFields = requiredFields.filter(field => !result[field]);
    
    if (missingFields.length > 0) {
      console.log(`⚠️  缺少字段: ${missingFields.join(', ')}`);
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ RAG增强版API测试失败:', error.message);
    return false;
  }
}

/**
 * 3. 验证api-helpers.ts中的更新
 */
function verifyAPIHelpersUpdate() {
  console.log('\n🔧 验证3: API辅助工具更新');
  console.log('=' .repeat(50));
  
  try {
    const apiHelpersPath = path.join(__dirname, '../lib/utils/api-helpers.ts');
    
    if (!fs.existsSync(apiHelpersPath)) {
      console.log('❌ api-helpers.ts文件不存在');
      return false;
    }
    
    const content = fs.readFileSync(apiHelpersPath, 'utf8');
    
    // 检查是否统一使用RAG增强版API
    if (content.includes("'/api/analyze-document-rag'") && 
        !content.includes("useRAG ? '/api/analyze-document-rag' : '/api/analyze-document'")) {
      console.log('✅ API辅助工具已更新为统一使用RAG增强版API');
      return true;
    } else {
      console.log('❌ API辅助工具可能未正确更新');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证API辅助工具失败:', error.message);
    return false;
  }
}

/**
 * 4. 验证编辑器组件更新
 */
function verifyEditorComponentUpdate() {
  console.log('\n🎨 验证4: 编辑器组件更新');
  console.log('=' .repeat(50));
  
  try {
    const editorPath = path.join(__dirname, '../app/editor/components/RAGEnhancedEditor.tsx');
    
    if (!fs.existsSync(editorPath)) {
      console.log('❌ RAGEnhancedEditor.tsx文件不存在');
      return false;
    }
    
    const content = fs.readFileSync(editorPath, 'utf8');
    
    // 检查是否移除了条件API选择
    if (content.includes("'/api/analyze-document-rag'") && 
        !content.includes("isUsingRAG ? '/api/analyze-document-rag' : '/api/analyze-document'")) {
      console.log('✅ 编辑器组件已更新为统一使用RAG增强版API');
      return true;
    } else {
      console.log('❌ 编辑器组件可能未正确更新');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证编辑器组件失败:', error.message);
    return false;
  }
}

/**
 * 5. 验证RAG增强版API中的回退逻辑已移除
 */
function verifyFallbackLogicRemoval() {
  console.log('\n🔄 验证5: 回退逻辑已移除');
  console.log('=' .repeat(50));
  
  try {
    const ragAPIPath = path.join(__dirname, '../app/api/analyze-document-rag/route.ts');
    
    if (!fs.existsSync(ragAPIPath)) {
      console.log('❌ RAG增强版API文件不存在');
      return false;
    }
    
    const content = fs.readFileSync(ragAPIPath, 'utf8');
    
    // 检查是否移除了对基础版API的回退调用
    if (!content.includes("'/api/analyze-document'") && 
        !content.includes('fallbackResponse')) {
      console.log('✅ RAG增强版API中的回退逻辑已移除');
      return true;
    } else {
      console.log('❌ RAG增强版API中可能仍有回退逻辑');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证回退逻辑移除失败:', error.message);
    return false;
  }
}

/**
 * 6. 验证基础版API的404响应
 */
async function verifyBasicAPIRemoved() {
  console.log('\n🚫 验证6: 基础版API已不可访问');
  console.log('=' .repeat(50));
  
  try {
    const response = await fetch(`${VERIFICATION_CONFIG.apiBaseURL}/api/analyze-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: VERIFICATION_CONFIG.testDocument })
    });
    
    if (response.status === 404) {
      console.log('✅ 基础版API已不可访问 (404)');
      return true;
    } else {
      console.log(`❌ 基础版API仍可访问 (${response.status})`);
      return false;
    }
    
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('✅ 基础版API已不可访问 (网络错误确认删除)');
      return true;
    } else {
      console.error('❌ 验证基础版API移除失败:', error.message);
      return false;
    }
  }
}

/**
 * 主验证函数
 */
async function runVerification() {
  console.log('🔍 开始API移除验证...');
  console.log('目标: 确保基础版API完全移除，RAG增强版API正常工作');
  console.log('时间:', new Date().toLocaleString());
  console.log('');
  
  const verificationResults = [];
  
  // 执行所有验证
  const verifications = [
    { name: 'API文件删除', func: verifyAPIFileRemoval },
    { name: 'RAG API功能', func: verifyRAGAPIFunctionality },
    { name: 'API辅助工具', func: verifyAPIHelpersUpdate },
    { name: '编辑器组件', func: verifyEditorComponentUpdate },
    { name: '回退逻辑移除', func: verifyFallbackLogicRemoval },
    { name: '基础API不可访问', func: verifyBasicAPIRemoved }
  ];
  
  for (const verification of verifications) {
    try {
      const result = await verification.func();
      verificationResults.push({
        name: verification.name,
        success: result,
        error: null
      });
    } catch (error) {
      verificationResults.push({
        name: verification.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // 生成验证报告
  console.log('\n📊 验证结果汇总');
  console.log('=' .repeat(60));
  
  const successCount = verificationResults.filter(r => r.success).length;
  const totalCount = verificationResults.length;
  
  verificationResults.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${index + 1}. ${result.name}: ${result.success ? '通过' : '失败'}`);
    if (result.error) {
      console.log(`     错误: ${result.error}`);
    }
  });
  
  console.log('');
  console.log(`📈 验证成功率: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('🎉 所有验证项目通过！基础版API移除成功！');
    console.log('');
    console.log('✨ 系统优势:');
    console.log('   📦 更简洁的API结构，维护更方便');
    console.log('   🧠 统一使用RAG增强分析，质量更高');
    console.log('   🚀 减少代码复杂度，性能更好');
    console.log('   🔄 统一的错误处理和日志记录');
  } else {
    console.log('⚠️  部分验证项目失败，请检查问题并修复');
    console.log('');
    console.log('🔧 建议操作:');
    console.log('   1. 检查失败的验证项目');
    console.log('   2. 确认所有文件都已正确更新');
    console.log('   3. 重新启动开发服务器');
    console.log('   4. 再次运行此验证脚本');
  }
  
  // 保存详细报告
  const reportPath = path.join(__dirname, '../test-reports/api-removal-verification.json');
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: totalCount,
    passedTests: successCount,
    successRate: Math.round(successCount/totalCount*100),
    results: verificationResults
  };
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存: ${reportPath}`);
  } catch (error) {
    console.log(`⚠️  保存报告失败: ${error.message}`);
  }
  
  return successCount === totalCount;
}

// 执行验证
if (require.main === module) {
  runVerification()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 验证过程出错:', error);
      process.exit(1);
    });
}

module.exports = { runVerification }; 