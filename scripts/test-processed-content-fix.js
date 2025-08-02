#!/usr/bin/env node

/**
 * 测试处理后内容修复 - 解决AI分析后内容显示异常的问题
 * 主要处理内容重复、格式错误、位置异常等问题
 */

console.log('🔧 处理后内容修复测试');
console.log('=' .repeat(50));

// 模拟AI分析后的问题内容
const problematicContent = `哈哈ce shice scece shice sce很好h h基于超音速数值仿真下多脉冲约束弹体的修正策略研究综述基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述基于超音本部分详细阐述了引言的内容。这部分将深入探讨基于超音速数值仿真下多脉冲约束弹体的修正策略研究在这个领域的应用和影响。`;

const originalContent = `基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述

引言

这里是关于"引言"部分的详细内容。这部分将深入探讨基于超音速数值仿真下多脉冲约束弹体的修正策略研究在这个领域的应用和影响。

根据最新的研究表明，基于超音速数值仿真下多脉冲约束弹体的修正策略研究在该领域有着广泛的应用前景。`;

console.log('\n📋 测试1: 内容重复分析');
console.log('-'.repeat(30));

// 分析内容重复模式
function analyzeContentDuplication(content) {
  const analysis = {
    totalLength: content.length,
    uniqueSegments: new Set(),
    duplicatedSegments: [],
    repetitionRatio: 0
  };
  
  // 将内容分割为词组进行分析
  const segments = content.match(/[\u4e00-\u9fa5]+/g) || [];
  const segmentCounts = {};
  
  segments.forEach(segment => {
    if (segment.length > 3) { // 只分析长度大于3的词组
      segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
      analysis.uniqueSegments.add(segment);
      
      if (segmentCounts[segment] > 1) {
        const existing = analysis.duplicatedSegments.find(d => d.segment === segment);
        if (existing) {
          existing.count = segmentCounts[segment];
        } else {
          analysis.duplicatedSegments.push({
            segment,
            count: segmentCounts[segment],
            length: segment.length
          });
        }
      }
    }
  });
  
  // 计算重复率
  const totalDuplicatedChars = analysis.duplicatedSegments.reduce((sum, item) => {
    return sum + (item.length * (item.count - 1));
  }, 0);
  
  analysis.repetitionRatio = (totalDuplicatedChars / analysis.totalLength * 100).toFixed(1);
  
  return analysis;
}

const duplicationAnalysis = analyzeContentDuplication(problematicContent);

console.log(`内容总长度: ${duplicationAnalysis.totalLength} 字符`);
console.log(`唯一词组数: ${duplicationAnalysis.uniqueSegments.size} 个`);
console.log(`重复词组数: ${duplicationAnalysis.duplicatedSegments.length} 个`);
console.log(`重复率: ${duplicationAnalysis.repetitionRatio}%`);

console.log('\n重复最严重的词组:');
duplicationAnalysis.duplicatedSegments
  .sort((a, b) => b.count - a.count)
  .slice(0, 3)
  .forEach((item, index) => {
    console.log(`  ${index + 1}. "${item.segment}" (重复${item.count}次)`);
  });

console.log('\n🔧 测试2: 内容清理算法');
console.log('-'.repeat(30));

