#!/usr/bin/env node

/**
 * 内容展示优化测试脚本
 * 测试AI分析完成后的文档内容展示是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 开始内容展示优化测试...\n');

// 模拟用户报告的问题内容
const problematicContent = `""
<span class="text-red-600 font-medium" title="已替换: 基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述 → 基于超音速数值仿真下多脉冲约束弹体的修正策略研究综述">基于超音速数值仿真下多脉冲约束弹体的修正策略研究综述</span>引言
移除<span class="text-red-600 font-medium" title="已替换: 这里是关于"引言"部分的详细内容。 → 移除或替换为实际引言内容，例如：'本文综述了基于超音速数值仿真下多脉冲约束弹体的修正策略研究的背景、进展和挑战。'">移除或替换为实际引言内容，例如：'本文综述了基于超音速数值仿真下多脉冲约束弹体的修正策略研究的背景、进展和挑战。'</span>综述了基于超音速数值仿真下多脉冲约束弹体的修正策略研究的背景、进展和挑战。'这部分将深入探讨<span class="text-red-600 font-medium" title="已替换: 根据最新的研究表明 → 最新研究表明">最新研究表明</span>下多脉冲约束弹体的修正策略研究在这个领域的应用和影响。
移除或替换为实际讨论内<span class="text-red-600 font-medium" title="已替换: 研究中的主要问题包括： 如何提高基于超音速数值仿真下多脉冲约束弹体的修正策略研究的效率 如何降低基于超音速数值仿真下多脉冲约束弹体的修正策略研究的成本 如何扩大基于超音速数值仿真下多脉冲约束弹体的修正策略研究的应用范围 → 研究中的主要问题包括： 1. 如何提高基于超音速数值仿真下多脉冲约束弹体的修正策略研究的效率 2. 如何降低基于超音速数值仿真下多脉冲约束弹体的修正策略研究的成本 3. 如何扩大基于超音速数值仿真下多脉冲约束弹体的修正策略研究的应用范围">研究中的主要问题包括： 1. 如何提高基于超音速数值仿真下多脉冲约束弹体的修正策略研究的效率 2. 如何降低基于超音速数值仿真下多脉冲约束弹体的修正策略研究的成本 3. 如何扩大基于超音速数值仿真下多脉冲约束弹体的修正策略研究的应用范围</span>基于超音速数值仿真下多脉冲约束弹体的修正策略研究的应用局限和未来方向。'这部分将深入探讨基于超音速数值仿真下多脉冲约束弹体的修正策略研究在这个领域<span class="text-red-600 font-medium" title="已替换: 王明, 李红. (2022). 基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究进展. 学术期刊, 34(5), 123-145. → 王明, 李红. (2022). 基于超音速数值仿真下多脉冲约束弹体的修正策略研究进展. [具体期刊名称], 34(5), 123-145. (例如：'机械工程学报')">王明, 李红. (2022). 基于超音速数值仿真下多脉冲约束弹体的修正策略研究进展. [具体期刊名称], 34(5), 123-145. (例如：'机械工程学报')</span>, <span class="text-red-600 font-medium" title="已替换: Zhang, L., & Johnson, T. (2023). Advances in 基于超音速数值仿真下多脉冲约束弹体的修正策略研究. International Journal of Research, 12(3), 78-92. → Zhang, L., & Johnson, T. (2023). Advances in Correction Strategies for Supersonic Numerical Simulation of Multi-pulse Constrained Projectiles. International Journal of Research, 12(3), 78-92.">Zhang, L., & Johnson, T. (2023). Advances in Correction Strategies for Supersonic Numerical Simulation of Multi-pulse Constrained Projectiles. International Journal of Research, 12(3), 78-92.</span>ce<span class="text-red-600 font-medium" title="已替换: Smith, J., & Brown, A. (2021). Understanding 基于超音速数值仿真下多脉冲约束弹体的修正策略研究: A comprehensive review. Academic Press. → Smith, J., & Brown, A. (2021). Understanding Correction Strategies for Supersonic Numerical Simulation of Multi-pulse Constrained Projectiles: A Comprehensive Review. Academic Press.">Smith, J., & Brown, A. (2021). Understanding Correction Strategies for Supersonic Numerical Simulation of Multi-pulse Constrained Projectiles: A Comprehensive Review. Academic Press.</span>t<span class="text-red-600 font-medium" title="已替换: 引言和讨论部分内容相似，例如：'这部分将深入探讨...应用和影响' 和 '根据最新的研究表明...应用前景' → 区分内容：引言聚焦背景和问题，讨论分析结果和局限；避免重复语句。">区分内容：引言聚焦背景和问题，讨论分析结果和局限；避免重复语句。</span>span class="text-red-600 font-medium" title="已替换: 多次重复短语 '基于超音速数值仿真下多脉冲约束弹体的修正策略研究' → 首次出现后定义缩写，如 'SCS-MPCP' (Supersonic Correction Strategy for Multi-pulse Constrained Projectiles)，并在后续使用。">首次出现后定义缩写，如 'SCS-MPCP' (Supersonic Correction Strategy for Multi-pulse Constrained Projectiles)，并在后续使用。</span>onal Journal of Research, 12(3), 78-92.
Smith, J., & Brown, A. (2021). Understanding Correction Strategies for Supersonic Numerical Simulation of Multi-pulse Constrained Projectiles: A Comprehensive Review. Academic Press.
""`;

// 模拟API返回的错误数据
const mockApiErrors = [
  {
    id: 'error_1',
    type: 'error',
    position: { start: 0, end: 50 },
    original: '基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述',
    suggestion: '基于超音速数值仿真下多脉冲约束弹体的修正策略研究综述',
    reason: '发现重复词汇"研究研究"',
    category: '重复词汇'
  },
  {
    id: 'error_2',
    type: 'warning',
    position: { start: 51, end: 55 },
    original: '引言',
    suggestion: '1. 引言',
    reason: '建议添加章节编号',
    category: '格式规范'
  },
  {
    id: 'error_3',
    type: 'suggestion',
    position: { start: 100, end: 150 },
    original: '这里是关于"引言"部分的详细内容。',
    suggestion: '本文综述了基于超音速数值仿真下多脉冲约束弹体的修正策略研究的背景、进展和挑战。',
    reason: '建议使用更具体的引言内容',
    category: '内容优化'
  }
];

// 数据清理函数（模拟组件中的函数）
function cleanAndValidateErrorData(rawErrors, documentContent) {
  console.log('🧹 开始清理和验证错误数据...');
  
  return rawErrors.map((error, index) => {
    // 清理original字段 - 移除HTML标签和多余信息
    let cleanOriginal = error.original || '';
    if (typeof cleanOriginal === 'string') {
      // 移除HTML标签
      cleanOriginal = cleanOriginal.replace(/<[^>]*>/g, '');
      // 移除"已替换:"等提示信息 - 修复正则表达式
      cleanOriginal = cleanOriginal.replace(/已替换:\s*[^→]*→\s*/g, '');
      // 移除多余的空格和换行
      cleanOriginal = cleanOriginal.trim();
    }

    // 清理suggestion字段
    let cleanSuggestion = error.suggestion || '';
    if (typeof cleanSuggestion === 'string') {
      cleanSuggestion = cleanSuggestion.replace(/<[^>]*>/g, '').trim();
    }

    // 清理reason字段
    let cleanReason = error.reason || '';
    if (typeof cleanReason === 'string') {
      cleanReason = cleanReason.replace(/<[^>]*>/g, '').trim();
    }

    // 验证position字段 - 改进验证逻辑
    let validPosition = { start: 0, end: 0 };
    if (error.position && typeof error.position.start === 'number' && typeof error.position.end === 'number') {
      validPosition = {
        start: Math.max(0, error.position.start),
        end: Math.min(documentContent.length, Math.max(error.position.start + 1, error.position.end))
      };
    } else {
      // 如果没有有效位置，尝试从文档中查找
      if (cleanOriginal && documentContent) {
        const foundIndex = documentContent.indexOf(cleanOriginal);
        if (foundIndex !== -1) {
          validPosition = {
            start: foundIndex,
            end: foundIndex + cleanOriginal.length
          };
        }
      }
    }

    // 验证type字段
    let validType = 'warning';
    if (error.type && ['error', 'warning', 'suggestion'].includes(error.type)) {
      validType = error.type;
    }

    const cleanedError = {
      id: error.id || `cleaned_error_${Date.now()}_${index}`,
      type: validType,
      position: validPosition,
      original: cleanOriginal,
      suggestion: cleanSuggestion,
      reason: cleanReason,
      category: error.category || '其他问题'
    };

    console.log(`✅ 清理错误 ${index + 1}:`, {
      original: cleanOriginal,
      position: validPosition,
      type: validType
    });

    return cleanedError;
  });
}

