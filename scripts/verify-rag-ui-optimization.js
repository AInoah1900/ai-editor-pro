/**
 * RAG UI优化验证脚本
 * 验证RAG增强复选框移除和界面优化的完成情况
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证RAG UI优化...');
console.log('目标: 确保RAG增强复选框已移除，界面统一显示RAG增强状态');
console.log('时间:', new Date().toLocaleString());
console.log('');

const VERIFICATION_CONFIG = {
  targetFile: path.join(__dirname, '../app/editor/components/RAGEnhancedEditor.tsx')
};

/**
 * 1. 验证isUsingRAG状态变量已移除
 */
function verifyStateVariableRemoval() {
  console.log('🗑️  验证1: isUsingRAG状态变量已移除');
  console.log('=' .repeat(50));
  
  try {
    const content = fs.readFileSync(VERIFICATION_CONFIG.targetFile, 'utf8');
    
    // 检查是否还有isUsingRAG的引用
    const isUsingRAGCount = (content.match(/isUsingRAG/g) || []).length;
    const setIsUsingRAGCount = (content.match(/setIsUsingRAG/g) || []).length;
    
    if (isUsingRAGCount === 0 && setIsUsingRAGCount === 0) {
      console.log('✅ isUsingRAG状态变量及其引用已完全移除');
      return true;
    } else {
      console.log(`❌ 仍有isUsingRAG引用: ${isUsingRAGCount}个, setIsUsingRAG引用: ${setIsUsingRAGCount}个`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证状态变量移除失败:', error.message);
    return false;
  }
}

/**
 * 2. 验证RAG增强复选框已移除
 */
function verifyCheckboxRemoval() {
  console.log('\n🗑️  验证2: RAG增强复选框已移除');
  console.log('=' .repeat(50));
  
  try {
    const content = fs.readFileSync(VERIFICATION_CONFIG.targetFile, 'utf8');
    
    // 检查是否还有复选框相关的代码
    const checkboxPatterns = [
      /type="checkbox"/g,
      /checked=\{isUsingRAG\}/g,
      /onChange=\{.*setIsUsingRAG.*\}/g
    ];
    
    let hasCheckbox = false;
    checkboxPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasCheckbox = true;
      }
    });
    
    if (!hasCheckbox) {
      console.log('✅ RAG增强复选框已成功移除');
      return true;
    } else {
      console.log('❌ 检测到复选框相关代码仍然存在');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证复选框移除失败:', error.message);
    return false;
  }
}

/**
 * 3. 验证新的RAG增强显示状态
 */
function verifyNewRAGDisplay() {
  console.log('\n✨ 验证3: 新的RAG增强显示状态');
  console.log('=' .repeat(50));
  
  try {
    const content = fs.readFileSync(VERIFICATION_CONFIG.targetFile, 'utf8');
    
    // 检查是否有新的RAG增强显示
    const newDisplayPatterns = [
      /✨ RAG增强分析/,
      /\(已启用\)/,
      /统一使用RAG增强版/
    ];
    
    let foundNewDisplay = 0;
    newDisplayPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        foundNewDisplay++;
      }
    });
    
    if (foundNewDisplay >= 2) {
      console.log('✅ 新的RAG增强显示状态已正确实现');
      console.log(`   检测到 ${foundNewDisplay}/3 个新显示元素`);
      return true;
    } else {
      console.log(`❌ 新的RAG增强显示不完整，仅找到 ${foundNewDisplay}/3 个元素`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证新显示状态失败:', error.message);
    return false;
  }
}

/**
 * 4. 验证条件渲染逻辑简化
 */
function verifyConditionalRenderingSimplification() {
  console.log('\n🎯 验证4: 条件渲染逻辑简化');
  console.log('=' .repeat(50));
  
  try {
    const content = fs.readFileSync(VERIFICATION_CONFIG.targetFile, 'utf8');
    
    // 检查是否还有基于isUsingRAG的条件渲染
    const conditionalPatterns = [
      /\{isUsingRAG \?.*:.*\}/g,
      /isUsingRAG \&\& ragResults/g
    ];
    
    let hasConditional = false;
    conditionalPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasConditional = true;
      }
    });
    
    if (!hasConditional) {
      console.log('✅ 条件渲染逻辑已成功简化');
      return true;
    } else {
      console.log('❌ 仍有基于isUsingRAG的条件渲染逻辑');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证条件渲染简化失败:', error.message);
    return false;
  }
}

