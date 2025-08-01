#!/usr/bin/env node

/**
 * 文档上传调试测试脚本
 * 用于验证文档上传后内容显示问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 文档上传调试测试');
console.log('==================');

// 创建测试文档
const testDocuments = [
  {
    name: 'test-short.txt',
    content: '这是一个测试文档。包含一些基本的文本内容。'
  },
  {
    name: 'test-medium.txt',
    content: `这是一个中等长度的测试文档。

第一段：人工智能技术的发展日新月异，特别是在自然语言处理领域取得了显著的进步。

第二段：深度学习模型如GPT、BERT等的出现，极大地推动了机器理解和生成人类语言的能力。

第三段：这些技术的应用范围越来越广泛，从智能客服到文档编辑，都有着重要的作用。`
  },
  {
    name: 'test-with-errors.txt',
    content: `这是一个包含错误的测试文档。

第一段：人工智能技术的发展发展日新月异，特别是在自然语言处理领域取得了显著的进步进步。

第二段：深度学习模型如GPT、BERT等的出现，极大地推动了机器理解和生成人类语言的能力能力。

第三段：这些技术的应用范围越来越广泛广泛，从智能客服到文档编辑，都有着重要的作用。`
  }
];

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '..', 'test-uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 创建测试文档
testDocuments.forEach(doc => {
  const filePath = path.join(uploadsDir, doc.name);
  fs.writeFileSync(filePath, doc.content, 'utf8');
  console.log(`✅ 创建测试文档: ${doc.name} (${doc.content.length} 字符)`);
});

console.log('\n📋 测试步骤:');
console.log('1. 启动开发服务器: npm run dev');
console.log('2. 访问编辑器页面: http://localhost:3000/editor');
console.log('3. 上传测试文档并观察控制台日志');
console.log('4. 检查文档内容是否正确显示');

console.log('\n🔍 调试要点:');
console.log('- 检查 SubMenu 组件的文件上传日志');
console.log('- 检查 WorkArea 组件的内容传递日志');
console.log('- 检查 RAGEnhancedEditor 组件的初始化日志');
console.log('- 检查 renderDocumentWithInlineCorrections 函数的执行日志');

console.log('\n📁 测试文档位置:', uploadsDir);
console.log('📄 可用测试文档:');
testDocuments.forEach(doc => {
  console.log(`  - ${doc.name}: ${doc.content.length} 字符`);
});

console.log('\n🚀 开始测试！');