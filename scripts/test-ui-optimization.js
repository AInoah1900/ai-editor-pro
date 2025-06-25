#!/usr/bin/env node

/**
 * AI Editor Pro - 界面优化测试脚本
 * 测试顶部数据显示修复和界面简化效果
 */

const fs = require('fs');
const path = require('path');

console.log('🎯 AI Editor Pro - 界面优化测试');
console.log('=' .repeat(50));

// 读取组件文件
const componentPath = path.join(__dirname, '../app/editor/components/RAGEnhancedEditor.tsx');
const componentContent = fs.readFileSync(componentPath, 'utf8');

// 测试项目
const tests = [
  {
    name: '顶部domain_info.confidence显示修复',
    test: () => {
      const hasCorrectConfidence = componentContent.includes('Math.round((ragResults.domain_info.confidence || 0) * 100)');
      return hasCorrectConfidence;
    }
  },
  {
    name: 'RAG置信度显示修复',  
    test: () => {
      const hasCorrectRAGConfidence = componentContent.includes('Math.round((ragResults.rag_confidence || 0) * 100)');
      return hasCorrectRAGConfidence;
    }
  },
  {
    name: '使用说明栏添加文档统计',
    test: () => {
      const hasDocStats = componentContent.includes('原文: <strong>{content.length}</strong> 字符') &&
                         componentContent.includes('当前: <strong>{documentContent.length}</strong> 字符');
      return hasDocStats;
    }
  },
  {
    name: '删除重复的文档状态栏',
    test: () => {
      const statusBarCount = (componentContent.match(/📊 文档状态/g) || []).length;
      return statusBarCount === 0;
    }
  },
  {
    name: '删除重复的AI编辑加工完成',
    test: () => {
      const analysisCompleteCount = (componentContent.match(/AI编辑加工完成/g) || []).length;
      return analysisCompleteCount <= 1;
    }
  },
  {
    name: '删除重复的操作说明',
    test: () => {
      const operationGuideCount = (componentContent.match(/操作说明：/g) || []).length;
      return operationGuideCount <= 1;
    }
  },
  {
    name: '界面结构简化',
    test: () => {
      const hasSimplifiedStructure = !componentContent.includes('完整文档内容（{documentContent.length} 字符）');
      return hasSimplifiedStructure;
    }
  }
];

// 执行测试
console.log('\n📋 测试结果:');
let passedTests = 0;

tests.forEach((test, index) => {
  try {
    const result = test.test();
    const status = result ? '✅ 通过' : '❌ 失败';
    console.log(`${index + 1}. ${test.name}: ${status}`);
    if (result) passedTests++;
  } catch (error) {
    console.log(`${index + 1}. ${test.name}: ❌ 错误 - ${error.message}`);
  }
});

// 总结
console.log('\n' + '='.repeat(50));
console.log(`�� 总体结果: ${passedTests}/${tests.length} 通过`);

if (passedTests === tests.length) {
  console.log('🎉 所有优化项目都已完成！界面优化成功！');
} else {
  console.log('⚠️ 部分优化项目需要进一步完善');
}

console.log('\n✨ 界面优化测试完成！');
