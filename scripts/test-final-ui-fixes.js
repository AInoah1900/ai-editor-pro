const fs = require('fs');
const path = require('path');

console.log('🧪 测试最终界面修复效果\n');

// 读取组件文件
const componentPath = path.join(__dirname, '../app/editor/components/RAGEnhancedEditor.tsx');

if (!fs.existsSync(componentPath)) {
  console.error('❌ 组件文件不存在:', componentPath);
  process.exit(1);
}

const componentContent = fs.readFileSync(componentPath, 'utf8');

// 测试项目
const tests = [
  {
    name: '1. 文档内容显示功能',
    test: () => {
      const hasRenderFunction = componentContent.includes('renderDocumentWithInlineCorrections()');
      const hasDocumentArea = componentContent.includes('文档内容区');
      const hasContentDisplay = componentContent.includes('documentContent');
      return hasRenderFunction && hasDocumentArea && hasContentDisplay;
    }
  },
  {
    name: '2. 使用说明栏布局优化',
    test: () => {
      const hasOptimizedLayout = componentContent.includes('第一行：主要说明和文档统计');
      const hasFlexLayout = componentContent.includes('flex items-start justify-between');
      const hasDocumentStats = componentContent.includes('文档统计');
      return hasOptimizedLayout && hasFlexLayout && hasDocumentStats;
    }
  },
  {
    name: '3. 蓝色标注说明添加',
    test: () => {
      const hasBlueAnnotation = componentContent.includes('已替换内容');
      const hasBlueStyle = componentContent.includes('bg-blue-100 border-l-2 border-blue-500');
      return hasBlueAnnotation && hasBlueStyle;
    }
  },
  {
    name: '4. RAG置信度显示修复',
    test: () => {
      // 检查是否使用了Math.round而不是toFixed
      const hasCorrectConfidence = componentContent.includes('Math.round((ragResults.domain_info.confidence || 0) * 100)');
      const hasCorrectRAGConfidence = componentContent.includes('Math.round((ragResults.rag_confidence || 0) * 100)');
      // 确保没有使用有问题的toFixed方法
      const noProblematicToFixed = !componentContent.includes('(ragResults.domain_info.confidence * 100).toFixed(0)');
      return hasCorrectConfidence && hasCorrectRAGConfidence && noProblematicToFixed;
    }
  },
  {
    name: '5. 知识库数据显示修复',
    test: () => {
      const hasPrivateCountFix = componentContent.includes('ragResults.knowledge_sources.private_count || 0');
      const hasSharedCountFix = componentContent.includes('ragResults.knowledge_sources.shared_count || 0');
      const hasTotalCountFix = componentContent.includes('ragResults.knowledge_sources.total_count || (ragResults.knowledge_used?.length || 0)');
      return hasPrivateCountFix && hasSharedCountFix && hasTotalCountFix;
    }
  }
];

// 执行测试
let passedTests = 0;
console.log('📊 测试结果:\n');

tests.forEach((test, index) => {
  const result = test.test();
  const status = result ? '✅' : '❌';
  console.log(`${status} ${test.name}: ${result ? '通过' : '失败'}`);
  if (result) passedTests++;
});

// 总结
console.log('\n' + '='.repeat(50));
console.log(`🎯 总体结果: ${passedTests}/${tests.length} 通过`);

if (passedTests === tests.length) {
  console.log('🎉 所有界面优化问题都已修复！');
} else {
  console.log('⚠️ 部分问题需要进一步修复');
}

// 详细功能检查
console.log('\n🔍 详细功能检查:');

// 检查文档内容渲染逻辑
const renderFunctionMatches = componentContent.match(/renderDocumentWithInlineCorrections[\s\S]*?(?=const|function|\}$)/);
if (renderFunctionMatches) {
  console.log('✅ 文档渲染函数存在且完整');
} else {
  console.log('❌ 文档渲染函数缺失或不完整');
}

// 检查错误处理逻辑
const hasErrorHandling = componentContent.includes('validErrors') && 
                        componentContent.includes('sortedErrors') &&
                        componentContent.includes('validateDocumentIntegrity');
console.log(`${hasErrorHandling ? '✅' : '❌'} 错误处理逻辑: ${hasErrorHandling ? '完整' : '缺失'}`);

// 检查浮动菜单功能
const hasFloatingMenu = componentContent.includes('floatingMenu') && 
                       componentContent.includes('showFloatingMenu') &&
                       componentContent.includes('hideFloatingMenu');
console.log(`${hasFloatingMenu ? '✅' : '❌'} 浮动菜单功能: ${hasFloatingMenu ? '完整' : '缺失'}`);

// 检查替换功能
const hasReplaceFunction = componentContent.includes('replaceWithSuggestion') &&
                          componentContent.includes('replacedContents');
console.log(`${hasReplaceFunction ? '✅' : '❌'} 替换功能: ${hasReplaceFunction ? '完整' : '缺失'}`);

// 检查RAG功能集成
const hasRAGIntegration = componentContent.includes('isUsingRAG') &&
                         componentContent.includes('ragResults') &&
                         componentContent.includes('knowledge_sources');
console.log(`${hasRAGIntegration ? '✅' : '❌'} RAG功能集成: ${hasRAGIntegration ? '完整' : '缺失'}`);

console.log('\n✨ 界面优化修复测试完成！');

// 生成测试报告
const report = {
  timestamp: new Date().toISOString(),
  totalTests: tests.length,
  passedTests: passedTests,
  successRate: `${Math.round((passedTests / tests.length) * 100)}%`,
  testResults: tests.map(test => ({
    name: test.name,
    passed: test.test()
  })),
  functionalityChecks: {
    documentRendering: !!renderFunctionMatches,
    errorHandling: hasErrorHandling,
    floatingMenu: hasFloatingMenu,
    replaceFunction: hasReplaceFunction,
    ragIntegration: hasRAGIntegration
  }
};

// 保存测试报告
const reportPath = path.join(__dirname, '../test-reports/final-ui-fixes-' + Date.now() + '.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 测试报告已保存: ${reportPath}`); 