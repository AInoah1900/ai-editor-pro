/**
 * 学术期刊编辑提示词优化验证脚本
 * 测试优化后的提示词在实际文档分析中的表现
 */

const fs = require('fs');
const path = require('path');

console.log('🔬 开始验证学术期刊编辑提示词优化效果...');
console.log('目标: 测试新的专业编辑加工提示词的性能和准确性');
console.log('时间:', new Date().toLocaleString());
console.log('');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testDocuments: [
    {
      name: '学术论文样本',
      content: `基于超音速数值仿真下多脉冲约束弹体的修正策略研究综述

摘要：本文主要研究了在超音速飞行条件下，多脉冲约束条件对弹体飞行轨迹的影响机制。通过数值仿真方法，分析了不同脉冲序列对弹体修正效果的影响。研究结果表明，合理的脉冲序列设计能够显著提高弹体的制导精度和飞行稳定性。
      
1 引言
      
在现代精确制导武器系统中，弹体飞行过程中的轨迹修正是提高命中精度的关键技术之一。随着超音速飞行技术的发展，如何在高速飞行状态下实现有效的轨迹修正成为了研究热点问题。多脉冲约束修正技术作为一种新兴的修正方式，具有响应速度快、修正精度高等优点，在军用和民用领域都有广泛的应用前景。
      
本文将从数值仿真的角度，深入研究多脉冲约束条件下弹体修正策略的优化问题。`,
      domain: 'academic'
    },
    {
      name: '技术文档样本',
      content: `智能编辑系统架构设计与实现

1.系统概述

本系统是基于人工智能技术的智能编辑平台，主要功能包括：文档智能校对，语法检查、术语统一等功能。系统采用了先进的深度学习算法，能够自动识别文档中的各种错误，并提供修改建议。

2.技术架构  

系统采用前后端分离的架构设计，前端使用React框架，后端采用Node.js + Express。数据存储使用PostgreSQL数据库，向量存储使用Qdrant。整个系统部署在Docker容器中，支持水平扩展。

关键技术包括：
- 自然语言处理(NLP)
- 机器学习(ML)  
- 知识图谱技术
- 向量数据库检索`,
      domain: 'technical'
    }
  ]
};

/**
 * 测试单个文档的分析效果
 */