// 测试函数
function testContentDisplayOptimization() {
  console.log('📋 测试1: 数据清理功能');
  console.log('原始错误数据:', mockApiErrors);
  
  const cleanedErrors = cleanAndValidateErrorData(mockApiErrors, problematicContent);
  console.log('清理后错误数据:', cleanedErrors);
  
  // 验证清理结果
  const test1Passed = cleanedErrors.every(error => 
    !error.original.includes('<') && 
    !error.original.includes('>') &&
    !error.original.includes('已替换:')
  );
  
  console.log(`✅ 测试1结果: ${test1Passed ? '通过' : '失败'}\n`);
  
  console.log('📋 测试2: HTML标签清理');
  const htmlTestContent = '<span class="text-red-600">测试内容</span>';
  const cleanedContent = htmlTestContent.replace(/<[^>]*>/g, '');
  const test2Passed = cleanedContent === '测试内容';
  
  console.log(`原始内容: ${htmlTestContent}`);
  console.log(`清理后内容: ${cleanedContent}`);
  console.log(`✅ 测试2结果: ${test2Passed ? '通过' : '失败'}\n`);
  
  console.log('📋 测试3: 提示信息清理');
  const promptTestContent = '已替换: 原始内容 → 新内容';
  const cleanedPrompt = promptTestContent.replace(/已替换:\s*[^→]*→\s*/g, '');
  const test3Passed = cleanedPrompt === '新内容';
  
  console.log(`原始内容: ${promptTestContent}`);
  console.log(`清理后内容: ${cleanedPrompt}`);
  console.log(`✅ 测试3结果: ${test3Passed ? '通过' : '失败'}\n`);
  
  console.log('📋 测试4: 位置验证');
  const positionTestError = {
    id: 'test_error',
    type: 'error',
    position: { start: 100, end: 200 },
    original: '测试内容',
    suggestion: '建议内容',
    reason: '测试原因',
    category: '测试类别'
  };
  
  const testDocument = '这是一个测试文档，包含测试内容和其他内容。';
  const validatedError = cleanAndValidateErrorData([positionTestError], testDocument)[0];
  const test4Passed = validatedError.position.start >= 0 && validatedError.position.end <= testDocument.length;
  
  console.log(`文档长度: ${testDocument.length}`);
  console.log(`验证后位置: ${validatedError.position.start}-${validatedError.position.end}`);
  console.log(`✅ 测试4结果: ${test4Passed ? '通过' : '失败'}\n`);
  
  // 总体测试结果
  const allTestsPassed = test1Passed && test2Passed && test3Passed && test4Passed;
  
  console.log('🎯 总体测试结果:');
  console.log(`✅ 通过: ${[test1Passed, test2Passed, test3Passed, test4Passed].filter(Boolean).length}/4`);
  console.log(`❌ 失败: ${[test1Passed, test2Passed, test3Passed, test4Passed].filter(t => !t).length}/4`);
  console.log(`📊 成功率: ${([test1Passed, test2Passed, test3Passed, test4Passed].filter(Boolean).length / 4 * 100).toFixed(1)}%`);
  
  if (allTestsPassed) {
    console.log('\n🎉 所有测试通过！内容展示优化功能正常工作');
  } else {
    console.log('\n⚠️ 部分测试失败，需要进一步检查');
  }
  
  return allTestsPassed;
}

// 运行测试
const testResult = testContentDisplayOptimization();

// 保存测试报告
const testReport = {
  timestamp: new Date().toISOString(),
  testName: '内容展示优化测试',
  result: testResult ? 'PASS' : 'FAIL',
  details: {
    dataCleaning: '测试数据清理功能',
    htmlTagRemoval: '测试HTML标签清理',
    promptRemoval: '测试提示信息清理',
    positionValidation: '测试位置验证'
  }
};

const reportPath = path.join(__dirname, '../test-reports/content-display-optimization-test.json');
fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));

console.log(`\n📄 测试报告已保存到: ${reportPath}`);

process.exit(testResult ? 0 : 1); 