#!/usr/bin/env node

/**
 * 创建调试测试文件
 * 用于测试文档上传和内容显示问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 创建调试测试文件');
console.log('==================');

// 创建一个简单的测试文档
const testContent = `这是一个测试文档，用于调试内容显示问题。

第一段：这是第一段内容，包含一些基本的文字。

第二段：这是第二段内容，用于验证文档解析是否正常。

第三段：这是第三段内容，总共应该有大约100个字符左右。

结束。`;

const testDir = path.join(__dirname, '..', 'debug-test');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

const testFile = path.join(testDir, 'debug-test.txt');
fs.writeFileSync(testFile, testContent, 'utf8');

console.log(`✅ 创建测试文件: ${testFile}`);
console.log(`📄 文件内容长度: ${testContent.length} 字符`);
console.log(`📝 文件内容预览: "${testContent.substring(0, 50)}..."`);

console.log('\n🔍 请使用这个文件进行测试:');
console.log('1. 访问 http://localhost:3002/editor');
console.log('2. 上传这个测试文件');
console.log('3. 观察控制台日志和页面显示');
console.log('4. 特别关注以下日志:');
console.log('   - SubMenu: 文件上传成功');
console.log('   - WorkArea: renderContent');
console.log('   - RAGEnhancedEditor: 初始化');
console.log('   - RAGEnhancedEditor: Content prop changed');
console.log('   - 页面上的调试信息显示');

console.log('\n📋 如果问题仍然存在，请告诉我:');
console.log('1. 控制台是否显示 "SubMenu 文件上传成功" 日志？');
console.log('2. contentLength 显示多少？');
console.log('3. 页面上的调试信息显示什么？');
console.log('4. 是否有任何错误信息？');