/**
 * 修复剩余risks字段缺失问题的脚本
 */

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '../app/api/analyze-document-rag/route.ts');

console.log('🔧 修复剩余的risks字段缺失问题...');

try {
  let content = fs.readFileSync(targetFile, 'utf8');
  
  // 修复应急JSON生成中的错误对象
  const emergencyErrorPattern = `errors: [{
      type: "warning",
      original: "JSON解析失败",
      suggestion: "请检查API响应格式",
      reason: "DeepSeek API返回了无法解析的JSON格式，已使用应急处理",
      category: "系统错误",
      position: { start: 0, end: 100 }
    }]`;
  
  const emergencyErrorReplace = `errors: [{
      type: "warning",
      original: "JSON解析失败",
      suggestion: "请检查API响应格式",
      reason: "DeepSeek API返回了无法解析的JSON格式，已使用应急处理",
      category: "系统错误",
      position: { start: 0, end: 100 },
      risks: "系统自动处理，无明显法律、事实或价值观问题。"
    }]`;
  
  if (content.includes(emergencyErrorPattern)) {
    content = content.replace(emergencyErrorPattern, emergencyErrorReplace);
    console.log('✅ 修复应急JSON生成中的risks字段');
  }
  
  // 修复默认错误对象
  const defaultErrorPattern = `return {
                id: \`repaired_\${Date.now()}_\${index}\`,
                type: 'suggestion',
                position: { start: index * 30, end: (index + 1) * 30 },
                original: '截断恢复的内容',
                suggestion: '建议重新分析此部分内容',
                reason: '从截断的JSON中恢复',
                category: '恢复项'
              };`;
  
  const defaultErrorReplace = `return {
                id: \`repaired_\${Date.now()}_\${index}\`,
                type: 'suggestion',
                position: { start: index * 30, end: (index + 1) * 30 },
                original: '截断恢复的内容',
                suggestion: '建议重新分析此部分内容',
                reason: '从截断的JSON中恢复',
                category: '恢复项',
                risks: '自动恢复内容，无明显法律、事实或价值观问题。'
              };`;
  
  if (content.includes(defaultErrorPattern)) {
    content = content.replace(defaultErrorPattern, defaultErrorReplace);
    console.log('✅ 修复默认错误对象中的risks字段');
  }
  
  // 修复生成应急JSON中的错误项
  const emergencyJsonPattern = `errors: [{
        id: \`emergency_\${Date.now()}\`,
        type: 'warning' as const,
        position: { start: 0, end: 100 },
        original: '文档内容',
        suggestion: 'AI分析正在进行中，请稍后重试或检查网络连接',
        reason: 'DeepSeek API响应格式异常，正在进行格式修复',
        category: 'API状态'
      }]`;
  
  const emergencyJsonReplace = `errors: [{
        id: \`emergency_\${Date.now()}\`,
        type: 'warning' as const,
        position: { start: 0, end: 100 },
        original: '文档内容',
        suggestion: 'AI分析正在进行中，请稍后重试或检查网络连接',
        reason: 'DeepSeek API响应格式异常，正在进行格式修复',
        category: 'API状态',
        risks: '系统状态提示，无明显法律、事实或价值观问题。'
      }]`;
  
  if (content.includes(emergencyJsonPattern)) {
    content = content.replace(emergencyJsonPattern, emergencyJsonReplace);
    console.log('✅ 修复应急JSON中的risks字段');
  }
  
  // 写入修复后的文件
  fs.writeFileSync(targetFile, content);
  
  console.log('🎉 risks字段修复完成！');
  
} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
} 