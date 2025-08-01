#!/usr/bin/env node

/**
 * Mammoth解析测试脚本
 * 测试.docx文件解析是否正常工作
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Mammoth解析测试');
console.log('==================');

// 检查mammoth是否正确安装
try {
  const mammoth = require('mammoth');
  console.log('✅ mammoth库已正确安装');
  
  // 创建一个测试的.docx文件内容说明
  console.log('\n📄 测试建议:');
  console.log('1. 创建一个简单的Word文档(.docx)');
  console.log('2. 内容包含一些基本文字，如："这是测试文档内容"');
  console.log('3. 保存为test.docx');
  console.log('4. 在浏览器中上传这个文件');
  console.log('5. 观察控制台日志中mammoth的解析结果');
  
  console.log('\n🔧 如果mammoth解析失败:');
  console.log('- 检查.docx文件是否损坏');
  console.log('- 尝试使用更简单的Word文档');
  console.log('- 检查mammoth版本是否兼容');
  
  console.log('\n📋 预期的日志应该显示:');
  console.log('🔍 UploadArea 文件解析完成: { contentLength: >0, contentPreview: "..." }');
  
} catch (error) {
  console.log('❌ mammoth库未安装或安装失败');
  console.log('错误:', error.message);
  console.log('\n🔧 解决方案:');
  console.log('运行: npm install mammoth');
}

// 检查项目依赖
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  console.log('\n📦 项目依赖检查:');
  if (packageJson.dependencies && packageJson.dependencies.mammoth) {
    console.log(`✅ mammoth版本: ${packageJson.dependencies.mammoth}`);
  } else {
    console.log('❌ mammoth未在dependencies中找到');
  }
  
  if (packageJson.devDependencies && packageJson.devDependencies.mammoth) {
    console.log(`✅ mammoth开发版本: ${packageJson.devDependencies.mammoth}`);
  }
}

console.log('\n🚀 建议测试流程:');
console.log('1. 先测试.txt文件上传（排除mammoth问题）');
console.log('2. 再测试.docx文件上传（验证mammoth解析）');
console.log('3. 对比两种文件的控制台日志差异');
console.log('4. 如果.txt正常但.docx异常，则是mammoth问题');
console.log('5. 如果两种都异常，则是其他问题');