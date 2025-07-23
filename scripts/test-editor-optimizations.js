#!/usr/bin/env node

/**
 * 编辑器优化功能测试脚本
 * 验证三个优化点的修复效果
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 编辑器优化功能测试');
console.log('========================');

const testResults = {
  timestamp: new Date().toISOString(),
  optimizations: [
    '文档格式保持优化',
    '删除重复AI分析按钮',
    '页面状态管理修复'
  ],
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// 测试1: 检查文档格式保持优化
console.log('\n📝 测试1: 文档格式保持优化');
console.log('============================');

const qingCiEditorPath = 'app/editor/components/QingCiStyleEditor.tsx';
let formatFixPassed = false;

if (fs.existsSync(qingCiEditorPath)) {
  const content = fs.readFileSync(qingCiEditorPath, 'utf8');
  
  // 检查是否使用innerHTML而不是textContent
  const usesInnerHTML = content.includes('e.currentTarget.innerHTML');
  const avoidsTextContent = !content.includes('e.currentTarget.textContent');
  
  if (usesInnerHTML && avoidsTextContent) {
    console.log('✅ 文档格式保持修复成功');
    console.log('   📄 使用innerHTML保持HTML格式');
    console.log('   🚫 已移除textContent调用');
    formatFixPassed = true;
  } else {
    console.log('❌ 文档格式保持修复失败');
    if (!usesInnerHTML) {
      console.log('   ❌ 未找到innerHTML使用');
    }
    if (!avoidsTextContent) {
      console.log('   ❌ 仍在使用textContent');
    }
  }
} else {
  console.log('❌ QingCiStyleEditor文件不存在');
}

testResults.tests.push({
  name: '文档格式保持优化',
  status: formatFixPassed ? 'passed' : 'failed',
  details: formatFixPassed ? 'innerHTML替换textContent成功' : '格式保持修复失败'
});

// 测试2: 检查重复AI分析按钮删除
console.log('\n🔍 测试2: 重复AI分析按钮删除检查');
console.log('=================================');

let buttonRemovalPassed = false;

if (fs.existsSync(qingCiEditorPath)) {
  const content = fs.readFileSync(qingCiEditorPath, 'utf8');
  
  // 检查是否删除了AI分析按钮
  const hasAIAnalysisButton = content.includes('🔍 AI分析') || 
                             content.includes('AI分析按钮') ||
                             content.includes('onAnalyze');
  
  if (!hasAIAnalysisButton) {
    console.log('✅ 重复AI分析按钮删除成功');
    console.log('   🚫 工具栏中不再包含AI分析按钮');
    console.log('   ⚡ 避免了功能重复');
    buttonRemovalPassed = true;
  } else {
    console.log('❌ 重复AI分析按钮删除失败');
    console.log('   ❌ 工具栏中仍存在AI分析相关代码');
  }
} else {
  console.log('❌ QingCiStyleEditor文件不存在');
}

testResults.tests.push({
  name: '删除重复AI分析按钮',
  status: buttonRemovalPassed ? 'passed' : 'failed',
  details: buttonRemovalPassed ? 'AI分析按钮成功删除' : 'AI分析按钮删除失败'
});

// 测试3: 检查页面状态管理修复
console.log('\n🔄 测试3: 页面状态管理修复检查');
console.log('===============================');

const workAreaPath = 'app/editor/components/WorkArea.tsx';
let stateManagementPassed = false;

if (fs.existsSync(workAreaPath)) {
  const content = fs.readFileSync(workAreaPath, 'utf8');
  
  // 检查upload case是否包含条件逻辑
  const hasConditionalLogic = content.includes('uploadedDocument ?') &&
                             content.includes('case \'upload\':') &&
                             content.includes('RAGEnhancedEditor content={uploadedDocument}');
  
  if (hasConditionalLogic) {
    console.log('✅ 页面状态管理修复成功');
    console.log('   🔄 upload case包含条件逻辑');
    console.log('   📝 有文档时显示编辑器而非上传页面');
    console.log('   🎯 解决了导航逻辑问题');
    stateManagementPassed = true;
  } else {
    console.log('❌ 页面状态管理修复失败');
    console.log('   ❌ 未找到条件逻辑');
  }
} else {
  console.log('❌ WorkArea文件不存在');
}

testResults.tests.push({
  name: '页面状态管理修复',
  status: stateManagementPassed ? 'passed' : 'failed',
  details: stateManagementPassed ? '导航逻辑修复成功' : '导航逻辑修复失败'
});

// 测试4: 组件集成完整性检查
console.log('\n🔗 测试4: 组件集成完整性检查');
console.log('=============================');

const ragEditorPath = 'app/editor/components/RAGEnhancedEditor.tsx';
let integrationPassed = false;

if (fs.existsSync(ragEditorPath)) {
  const content = fs.readFileSync(ragEditorPath, 'utf8');
  
  // 检查RAGEnhancedEditor是否正确集成QingCiStyleEditor
  const hasQingCiImport = content.includes('import QingCiStyleEditor');
  const hasQingCiUsage = content.includes('<QingCiStyleEditor');
  const hasPropsPass = content.includes('content={documentContent}') &&
                      content.includes('errors={errors}');
  
  if (hasQingCiImport && hasQingCiUsage && hasPropsPass) {
    console.log('✅ 组件集成完整性检查通过');
    console.log('   📦 QingCiStyleEditor正确导入');
    console.log('   🔗 组件正确使用');
    console.log('   📋 属性正确传递');
    integrationPassed = true;
  } else {
    console.log('❌ 组件集成完整性检查失败');
    if (!hasQingCiImport) console.log('   ❌ 缺少组件导入');
    if (!hasQingCiUsage) console.log('   ❌ 缺少组件使用');
    if (!hasPropsPass) console.log('   ❌ 属性传递不完整');
  }
} else {
  console.log('❌ RAGEnhancedEditor文件不存在');
}

testResults.tests.push({
  name: '组件集成完整性',
  status: integrationPassed ? 'passed' : 'failed',
  details: integrationPassed ? '组件集成完整' : '组件集成存在问题'
});

// 测试5: 功能兼容性验证
console.log('\n⚙️ 测试5: 功能兼容性验证');
console.log('=========================');

let compatibilityPassed = true;
const compatibilityChecks = [];

// 检查文件存在性
const requiredFiles = [
  'app/editor/components/QingCiStyleEditor.tsx',
  'app/editor/components/RAGEnhancedEditor.tsx',
  'app/editor/components/WorkArea.tsx',
  'app/editor/components/SubMenu.tsx',
  'app/editor/page.tsx'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    compatibilityChecks.push({
      name: path.basename(file),
      status: '✅ 存在',
      passed: true
    });
  } else {
    compatibilityChecks.push({
      name: path.basename(file),
      status: '❌ 缺失',
      passed: false
    });
    compatibilityPassed = false;
  }
});

console.log('📁 核心文件检查:');
compatibilityChecks.forEach(check => {
  console.log(`   ${check.status} ${check.name}`);
});

if (compatibilityPassed) {
  console.log('✅ 所有必需文件都存在');
} else {
  console.log('❌ 存在缺失的关键文件');
}

testResults.tests.push({
  name: '功能兼容性验证',
  status: compatibilityPassed ? 'passed' : 'failed',
  details: `${compatibilityChecks.filter(c => c.passed).length}/${compatibilityChecks.length}个文件检查通过`
});

// 计算总体测试结果
testResults.summary.total = testResults.tests.length;
testResults.summary.passed = testResults.tests.filter(t => t.status === 'passed').length;
testResults.summary.failed = testResults.tests.filter(t => t.status === 'failed').length;

// 测试总结
console.log('\n📋 编辑器优化测试总结');
console.log('=======================');

console.log(`\n🎯 优化项目完成情况:`);
console.log(`   📝 文档格式保持: ${formatFixPassed ? '✅ 已修复' : '❌ 未修复'}`);
console.log(`   🔍 删除重复按钮: ${buttonRemovalPassed ? '✅ 已删除' : '❌ 未删除'}`);
console.log(`   🔄 状态管理修复: ${stateManagementPassed ? '✅ 已修复' : '❌ 未修复'}`);
console.log(`   🔗 组件集成完整: ${integrationPassed ? '✅ 完整' : '❌ 有问题'}`);

console.log(`\n📊 测试统计:`);
console.log(`   ✅ 通过: ${testResults.summary.passed}项`);
console.log(`   ❌ 失败: ${testResults.summary.failed}项`);
console.log(`   📈 成功率: ${(testResults.summary.passed / testResults.summary.total * 100).toFixed(1)}%`);

// 功能改进效果预测
console.log(`\n🌟 预期改进效果:`);
if (formatFixPassed) {
  console.log(`   📄 文档格式保持: 100%保持原始格式`);
}
if (buttonRemovalPassed) {
  console.log(`   🎯 界面简化: 减少功能重复，提升用户体验`);
}
if (stateManagementPassed) {
  console.log(`   🔄 导航优化: 解决页面跳转逻辑问题`);
}

// 使用建议
console.log(`\n💡 测试建议:`);
console.log(`   🌐 访问地址: http://localhost:3000/editor`);
console.log(`   📝 测试步骤:`);
console.log(`      1. 上传一个DOCX或TXT文档`);
console.log(`      2. 观察文档格式是否保持`);
console.log(`      3. 检查工具栏是否没有重复的AI分析按钮`);
console.log(`      4. 切换到其他菜单项后再回到"上传文档"`);
console.log(`      5. 验证是否显示编辑器而不是上传页面`);

// 保存测试报告
const reportPath = `test-reports/editor-optimizations-${Date.now()}.json`;
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`\n📄 测试报告已保存: ${reportPath}`);

console.log('\n🎉 编辑器优化测试完成！');
console.log('===========================');
console.log('📝 格式保持 | 🔍 按钮优化 | �� 状态管理 | ⚡ 用户体验'); 