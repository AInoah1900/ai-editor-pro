#!/usr/bin/env node

/**
 * AI编辑器布局优化测试脚本
 * 验证底部功能栏移动和图标简化的效果
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 AI编辑器布局优化测试');
console.log('==========================');

const testResults = {
  timestamp: new Date().toISOString(),
  feature: 'AI编辑器布局优化',
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// 测试1: 检查QingCiStyleEditor中底部功能栏是否已移除
console.log('\n🗑️ 测试1: QingCiStyleEditor底部功能栏移除检查');
console.log('===============================================');

const qingCiEditorPath = 'app/editor/components/QingCiStyleEditor.tsx';
let bottomToolbarRemoved = false;

if (fs.existsSync(qingCiEditorPath)) {
  const content = fs.readFileSync(qingCiEditorPath, 'utf8');
  
  // 检查是否已移除底部功能区
  const hasBottomToolbar = content.includes('底部功能区') || 
                          content.includes('qingci-bottom-toolbar');
  
  // 检查是否移除了相关按钮定义
  const hasButtonFunctions = content.includes('clearText') && 
                             content.includes('clearFormat') && 
                             content.includes('importDocument') && 
                             content.includes('downloadDocument');
  
  if (!hasBottomToolbar && !hasButtonFunctions) {
    console.log('✅ 底部功能栏已成功移除');
    console.log('   🗑️ 移除了底部功能区组件');
    console.log('   🔧 移除了相关处理函数');
    bottomToolbarRemoved = true;
  } else {
    console.log('❌ 底部功能栏移除不完整');
    if (hasBottomToolbar) console.log('   ❌ 仍存在底部功能区组件');
    if (hasButtonFunctions) console.log('   ❌ 仍存在相关处理函数');
  }
} else {
  console.log('❌ QingCiStyleEditor文件不存在');
}

testResults.tests.push({
  name: 'QingCiStyleEditor底部功能栏移除',
  status: bottomToolbarRemoved ? 'passed' : 'failed',
  details: bottomToolbarRemoved ? '底部功能栏完全移除' : '底部功能栏移除不完整'
});

// 测试2: 检查RAGEnhancedEditor中新底部功能栏的添加
console.log('\n➕ 测试2: RAGEnhancedEditor新底部功能栏添加检查');
console.log('===============================================');

const ragEditorPath = 'app/editor/components/RAGEnhancedEditor.tsx';
let newBottomToolbarAdded = false;

if (fs.existsSync(ragEditorPath)) {
  const content = fs.readFileSync(ragEditorPath, 'utf8');
  
  // 检查是否添加了新的底部功能栏
  const hasNewBottomToolbar = content.includes('底部功能栏') && 
                             content.includes('bottom-toolbar');
  
  // 检查是否在使用说明后面
  const usageIndex = content.indexOf('使用说明:');
  const toolbarIndex = content.indexOf('底部功能栏');
  const isPositionCorrect = usageIndex > 0 && toolbarIndex > usageIndex;
  
  // 检查是否包含所需按钮
  const hasRequiredButtons = content.includes('加入词库') &&
                            content.includes('清空文本') &&
                            content.includes('清除格式') &&
                            content.includes('链接校对') &&
                            content.includes('导入') &&
                            content.includes('下载');
  
  if (hasNewBottomToolbar && isPositionCorrect && hasRequiredButtons) {
    console.log('✅ 新底部功能栏添加成功');
    console.log('   📍 位置正确：在使用说明下面');
    console.log('   🔘 包含所有必需按钮');
    newBottomToolbarAdded = true;
  } else {
    console.log('❌ 新底部功能栏添加有问题');
    if (!hasNewBottomToolbar) console.log('   ❌ 缺少底部功能栏组件');
    if (!isPositionCorrect) console.log('   ❌ 位置不正确');
    if (!hasRequiredButtons) console.log('   ❌ 缺少必需按钮');
  }
} else {
  console.log('❌ RAGEnhancedEditor文件不存在');
}

testResults.tests.push({
  name: 'RAGEnhancedEditor新底部功能栏添加',
  status: newBottomToolbarAdded ? 'passed' : 'failed',
  details: newBottomToolbarAdded ? '新底部功能栏添加成功' : '新底部功能栏添加有问题'
});

// 测试3: 检查按钮图标简化
console.log('\n🎨 测试3: 按钮图标简化检查');
console.log('============================');

let iconsSimplified = false;

if (fs.existsSync(ragEditorPath)) {
  const content = fs.readFileSync(ragEditorPath, 'utf8');
  
  // 检查按钮是否去掉了emoji图标
  const hasEmojiIcons = content.includes('📚 加入词库') ||
                       content.includes('🧹 清空文本') ||
                       content.includes('🎨 清除格式') ||
                       content.includes('🔗 链接校对') ||
                       content.includes('📁 导入') ||
                       content.includes('💾 下载');
  
  // 检查按钮是否只包含文字
  const hasSimpleText = content.includes('>加入词库<') &&
                       content.includes('>清空文本<') &&
                       content.includes('>清除格式<') &&
                       content.includes('>链接校对<') &&
                       content.includes('>导入<') &&
                       content.includes('>下载<');
  
  if (!hasEmojiIcons && hasSimpleText) {
    console.log('✅ 按钮图标成功简化');
    console.log('   🎯 移除了emoji图标');
    console.log('   📝 保持纯文字显示');
    iconsSimplified = true;
  } else {
    console.log('❌ 按钮图标简化有问题');
    if (hasEmojiIcons) console.log('   ❌ 仍包含emoji图标');
    if (!hasSimpleText) console.log('   ❌ 文字显示不正确');
  }
} else {
  console.log('❌ RAGEnhancedEditor文件不存在');
}

testResults.tests.push({
  name: '按钮图标简化',
  status: iconsSimplified ? 'passed' : 'failed',
  details: iconsSimplified ? '按钮图标成功简化' : '按钮图标简化有问题'
});

// 测试4: 检查处理函数的实现
console.log('\n🔧 测试4: 处理函数实现检查');
console.log('=============================');

let handlersImplemented = false;

if (fs.existsSync(ragEditorPath)) {
  const content = fs.readFileSync(ragEditorPath, 'utf8');
  
  // 检查是否实现了所有处理函数
  const hasHandlers = content.includes('handleClearText') &&
                     content.includes('handleClearFormat') &&
                     content.includes('handleImportDocument') &&
                     content.includes('handleDownloadDocument');
  
  // 检查处理函数是否包含基本逻辑
  const hasLogic = content.includes('confirm(') && // clearText确认
                  content.includes('alert(') && // clearFormat提示
                  content.includes('input.type = \'file\'') && // import文件选择
                  content.includes('Blob(') && // download文件生成
                  content.includes('URL.createObjectURL'); // download链接生成
  
  if (hasHandlers && hasLogic) {
    console.log('✅ 处理函数实现完整');
    console.log('   🧹 clearText: 包含确认逻辑');
    console.log('   🎨 clearFormat: 包含提示逻辑');
    console.log('   📁 importDocument: 包含文件选择');
    console.log('   💾 downloadDocument: 包含文件下载');
    handlersImplemented = true;
  } else {
    console.log('❌ 处理函数实现不完整');
    if (!hasHandlers) console.log('   ❌ 缺少函数定义');
    if (!hasLogic) console.log('   ❌ 缺少核心逻辑');
  }
} else {
  console.log('❌ RAGEnhancedEditor文件不存在');
}

testResults.tests.push({
  name: '处理函数实现',
  status: handlersImplemented ? 'passed' : 'failed',
  details: handlersImplemented ? '处理函数实现完整' : '处理函数实现不完整'
});

// 测试5: 检查字数统计的保持
console.log('\n📊 测试5: 字数统计功能保持检查');
console.log('===============================');

let statsPreserved = false;

if (fs.existsSync(ragEditorPath)) {
  const content = fs.readFileSync(ragEditorPath, 'utf8');
  
  // 检查是否保持了字数统计显示
  const hasStatsDisplay = content.includes('右侧统计信息') &&
                         content.includes('documentContent.length');
  
  // 检查统计信息的格式
  const hasStatsFormat = content.includes('共') && content.includes('字');
  
  if (hasStatsDisplay && hasStatsFormat) {
    console.log('✅ 字数统计功能保持完好');
    console.log('   📊 保持统计信息显示');
    console.log('   📝 格式正确显示');
    statsPreserved = true;
  } else {
    console.log('❌ 字数统计功能有问题');
    if (!hasStatsDisplay) console.log('   ❌ 缺少统计显示');
    if (!hasStatsFormat) console.log('   ❌ 格式显示不正确');
  }
} else {
  console.log('❌ RAGEnhancedEditor文件不存在');
}

testResults.tests.push({
  name: '字数统计功能保持',
  status: statsPreserved ? 'passed' : 'failed',
  details: statsPreserved ? '字数统计功能保持完好' : '字数统计功能有问题'
});

// 计算总体测试结果
testResults.summary.total = testResults.tests.length;
testResults.summary.passed = testResults.tests.filter(t => t.status === 'passed').length;
testResults.summary.failed = testResults.tests.filter(t => t.status === 'failed').length;

// 测试总结
console.log('\n📋 AI编辑器布局优化测试总结');
console.log('===============================');

console.log(`\n🎯 功能实现情况:`);
console.log(`   🗑️ 原功能栏移除: ${bottomToolbarRemoved ? '✅ 完成' : '❌ 未完成'}`);
console.log(`   ➕ 新功能栏添加: ${newBottomToolbarAdded ? '✅ 完成' : '❌ 未完成'}`);
console.log(`   🎨 图标简化: ${iconsSimplified ? '✅ 完成' : '❌ 未完成'}`);
console.log(`   🔧 处理函数: ${handlersImplemented ? '✅ 完成' : '❌ 未完成'}`);
console.log(`   📊 统计保持: ${statsPreserved ? '✅ 完成' : '❌ 未完成'}`);

console.log(`\n📊 测试统计:`);
console.log(`   ✅ 通过: ${testResults.summary.passed}项`);
console.log(`   ❌ 失败: ${testResults.summary.failed}项`);
console.log(`   📈 成功率: ${(testResults.summary.passed / testResults.summary.total * 100).toFixed(1)}%`);

// 预期改进效果
console.log(`\n🌟 预期改进效果:`);
if (bottomToolbarRemoved && newBottomToolbarAdded) {
  console.log(`   📍 布局优化：功能栏移至使用说明下方`);
}
if (iconsSimplified) {
  console.log(`   🎨 界面简化：去除按钮图标，界面更简洁`);
}
if (handlersImplemented) {
  console.log(`   🔧 功能完整：所有按钮功能正常可用`);
}
if (statsPreserved) {
  console.log(`   📊 信息保持：字数统计等功能继续可用`);
}

// 布局对比说明
console.log(`\n📐 布局变化对比:`);
console.log(`   优化前: 使用说明 → 编辑区域 → 底部功能栏`);
console.log(`   优化后: 使用说明 → 底部功能栏 → 编辑区域`);
console.log(`   优势: 功能栏更容易发现，符合用户操作习惯`);

// 使用建议
console.log(`\n💡 测试建议:`);
console.log(`   🌐 访问地址: http://localhost:3002/editor`);
console.log(`   📝 测试步骤:`);
console.log(`      1. 打开AI编辑器页面`);
console.log(`      2. 观察底部功能栏位置是否在使用说明下方`);
console.log(`      3. 检查按钮是否去除了图标，显示更简洁`);
console.log(`      4. 测试各个按钮功能是否正常工作`);
console.log(`      5. 验证字数统计等信息是否正确显示`);

// 保存测试报告
const reportPath = `test-reports/editor-layout-optimization-${Date.now()}.json`;
if (!fs.existsSync('test-reports')) {
  fs.mkdirSync('test-reports', { recursive: true });
}
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`\n📄 测试报告已保存: ${reportPath}`);

console.log('\n🎉 AI编辑器布局优化测试完成！');
console.log('====================================');
console.log('🎨 布局优化 | 🗑️ 功能移动 | 🔧 图标简化 | 📊 信息保持'); 