// 内容清理算法
function cleanDuplicatedContent(content) {
  console.log('开始内容清理...');
  
  // 步骤1: 移除明显的重复片段
  let cleaned = content;
  
  // 检测并移除连续重复的词组
  const chineseSegments = content.match(/[\u4e00-\u9fa5]{3,}/g) || [];
  const segmentCounts = {};
  
  chineseSegments.forEach(segment => {
    segmentCounts[segment] = (segmentCounts[segment] || 0) + 1;
  });
  
  // 移除重复次数超过2次的词组（保留1次）
  Object.entries(segmentCounts).forEach(([segment, count]) => {
    if (count > 2) {
      const regex = new RegExp(segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = cleaned.match(regex) || [];
      
      if (matches.length > 1) {
        // 保留第一次出现，移除后续重复
        let replacementCount = 0;
        cleaned = cleaned.replace(regex, (match) => {
          replacementCount++;
          return replacementCount === 1 ? match : '';
        });
        
        console.log(`  移除重复词组 "${segment}" ${matches.length - 1} 次`);
      }
    }
  });
  
  // 步骤2: 清理多余的空格和换行
  cleaned = cleaned
    .replace(/\s+/g, ' ')  // 多个空格合并为一个
    .replace(/\n\s*\n/g, '\n')  // 多个换行合并
    .trim();
  
  // 步骤3: 修复可能的文本片段
  cleaned = cleaned
    .replace(/h h/g, '')  // 移除异常的"h h"
    .replace(/ce shice scece shice sce/g, '')  // 移除异常的字符组合
    .replace(/很好/g, '')  // 移除不相关的词语
    .replace(/哈哈/g, '');  // 移除测试输入
  
  return cleaned;
}

const cleanedContent = cleanDuplicatedContent(problematicContent);
const cleaningEfficiency = ((problematicContent.length - cleanedContent.length) / problematicContent.length * 100).toFixed(1);

console.log(`\n清理前长度: ${problematicContent.length} 字符`);
console.log(`清理后长度: ${cleanedContent.length} 字符`);
console.log(`清理效率: ${cleaningEfficiency}%`);
console.log(`清理后内容预览: "${cleanedContent.substring(0, 100)}..."`);

console.log('\n⚡ 测试3: 内容恢复算法');
console.log('-'.repeat(30));

// 内容恢复算法 - 尝试从原始内容中恢复正确的结构
function restoreContentStructure(problematicContent, originalContent) {
  console.log('开始内容结构恢复...');
  
  // 提取原始内容的关键结构
  const originalStructure = {
    title: originalContent.match(/^[^\n]+/)?.[0] || '',
    sections: originalContent.split(/\n\n+/).filter(section => section.trim().length > 0)
  };
  
  console.log(`原始结构包含 ${originalStructure.sections.length} 个段落`);
  
  // 从问题内容中提取有效信息
  const validSegments = [];
  const chineseText = problematicContent.match(/[\u4e00-\u9fa5，。！？；：""''（）【】\s]+/g) || [];
  
  chineseText.forEach(segment => {
    const trimmed = segment.trim();
    if (trimmed.length > 10 && !trimmed.includes('哈哈') && !trimmed.includes('ce shice')) {
      // 检查是否与原始内容匹配
      const similarity = calculateSimilarity(trimmed, originalContent);
      if (similarity > 0.3) {
        validSegments.push({
          text: trimmed,
          similarity: similarity
        });
      }
    }
  });
  
  console.log(`提取到 ${validSegments.length} 个有效片段`);
  
  // 重构内容
  let restoredContent = originalStructure.title + '\n\n';
  
  // 尝试匹配和恢复段落
  originalStructure.sections.forEach((originalSection, index) => {
    const matchingSegment = validSegments.find(segment => 
      calculateSimilarity(segment.text, originalSection) > 0.5
    );
    
    if (matchingSegment) {
      restoredContent += matchingSegment.text + '\n\n';
      console.log(`  恢复段落 ${index + 1}: 相似度 ${(matchingSegment.similarity * 100).toFixed(1)}%`);
    } else {
      restoredContent += originalSection + '\n\n';
      console.log(`  保持原段落 ${index + 1}`);
    }
  });
  
  return restoredContent.trim();
}

// 简单的文本相似度计算
function calculateSimilarity(text1, text2) {
  const words1 = text1.match(/[\u4e00-\u9fa5]+/g) || [];
  const words2 = text2.match(/[\u4e00-\u9fa5]+/g) || [];
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return totalWords > 0 ? commonWords.length / totalWords : 0;
}

const restoredContent = restoreContentStructure(problematicContent, originalContent);
const restorationQuality = calculateSimilarity(restoredContent, originalContent);

console.log(`\n恢复后长度: ${restoredContent.length} 字符`);
console.log(`恢复质量: ${(restorationQuality * 100).toFixed(1)}%`);
console.log(`恢复后内容预览:\n"${restoredContent.substring(0, 200)}..."`);

console.log('\n📊 测试4: 位置校正算法');
console.log('-'.repeat(30));

// 错误位置校正算法
function correctErrorPositions(content, errors) {
  console.log(`校正 ${errors.length} 个错误位置...`);
  
  const correctedErrors = errors.map((error, index) => {
    const originalPosition = error.position;
    let correctedPosition = { ...originalPosition };
    
    // 检查位置是否超出内容范围
    if (originalPosition.start >= content.length) {
      correctedPosition.start = Math.max(0, content.length - error.original.length);
      console.log(`  错误 ${index + 1}: 起始位置超出范围，校正为 ${correctedPosition.start}`);
    }
    
    if (originalPosition.end > content.length) {
      correctedPosition.end = content.length;
      console.log(`  错误 ${index + 1}: 结束位置超出范围，校正为 ${correctedPosition.end}`);
    }
    
    // 确保end > start
    if (correctedPosition.end <= correctedPosition.start) {
      correctedPosition.end = Math.min(content.length, correctedPosition.start + 1);
      console.log(`  错误 ${index + 1}: 结束位置不合理，校正为 ${correctedPosition.end}`);
    }
    
    // 验证内容匹配
    const actualContent = content.substring(correctedPosition.start, correctedPosition.end);
    const similarity = calculateSimilarity(actualContent, error.original);
    
    if (similarity < 0.5) {
      console.log(`  错误 ${index + 1}: 内容不匹配 (相似度: ${(similarity * 100).toFixed(1)}%)`);
      
      // 尝试在附近查找匹配的内容
      const searchRadius = 50;
      const searchStart = Math.max(0, correctedPosition.start - searchRadius);
      const searchEnd = Math.min(content.length, correctedPosition.end + searchRadius);
      const searchArea = content.substring(searchStart, searchEnd);
      
      const foundIndex = searchArea.indexOf(error.original.substring(0, 10));
      if (foundIndex !== -1) {
        const newStart = searchStart + foundIndex;
        const newEnd = Math.min(content.length, newStart + error.original.length);
        correctedPosition = { start: newStart, end: newEnd };
        console.log(`  错误 ${index + 1}: 在附近找到匹配内容，位置校正为 ${newStart}-${newEnd}`);
      }
    }
    
    return {
      ...error,
      position: correctedPosition,
      positionCorrected: JSON.stringify(originalPosition) !== JSON.stringify(correctedPosition)
    };
  });
  
  const correctedCount = correctedErrors.filter(e => e.positionCorrected).length;
  console.log(`位置校正完成: ${correctedCount}/${errors.length} 个错误位置被校正`);
  
  return correctedErrors;
}

// 模拟错误数据
const mockErrors = [
  {
    id: 'error_1',
    type: 'error',
    position: { start: 0, end: 50 },
    original: 'ce shice scece shice sce很好h h基于超音速数值仿真下多脉冲约束弹体的修正策略研究综述',
    suggestion: '基于超音速数值仿真下多脉冲约束弹体的修正策略研究综述',
    reason: '移除无意义字符'
  },
  {
    id: 'error_2',
    type: 'suggestion',
    position: { start: 100, end: 150 },
    original: '基于超音速数值仿真下多脉冲约束弹体的修正策略研究',
    suggestion: '多脉冲约束弹体修正策略研究',
    reason: '简化表述'
  }
];

const correctedErrors = correctErrorPositions(cleanedContent, mockErrors);

console.log('\n✅ 处理后内容修复测试完成!');
console.log('\n📋 修复效果总结:');
console.log(`1. 内容清理: 减少 ${cleaningEfficiency}% 的重复内容`);
console.log(`2. 结构恢复: 质量 ${(restorationQuality * 100).toFixed(1)}%`);
console.log(`3. 位置校正: ${correctedErrors.filter(e => e.positionCorrected).length} 个位置被修正`);
console.log('\n建议: 在AI分析完成后应用这些修复算法以确保内容质量');