async function testDocumentAnalysis(document) {
  console.log(`\n📄 测试文档: ${document.name}`);
  console.log('=' .repeat(60));
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/analyze-document-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: document.content,
        ownerId: 'test_user'
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    // 分析结果质量
    const analysisResult = analyzePromptEffectiveness(result, document);
    
    console.log(`⏱️  分析耗时: ${duration}ms`);
    console.log(`🎯 识别领域: ${result.domain_info.domain} (置信度: ${result.domain_info.confidence})`);
    console.log(`📊 发现问题: ${result.errors?.length || 0} 个`);
    console.log(`📚 使用知识库: ${result.knowledge_used?.length || 0} 条`);
    console.log(`🔍 知识来源: 专属${result.knowledge_sources?.private_count || 0}条, 共享${result.knowledge_sources?.shared_count || 0}条`);
    
    // 分析错误类型分布
    if (result.errors && result.errors.length > 0) {
      const errorTypes = result.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('📈 错误类型分布:');
      Object.entries(errorTypes).forEach(([type, count]) => {
        const typeLabel = {
          'error': '确定错误',
          'warning': '疑似问题', 
          'suggestion': '优化建议'
        }[type] || type;
        console.log(`   ${typeLabel}: ${count} 个`);
      });
      
      // 检查是否包含risks字段
      const hasRisksField = result.errors.every(error => error.hasOwnProperty('risks'));
      console.log(`🛡️  风险评估字段: ${hasRisksField ? '✅ 已包含' : '❌ 缺失'}`);
      
      // 显示前3个分析结果作为示例
      console.log('\n🔍 分析结果示例:');
      result.errors.slice(0, 3).forEach((error, index) => {
        console.log(`${index + 1}. [${error.type}] ${error.category}`);
        console.log(`   原文: "${error.original}"`);
        console.log(`   建议: "${error.suggestion}"`);
        console.log(`   原因: "${error.reason}"`);
        console.log(`   风险: "${error.risks || '未评估'}"`);
        console.log('');
      });
    }
    
    return {
      success: true,
      duration,
      result,
      analysis: analysisResult
    };
    
  } catch (error) {
    console.error(`❌ 测试失败:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 分析提示词优化效果
 */
function analyzePromptEffectiveness(result, document) {
  const analysis = {
    prompt_quality: 0,
    academic_focus: 0,
    format_compliance: 0,
    risk_assessment: 0,
    knowledge_integration: 0,
    overall_score: 0
  };
  
  // 1. 检查提示词响应质量
  if (result.errors && Array.isArray(result.errors)) {
    analysis.prompt_quality += 20;
    
    // 检查错误项完整性
    const completeErrors = result.errors.filter(error => 
      error.original && error.suggestion && error.reason && error.category
    );
    analysis.prompt_quality += Math.min(20, completeErrors.length * 4);
  }
  
  // 2. 学术专业性评估
  if (result.domain_info && result.domain_info.domain) {
    analysis.academic_focus += 10;
    if (result.domain_info.confidence > 0.7) {
      analysis.academic_focus += 15;
    }
  }
  
  // 检查是否关注学术写作规范
  const academicKeywords = ['学术', '规范', '术语', '格式', '标点', '引用'];
  const academicFocusCount = result.errors?.filter(error => 
    academicKeywords.some(keyword => 
      error.reason.includes(keyword) || error.category.includes(keyword)
    )
  ).length || 0;
  
  analysis.academic_focus += Math.min(15, academicFocusCount * 3);
  
  // 3. 格式规范性评估
  const formatKeywords = ['标点', '格式', '符号', '单位', '编号'];
  const formatFocusCount = result.errors?.filter(error =>
    formatKeywords.some(keyword => error.category.includes(keyword))
  ).length || 0;
  
  analysis.format_compliance = Math.min(40, formatFocusCount * 8);
  
  // 4. 风险评估功能
  const hasRisksField = result.errors?.every(error => error.hasOwnProperty('risks')) || false;
  if (hasRisksField) {
    analysis.risk_assessment += 30;
    
    // 检查风险评估的质量
    const qualityRisks = result.errors?.filter(error => 
      error.risks && error.risks.length > 10
    ).length || 0;
    analysis.risk_assessment += Math.min(10, qualityRisks * 2);
  }
  
  // 5. 知识库集成效果
  if (result.knowledge_used && result.knowledge_used.length > 0) {
    analysis.knowledge_integration += 20;
    
    // 检查知识库应用深度
    const knowledgeBasedErrors = result.errors?.filter(error =>
      error.reason.includes('知识库') || error.reason.includes('专业')
    ).length || 0;
    
    analysis.knowledge_integration += Math.min(20, knowledgeBasedErrors * 4);
  }
  
  // 计算总分
  analysis.overall_score = Math.round(
    (analysis.prompt_quality + analysis.academic_focus + 
     analysis.format_compliance + analysis.risk_assessment + 
     analysis.knowledge_integration) / 5
  );
  
  return analysis;
}

/**
 * 生成优化效果对比报告
 */
function generateOptimizationReport(testResults) {
  console.log('\n📊 学术期刊编辑提示词优化效果评估报告');
  console.log('=' .repeat(80));
  
  const totalTests = testResults.length;
  const successfulTests = testResults.filter(r => r.success).length;
  const successRate = Math.round((successfulTests / totalTests) * 100);
  
  console.log(`\n🎯 基础性能指标:`);
  console.log(`   测试文档数量: ${totalTests} 个`);
  console.log(`   成功分析率: ${successfulTests}/${totalTests} (${successRate}%)`);
  
  if (successfulTests > 0) {
    const avgDuration = Math.round(
      testResults.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / successfulTests
    );
    console.log(`   平均响应时间: ${avgDuration}ms`);
    
    // 分析质量评估
    console.log(`\n📈 提示词优化效果分析:`);
    
    const qualityMetrics = testResults
      .filter(r => r.success && r.analysis)
      .map(r => r.analysis);
    
    if (qualityMetrics.length > 0) {
      const avgScores = {
        prompt_quality: Math.round(qualityMetrics.reduce((sum, m) => sum + m.prompt_quality, 0) / qualityMetrics.length),
        academic_focus: Math.round(qualityMetrics.reduce((sum, m) => sum + m.academic_focus, 0) / qualityMetrics.length),
        format_compliance: Math.round(qualityMetrics.reduce((sum, m) => sum + m.format_compliance, 0) / qualityMetrics.length),
        risk_assessment: Math.round(qualityMetrics.reduce((sum, m) => sum + m.risk_assessment, 0) / qualityMetrics.length),
        knowledge_integration: Math.round(qualityMetrics.reduce((sum, m) => sum + m.knowledge_integration, 0) / qualityMetrics.length),
        overall_score: Math.round(qualityMetrics.reduce((sum, m) => sum + m.overall_score, 0) / qualityMetrics.length)
      };
      
      console.log(`   📝 提示词响应质量: ${avgScores.prompt_quality}/40 分`);
      console.log(`   🎓 学术专业性: ${avgScores.academic_focus}/40 分`);
      console.log(`   📐 格式规范性: ${avgScores.format_compliance}/40 分`);
      console.log(`   🛡️  风险评估功能: ${avgScores.risk_assessment}/40 分`);
      console.log(`   📚 知识库集成: ${avgScores.knowledge_integration}/40 分`);
      console.log(`   🏆 综合评分: ${avgScores.overall_score}/40 分`);
      
      // 优化效果总结
      console.log(`\n✨ 优化成果总结:`);
      
      if (avgScores.overall_score >= 32) {
        console.log(`   🎉 优秀 - 提示词优化效果显著，达到专业期刊编辑标准`);
      } else if (avgScores.overall_score >= 24) {
        console.log(`   👍 良好 - 提示词优化有效，基本符合学术编辑要求`);
      } else if (avgScores.overall_score >= 16) {
        console.log(`   ⚠️  一般 - 提示词有所改进，但仍需进一步优化`);
      } else {
        console.log(`   ❌ 需要改进 - 提示词优化效果不明显，需要重新调整`);
      }
      
      // 具体优化项目效果
      console.log(`\n🔍 各项优化效果分析:`);
      
      if (avgScores.academic_focus >= 30) {
        console.log(`   ✅ 学术专业性提升显著 - 能够准确识别学术写作问题`);
      } else {
        console.log(`   ⚠️  学术专业性有待提升 - 需要加强学术规范识别`);
      }
      
      if (avgScores.format_compliance >= 30) {
        console.log(`   ✅ 格式规范检查优秀 - 符合GB/T等国标要求`);
      } else {
        console.log(`   ⚠️  格式规范检查需加强 - 标点符号和格式问题识别不足`);
      }
      
      if (avgScores.risk_assessment >= 30) {
        console.log(`   ✅ 风险评估功能完善 - 新增risks字段工作正常`);
      } else {
        console.log(`   ⚠️  风险评估功能需完善 - risks字段集成不完整`);
      }
      
      if (avgScores.knowledge_integration >= 30) {
        console.log(`   ✅ 知识库集成优秀 - 能够有效利用专业知识库`);
      } else {
        console.log(`   ⚠️  知识库集成需加强 - 专业知识应用不充分`);
      }
    }
  }
  
  return {
    totalTests,
    successfulTests,
    successRate,
    avgDuration: successfulTests > 0 ? Math.round(testResults.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / successfulTests) : 0
  };
}

/**
 * 主测试函数
 */
async function runPromptOptimizationTest() {
  const testResults = [];
  
  // 测试所有文档
  for (const document of TEST_CONFIG.testDocuments) {
    const result = await testDocumentAnalysis(document);
    testResults.push(result);
    
    // 等待1秒避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 生成报告
  const reportSummary = generateOptimizationReport(testResults);
  
  // 保存详细测试报告
  const reportPath = path.join(__dirname, '../test-reports/prompt-optimization-test.json');
  const detailedReport = {
    timestamp: new Date().toISOString(),
    testConfig: TEST_CONFIG,
    results: testResults,
    summary: reportSummary,
    optimization_features: {
      enhanced_academic_focus: true,
      format_compliance_check: true,
      risk_assessment_integration: true,
      knowledge_base_utilization: true,
      professional_editor_role: true,
      structured_prompt_design: true
    }
  };
  
  try {
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
    console.log(`\n📄 详细测试报告已保存: ${reportPath}`);
  } catch (error) {
    console.log(`⚠️  保存报告失败: ${error.message}`);
  }
  
  return reportSummary.successRate === 100 && reportSummary.avgDuration < 10000;
}

// 执行测试
if (require.main === module) {
  runPromptOptimizationTest()
    .then(success => {
      console.log(`\n🏁 学术期刊编辑提示词优化测试完成 - ${success ? '成功' : '需要进一步优化'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 测试过程出错:', error);
      process.exit(1);
    });
}

module.exports = { runPromptOptimizationTest }; 