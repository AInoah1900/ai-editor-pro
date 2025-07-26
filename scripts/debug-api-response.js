/**
 * API响应调试脚本
 * 检查DeepSeek API响应中risks字段的情况
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 开始调试API响应中的risks字段问题...');
console.log('目标: 分析DeepSeek API响应格式和内容');
console.log('时间:', new Date().toLocaleString());
console.log('');

const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testContent: `智能编辑系统测试文档

本系统主要功能包括：文档校对，语法检查、术语统一等。系统采用了先进的技术，能够自动识别错误。

关键技术包括：
- 自然语言处理(NLP)
- 机器学习(ML)  
- 知识图谱技术`
};

/**
 * 调试API响应详情
 */
async function debugAPIResponse() {
  console.log('📡 发送API请求进行调试...');
  console.log('测试内容长度:', TEST_CONFIG.testContent.length);
  console.log('');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/analyze-document-rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: TEST_CONFIG.testContent,
        ownerId: 'debug_user'
      })
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log(`⏱️  API响应时间: ${duration}ms`);
    console.log(`🎯 识别领域: ${result.domain_info?.domain} (置信度: ${result.domain_info?.confidence})`);
    console.log(`📊 返回错误数: ${result.errors?.length || 0}`);
    console.log(`📚 知识库使用: ${result.knowledge_used?.length || 0} 条`);
    console.log(`🔄 是否降级: ${result.fallback_used ? '是' : '否'}`);
    console.log('');
    
    // 详细分析每个错误项
    if (result.errors && result.errors.length > 0) {
      console.log('🔍 错误项详细分析:');
      console.log('=' .repeat(80));
      
      result.errors.forEach((error, index) => {
        console.log(`\n错误 ${index + 1}:`);
        console.log(`  ID: ${error.id}`);
        console.log(`  类型: ${error.type}`);
        console.log(`  原文: "${error.original}"`);
        console.log(`  建议: "${error.suggestion}"`);
        console.log(`  原因: "${error.reason}"`);
        console.log(`  类别: "${error.category}"`);
        
        // 检查risks字段
        if (error.hasOwnProperty('risks')) {
          console.log(`  🛡️  风险评估: "${error.risks}"`);
        } else {
          console.log(`  ❌ 风险评估: [字段缺失]`);
        }
        
        // 检查position字段
        if (error.position) {
          console.log(`  📍 位置: start=${error.position.start}, end=${error.position.end}`);
        } else {
          console.log(`  📍 位置: [字段缺失]`);
        }
      });
      
      // 统计字段完整性
      console.log('\n📊 字段完整性统计:');
      console.log('=' .repeat(50));
      
      const fieldStats = {
        hasRisks: result.errors.filter(e => e.hasOwnProperty('risks')).length,
        hasPosition: result.errors.filter(e => e.position).length,
        hasOriginal: result.errors.filter(e => e.original).length,
        hasSuggestion: result.errors.filter(e => e.suggestion).length,
        hasReason: result.errors.filter(e => e.reason).length,
        hasCategory: result.errors.filter(e => e.category).length
      };
      
      const totalErrors = result.errors.length;
      
      console.log(`risks字段: ${fieldStats.hasRisks}/${totalErrors} (${Math.round(fieldStats.hasRisks/totalErrors*100)}%)`);
      console.log(`position字段: ${fieldStats.hasPosition}/${totalErrors} (${Math.round(fieldStats.hasPosition/totalErrors*100)}%)`);
      console.log(`original字段: ${fieldStats.hasOriginal}/${totalErrors} (${Math.round(fieldStats.hasOriginal/totalErrors*100)}%)`);
      console.log(`suggestion字段: ${fieldStats.hasSuggestion}/${totalErrors} (${Math.round(fieldStats.hasSuggestion/totalErrors*100)}%)`);
      console.log(`reason字段: ${fieldStats.hasReason}/${totalErrors} (${Math.round(fieldStats.hasReason/totalErrors*100)}%)`);
      console.log(`category字段: ${fieldStats.hasCategory}/${totalErrors} (${Math.round(fieldStats.hasCategory/totalErrors*100)}%)`);
      
      // 分析可能的问题
      console.log('\n🔧 问题分析:');
      console.log('=' .repeat(50));
      
      if (fieldStats.hasRisks === 0) {
        console.log('❌ 所有错误项都缺少risks字段');
        
        if (result.fallback_used) {
          console.log('   可能原因: 使用了本地分析，但本地函数可能未正确修复');
        } else {
          console.log('   可能原因: DeepSeek API未按提示词要求返回risks字段');
        }
      } else if (fieldStats.hasRisks < totalErrors) {
        console.log('⚠️  部分错误项缺少risks字段');
        console.log('   可能原因: JSON解析过程中部分字段丢失');
      } else {
        console.log('✅ 所有错误项都包含risks字段');
      }
      
      // 检查API提供商
      console.log('\n🔗 API提供商信息:');
      if (result.fallback_used) {
        console.log('📊 使用本地分析（降级模式）');
      } else {
        console.log('🌐 使用DeepSeek API');
      }
    } else {
      console.log('⚠️  API响应中没有错误项');
    }
    
    // 保存原始响应用于进一步分析
    const debugReportPath = path.join(__dirname, '../test-reports/api-response-debug.json');
    const debugReport = {
      timestamp: new Date().toISOString(),
      testContent: TEST_CONFIG.testContent,
      apiResponse: result,
      analysis: {
        duration,
        errorCount: result.errors?.length || 0,
        hasRisksField: result.errors ? result.errors.filter(e => e.hasOwnProperty('risks')).length : 0,
        fallbackUsed: result.fallback_used,
        riskFieldCoverage: result.errors && result.errors.length > 0 ? 
          Math.round((result.errors.filter(e => e.hasOwnProperty('risks')).length / result.errors.length) * 100) : 0
      }
    };
    
    try {
      if (!fs.existsSync(path.dirname(debugReportPath))) {
        fs.mkdirSync(path.dirname(debugReportPath), { recursive: true });
      }
      fs.writeFileSync(debugReportPath, JSON.stringify(debugReport, null, 2));
      console.log(`\n📄 调试报告已保存: ${debugReportPath}`);
    } catch (error) {
      console.log(`⚠️  保存调试报告失败: ${error.message}`);
    }
    
    return {
      success: true,
      hasRisksField: result.errors ? result.errors.some(e => e.hasOwnProperty('risks')) : false,
      fallbackUsed: result.fallback_used,
      errorCount: result.errors?.length || 0
    };
    
  } catch (error) {
    console.error(`❌ API调试失败:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 检查本地分析函数是否正确修复
 */
function checkLocalAnalysisFix() {
  console.log('\n🔍 检查本地分析函数修复情况...');
  console.log('=' .repeat(60));
  
  try {
    const routeFilePath = path.join(__dirname, '../app/api/analyze-document-rag/route.ts');
    const content = fs.readFileSync(routeFilePath, 'utf8');
    
    // 检查各个函数中的risks字段
    const risksPatterns = [
      /risks:\s*['"]/g,
      /risks["']?\s*:/g
    ];
    
    let totalRisksFields = 0;
    risksPatterns.forEach(pattern => {
      const matches = content.match(pattern) || [];
      totalRisksFields += matches.length;
    });
    
    console.log(`📊 发现risks字段定义: ${totalRisksFields} 个`);
    
    // 检查具体函数
    const functions = [
      'generateBasicErrors',
      'checkTerminologyWithKnowledge', 
      'checkDomainSpecificIssues'
    ];
    
    functions.forEach(funcName => {
      const funcPattern = new RegExp(`function\\s+${funcName}[\\s\\S]*?return\\s+errors;`, 'g');
      const funcMatch = content.match(funcPattern);
      
      if (funcMatch) {
        const funcContent = funcMatch[0];
        const hasRisks = /risks:\s*['"]/.test(funcContent);
        console.log(`${hasRisks ? '✅' : '❌'} ${funcName}: ${hasRisks ? '包含risks字段' : '缺少risks字段'}`);
      } else {
        console.log(`⚠️  ${funcName}: 函数未找到`);
      }
    });
    
    return totalRisksFields > 0;
    
  } catch (error) {
    console.error('❌ 检查本地函数失败:', error.message);
    return false;
  }
}

/**
 * 主调试函数
 */
async function runAPIResponseDebug() {
  // 1. 检查本地分析函数修复情况
  const localFixOK = checkLocalAnalysisFix();
  
  // 2. 调试API响应
  const apiResult = await debugAPIResponse();
  
  // 3. 生成综合分析
  console.log('\n🎯 综合分析结果:');
  console.log('=' .repeat(70));
  
  if (!apiResult.success) {
    console.log('❌ API调用失败，无法进行完整分析');
    return false;
  }
  
  console.log(`本地函数修复: ${localFixOK ? '✅ 已修复' : '❌ 未修复'}`);
  console.log(`API响应成功: ${apiResult.success ? '✅ 成功' : '❌ 失败'}`);
  console.log(`使用降级模式: ${apiResult.fallbackUsed ? '✅ 是' : '❌ 否'}`);
  console.log(`包含risks字段: ${apiResult.hasRisksField ? '✅ 是' : '❌ 否'}`);
  console.log(`错误项数量: ${apiResult.errorCount} 个`);
  
  // 4. 提供解决方案建议
  console.log('\n💡 解决方案建议:');
  console.log('=' .repeat(50));
  
  if (!apiResult.hasRisksField) {
    if (apiResult.fallbackUsed) {
      if (localFixOK) {
        console.log('🔧 本地函数已修复但仍无risks字段，可能是：');
        console.log('   1. 函数调用路径有问题');
        console.log('   2. 错误对象创建过程中risks字段被覆盖');
        console.log('   3. JSON序列化过程中丢失字段');
      } else {
        console.log('🔧 本地函数未正确修复，需要重新修复');
      }
    } else {
      console.log('🔧 DeepSeek API未返回risks字段，可能需要：');
      console.log('   1. 优化提示词中对risks字段的要求');
      console.log('   2. 在JSON解析后手动添加risks字段');
      console.log('   3. 强制使用本地分析模式');
    }
  } else {
    console.log('✅ risks字段工作正常');
  }
  
  return apiResult.hasRisksField;
}

// 执行调试
if (require.main === module) {
  runAPIResponseDebug()
    .then(success => {
      console.log(`\n🏁 API响应调试完成 - ${success ? 'risks字段正常' : 'risks字段有问题'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 调试过程出错:', error);
      process.exit(1);
    });
}

module.exports = { runAPIResponseDebug }; 