/**
 * 5. 验证文本内容统一性
 */
function verifyTextConsistency() {
  console.log('\n📝 验证5: 文本内容统一性');
  console.log('=' .repeat(50));
  
  try {
    const content = fs.readFileSync(VERIFICATION_CONFIG.targetFile, 'utf8');
    
    // 检查统一的RAG相关文本
    const expectedTexts = [
      /RAG知识库深度分析/,
      /基于RAG知识库分析/,
      /RAG增强模式已启用/
    ];
    
    let foundTexts = 0;
    expectedTexts.forEach(pattern => {
      if (pattern.test(content)) {
        foundTexts++;
      }
    });
    
    // 检查是否还有基础版本的文本
    const oldTexts = [
      /基础AI分析/,
      /🎯 执行基础AI分析/,
      /使用基础AI分析模式/
    ];
    
    let hasOldTexts = false;
    oldTexts.forEach(pattern => {
      if (pattern.test(content)) {
        hasOldTexts = true;
      }
    });
    
    if (foundTexts >= 2 && !hasOldTexts) {
      console.log('✅ 文本内容已统一为RAG增强版本');
      console.log(`   找到 ${foundTexts}/3 个RAG相关文本`);
      return true;
    } else {
      console.log(`❌ 文本统一性检查失败`);
      if (hasOldTexts) {
        console.log('   仍有基础版本的文本残留');
      }
      console.log(`   RAG文本数量: ${foundTexts}/3`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证文本统一性失败:', error.message);  
    return false;
  }
}

/**
 * 主验证函数
 */
async function runVerification() {
  const verificationResults = [];
  
  // 执行所有验证
  const verifications = [
    { name: '状态变量移除', func: verifyStateVariableRemoval },
    { name: '复选框移除', func: verifyCheckboxRemoval },
    { name: 'RAG显示状态', func: verifyNewRAGDisplay },
    { name: '条件渲染简化', func: verifyConditionalRenderingSimplification },
    { name: '文本内容统一', func: verifyTextConsistency }
  ];
  
  for (const verification of verifications) {
    try {
      const result = verification.func();
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
    console.log('🎉 所有验证项目通过！RAG UI优化成功完成！');
    console.log('');
    console.log('✨ 优化成果:');
    console.log('   📦 移除了不必要的RAG增强复选框');
    console.log('   🎯 界面统一显示RAG增强状态');
    console.log('   📝 文本内容保持一致性');
    console.log('   🔄 代码逻辑更加简洁清晰');
    console.log('');
    console.log('🚀 用户体验提升:');
    console.log('   - 无需选择，统一使用最佳的RAG增强分析');
    console.log('   - 界面更简洁，减少用户困惑');
    console.log('   - 明确显示当前使用的分析模式');
  } else {
    console.log('⚠️  部分验证项目失败，请检查问题并修复');
    console.log('');
    console.log('🔧 建议操作:');
    console.log('   1. 检查失败的验证项目');
    console.log('   2. 手动检查相关代码');
    console.log('   3. 重新运行修复脚本');
    console.log('   4. 再次运行此验证脚本');
  }
  
  // 保存详细报告
  const reportPath = path.join(__dirname, '../test-reports/rag-ui-optimization-verification.json');
  const report = {
    timestamp: new Date().toISOString(),
    totalTests: totalCount,
    passedTests: successCount,
    successRate: Math.round(successCount/totalCount*100),
    results: verificationResults,
    summary: {
      stateVariableRemoved: verificationResults[0].success,
      checkboxRemoved: verificationResults[1].success,
      newDisplayImplemented: verificationResults[2].success,
      conditionalRenderingSimplified: verificationResults[3].success,
      textUnified: verificationResults[4].success
    }
  };
  
  try {
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
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
      console.log(`\n🏁 RAG UI优化验证完成 - ${success ? '成功' : '需要修复'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 验证过程出错:', error);
      process.exit(1);
    });
}

module.exports = { runVerification }; 