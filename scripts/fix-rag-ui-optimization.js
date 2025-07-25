/**
 * RAG UI优化修复脚本
 * 修复移除RAG增强复选框后的剩余isUsingRAG引用问题
 */

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/editor/components/RAGEnhancedEditor.tsx');

console.log('🔧 开始修复RAG UI优化后的剩余问题...');

try {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // 1. 修复条件渲染逻辑 - 移除 isUsingRAG && 检查
  const fixes = [
    // 修复剩余的ragResults检查
    {
      from: /if \(isUsingRAG && ragResults\)/g,
      to: 'if (ragResults)'
    },
    // 修复剩余的条件渲染文本
    {
      from: /\{isUsingRAG \? `✨ 基于RAG知识库分析，发现 \$\{sortedErrors\.length\} 个问题` : `🎯 基础AI分析完成，发现 \$\{sortedErrors\.length\} 个问题`\}/g,
      to: '{`✨ 基于RAG知识库分析，发现 ${sortedErrors.length} 个问题`}'
    },
    // 修复状态显示文本
    {
      from: /\{isAnalyzing \? \(isUsingRAG \? 'AI分析中\.\.\.' : 'AI分析中\.\.\.'\) : \(isUsingRAG \? 'AI分析完成' : 'AI分析完成'\)\}/g,
      to: '{isAnalyzing ? \'AI分析中...\' : \'AI分析完成\'}'
    },
    // 修复按钮文本
    {
      from: /\{isAnalyzing \? '分析中\.\.\.' : \(isUsingRAG \? 'AI分析' : '重新分析'\)\}/g,
      to: '{isAnalyzing ? \'分析中...\' : \'AI分析\'}'
    },
    // 修复使用说明文本
    {
      from: /\{isUsingRAG \? 'RAG增强模式已启用，基于专业知识库提供更精确的纠错建议' : '使用基础AI分析模式'\}/g,
      to: '\'RAG增强模式已启用，基于专业知识库提供更精确的纠错建议\''
    },
    // 修复知识库显示逻辑
    {
      from: /\{isUsingRAG && ragResults && ragResults\.knowledge_used\.length > 0 &&/g,
      to: '{ragResults && ragResults.knowledge_used.length > 0 &&'
    }
  ];
  
  let fixedCount = 0;
  
  fixes.forEach((fix, index) => {
    const beforeCount = (content.match(fix.from) || []).length;
    content = content.replace(fix.from, fix.to);
    const afterCount = (content.match(fix.from) || []).length;
    const currentFixed = beforeCount - afterCount;
    
    if (currentFixed > 0) {
      console.log(`✅ 修复 ${index + 1}: 替换了 ${currentFixed} 处`);
      fixedCount += currentFixed;
    }
  });
  
  // 2. 移除任何剩余的 setIsUsingRAG 引用
  const setUsageCount = (content.match(/setIsUsingRAG/g) || []).length;
  if (setUsageCount > 0) {
    console.log(`⚠️  发现 ${setUsageCount} 个 setIsUsingRAG 引用需要手动检查`);
  }
  
  // 3. 写入修复后的文件
  fs.writeFileSync(targetFile, content);
  
  console.log(`\n📊 修复完成统计:`);
  console.log(`   总计修复: ${fixedCount} 处`);
  console.log(`   目标文件: ${targetFile}`);
  
  // 4. 验证修复结果
  const remainingIssues = (content.match(/isUsingRAG/g) || []).length;
  if (remainingIssues === 0) {
    console.log(`✅ 所有 isUsingRAG 引用已清理完成`);
  } else {
    console.log(`⚠️  仍有 ${remainingIssues} 个 isUsingRAG 引用需要进一步检查`);
    
    // 显示剩余引用的行号
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('isUsingRAG')) {
        console.log(`     第 ${index + 1} 行: ${line.trim()}`);
      }
    });
  }
  
  console.log(`\n🎉 RAG UI优化修复完成！`);
  console.log(`💡 建议操作:`);
  console.log(`   1. 检查修复后的文件是否编译正常`);
  console.log(`   2. 测试前端界面的RAG增强显示`);
  console.log(`   3. 验证所有功能是否正常工作`);
  
} catch (error) {
  console.error('❌ 修复过程出错:', error.message);
  process.exit(1);
} 