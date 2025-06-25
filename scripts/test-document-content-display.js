const fs = require('fs');
const path = require('path');

console.log('🔍 测试文档内容显示问题...\n');

const componentPath = path.join(__dirname, '../app/editor/components/RAGEnhancedEditor.tsx');

// 检查文件是否存在
if (!fs.existsSync(componentPath)) {
  console.error('❌ 组件文件不存在:', componentPath);
  process.exit(1);
}

const componentContent = fs.readFileSync(componentPath, 'utf8');

// 测试项目
const tests = [
  {
    name: '检查renderDocumentWithInlineCorrections函数是否包含fallback逻辑',
    test: () => {
      const functionStart = componentContent.indexOf('const renderDocumentWithInlineCorrections = () => {');
      const functionEnd = componentContent.indexOf('};', functionStart);
      
      if (functionStart === -1 || functionEnd === -1) {
        return { success: false, message: '无法找到renderDocumentWithInlineCorrections函数' };
      }
      
      const functionBody = componentContent.slice(functionStart, functionEnd);
      const hasFallback = functionBody.includes('shouldShowFallback') && 
                         functionBody.includes('使用fallback显示完整文档内容');
      
      if (!hasFallback) {
        return { success: false, message: '缺少fallback逻辑' };
      }
      
      return { success: true, message: '✅ 包含fallback逻辑' };
    }
  },
  {
    name: '检查parts数组构建逻辑',
    test: () => {
      const functionStart = componentContent.indexOf('const renderDocumentWithInlineCorrections = () => {');
      const functionEnd = componentContent.indexOf('};', functionStart);
      
      if (functionStart === -1 || functionEnd === -1) {
        return { success: false, message: '无法找到renderDocumentWithInlineCorrections函数' };
      }
      
      const functionBody = componentContent.slice(functionStart, functionEnd);
      const hasPartsArray = functionBody.includes('const parts = []');
      const hasInitialText = functionBody.includes('添加开头正常文本');
      const hasFinalText = functionBody.includes('添加最后文本到parts');
      
      if (!hasPartsArray) {
        return { success: false, message: '缺少parts数组定义' };
      }
      
      if (!hasInitialText || !hasFinalText) {
        return { success: false, message: '缺少完整的文档内容构建逻辑' };
      }
      
      return { success: true, message: '✅ parts数组构建逻辑完整' };
    }
  },
  {
    name: '检查是否有多个文档内容渲染区域',
    test: () => {
      const documentContentMatches = (componentContent.match(/文档内容（含标注）/g) || []).length;
      
      if (documentContentMatches === 0) {
        return { success: false, message: '没有找到文档内容渲染区域' };
      }
      
      if (documentContentMatches > 2) {
        return { success: false, message: `发现过多的文档内容区域 (${documentContentMatches}个)` };
      }
      
      return { success: true, message: `✅ 文档内容区域数量正常 (${documentContentMatches}个)` };
    }
  },
  {
    name: '检查文档内容是否正确传递给renderDocumentWithInlineCorrections',
    test: () => {
      const renderCalls = (componentContent.match(/\{renderDocumentWithInlineCorrections\(\)\}/g) || []).length;
      
      if (renderCalls === 0) {
        return { success: false, message: '没有找到renderDocumentWithInlineCorrections调用' };
      }
      
      if (renderCalls > 1) {
        return { success: false, message: `发现多个renderDocumentWithInlineCorrections调用 (${renderCalls}个)` };
      }
      
      return { success: true, message: `✅ renderDocumentWithInlineCorrections调用正常 (${renderCalls}个)` };
    }
  },
  {
    name: '检查documentContent状态是否正确使用',
    test: () => {
      const documentContentUsage = (componentContent.match(/documentContent/g) || []).length;
      
      if (documentContentUsage < 10) {
        return { success: false, message: `documentContent使用次数过少 (${documentContentUsage}次)` };
      }
      
      // 检查是否有空内容检查
      const hasEmptyCheck = componentContent.includes('documentContent.trim().length === 0') ||
                           componentContent.includes('!documentContent');
      
      if (!hasEmptyCheck) {
        return { success: false, message: '缺少空内容检查逻辑' };
      }
      
      return { success: true, message: `✅ documentContent使用正常 (${documentContentUsage}次)` };
    }
  }
];

// 运行测试
let passedTests = 0;
let totalTests = tests.length;

console.log('📋 开始测试...\n');

tests.forEach((test, index) => {
  console.log(`${index + 1}. ${test.name}`);
  
  try {
    const result = test.test();
    if (result.success) {
      console.log(`   ✅ ${result.message}`);
      passedTests++;
    } else {
      console.log(`   ❌ ${result.message}`);
    }
  } catch (error) {
    console.log(`   ❌ 测试执行失败: ${error.message}`);
  }
  
  console.log('');
});

// 总结
console.log('📊 测试总结:');
console.log(`   通过: ${passedTests}/${totalTests}`);
console.log(`   成功率: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 所有测试通过！文档内容显示逻辑正常！');
} else {
  console.log('\n⚠️  部分测试失败，需要进一步检查。');
}

// 额外诊断信息
console.log('\n🔍 额外诊断信息:');

// 查找renderDocumentWithInlineCorrections函数的长度
const functionStart = componentContent.indexOf('const renderDocumentWithInlineCorrections = () => {');
const functionEnd = componentContent.indexOf('};', functionStart);

if (functionStart !== -1 && functionEnd !== -1) {
  const functionLength = functionEnd - functionStart;
  console.log(`📏 renderDocumentWithInlineCorrections函数长度: ${functionLength} 字符`);
  
  const functionBody = componentContent.slice(functionStart, functionEnd);
  const returnStatements = (functionBody.match(/return \(/g) || []).length;
  console.log(`🔄 return语句数量: ${returnStatements}`);
  
  const consoleLogCount = (functionBody.match(/console\.log/g) || []).length;
  console.log(`📝 调试日志数量: ${consoleLogCount}`);
} 