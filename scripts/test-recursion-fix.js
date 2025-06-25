const fs = require('fs');
const path = require('path');

console.log('🔧 测试递归调用修复效果...\n');

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
    name: '检查renderDocumentWithInlineCorrections函数不包含递归调用',
    test: () => {
      const functionStart = componentContent.indexOf('const renderDocumentWithInlineCorrections = () => {');
      const functionEnd = componentContent.indexOf('};', functionStart);
      
      if (functionStart === -1 || functionEnd === -1) {
        return { success: false, message: '无法找到renderDocumentWithInlineCorrections函数' };
      }
      
      const functionBody = componentContent.slice(functionStart, functionEnd);
      const recursiveCalls = (functionBody.match(/renderDocumentWithInlineCorrections\(\)/g) || []).length;
      
      if (recursiveCalls > 0) {
        return { success: false, message: `发现 ${recursiveCalls} 个递归调用` };
      }
      
      return { success: true, message: '✅ 无递归调用' };
    }
  },
  {
    name: '检查getErrorStats函数调用是否被替换为直接计算',
    test: () => {
      const functionStart = componentContent.indexOf('const renderDocumentWithInlineCorrections = () => {');
      const functionEnd = componentContent.indexOf('};', functionStart);
      
      if (functionStart === -1 || functionEnd === -1) {
        return { success: false, message: '无法找到renderDocumentWithInlineCorrections函数' };
      }
      
      const functionBody = componentContent.slice(functionStart, functionEnd);
      const getErrorStatsCalls = (functionBody.match(/getErrorStats\(\)/g) || []).length;
      const directCalculations = (functionBody.match(/errors\.filter\(e => e\.type === 'error'\)\.length/g) || []).length;
      
      if (getErrorStatsCalls > 0) {
        return { success: false, message: `仍有 ${getErrorStatsCalls} 个getErrorStats调用` };
      }
      
      if (directCalculations === 0) {
        return { success: false, message: '没有找到直接计算的错误统计' };
      }
      
      return { success: true, message: `✅ 已替换为直接计算 (${directCalculations}处)` };
    }
  },
  {
    name: '检查浮动菜单是否正确放置在组件return内',
    test: () => {
      const returnStart = componentContent.lastIndexOf('return (');
      const returnEnd = componentContent.lastIndexOf('};');
      
      if (returnStart === -1 || returnEnd === -1) {
        return { success: false, message: '无法找到组件return语句' };
      }
      
      const returnBody = componentContent.slice(returnStart, returnEnd);
      const floatingMenus = (returnBody.match(/浮动纠错菜单/g) || []).length;
      
      if (floatingMenus === 0) {
        return { success: false, message: '没有找到浮动菜单' };
      }
      
      if (floatingMenus > 1) {
        return { success: false, message: `发现多个浮动菜单 (${floatingMenus}个)` };
      }
      
      return { success: true, message: '✅ 浮动菜单正确放置' };
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
  console.log('\n🎉 所有测试通过！递归调用问题已修复！');
  process.exit(0);
} else {
  console.log('\n⚠️  部分测试失败，请检查相关问题。');
  process.exit(1);
}
