#!/usr/bin/env node

/**
 * DeepSeek-R1响应解析测试脚本
 * 测试新的parseDeepSeekR1Response函数是否能正确处理各种响应格式
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 DeepSeek-R1响应解析优化测试');
console.log('=' .repeat(60));

/**
 * 模拟parseDeepSeekR1Response函数（从API路由复制）
 */
function parseDeepSeekR1Response(response) {
  try {
    // 1. 首先尝试直接解析（如果没有think标签）
    const directParse = response.replace(/```json\n?|\n?```/g, '').trim();
    if (directParse.startsWith('{') && directParse.endsWith('}')) {
      return JSON.parse(directParse);
    }

    // 2. 处理包含<think>标签的响应
    // 移除<think>...</think>标签及其内容
    let cleanedResponse = response.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // 3. 提取JSON部分 - 查找花括号包围的内容
    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0].replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonStr);
    }

    // 4. 如果还是找不到JSON，尝试查找errors数组
    const errorsMatch = cleanedResponse.match(/"errors"\s*:\s*\[[\s\S]*?\]/);
    if (errorsMatch) {
      const errorsStr = `{${errorsMatch[0]}}`;
      return JSON.parse(errorsStr);
    }

    // 5. 最后尝试从整个响应中提取任何有效的JSON片段
    const lines = cleanedResponse.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
        try {
          return JSON.parse(trimmedLine);
        } catch {
          continue;
        }
      }
    }

    throw new Error('无法从响应中提取有效的JSON数据');
  } catch (error) {
    console.error('DeepSeek-R1响应解析失败:', error);
    console.log('原始响应预览:', response.substring(0, 500) + '...');
    throw error;
  }
}

/**
 * 测试用例
 */
const testCases = [
  {
    name: '标准JSON响应（无think标签）',
    response: `{
  "errors": [
    {
      "id": "error_1",
      "type": "error",
      "original": "研究研究",
      "suggestion": "研究",
      "reason": "重复词汇",
      "category": "语法错误"
    }
  ]
}`,
    shouldPass: true
  },
  {
    name: '包含think标签的响应',
    response: `<think>
这是一个文档分析任务。我需要仔细检查文档中的错误。
让我分析一下：
1. "研究研究" - 这是一个明显的重复词汇错误
2. 需要修正为"研究"
3. 这属于语法错误类别
</think>

{
  "errors": [
    {
      "id": "error_1", 
      "type": "error",
      "original": "研究研究",
      "suggestion": "研究",
      "reason": "重复词汇",
      "category": "语法错误"
    }
  ]
}`,
    shouldPass: true
  },
  {
    name: '复杂think标签嵌套响应',
    response: `<think>
用户要求我分析文档错误。让我仔细检查：

文档内容："这是一个测试文档，包含重复的的词汇"

分析过程：
1. "重复的的" - 发现重复使用"的"字
2. 这是典型的语法错误
3. 建议修改为"重复的"

我需要按照JSON格式返回结果。
</think>

根据分析，发现以下错误：

{
  "errors": [
    {
      "id": "error_1",
      "type": "error", 
      "original": "的的",
      "suggestion": "的",
      "reason": "重复使用助词",
      "category": "语法错误"
    }
  ]
}`,
    shouldPass: true
  },
  {
    name: 'Markdown代码块包装的JSON',
    response: `<think>
分析文档中的错误...
</think>

\`\`\`json
{
  "errors": [
    {
      "id": "error_1",
      "type": "warning",
      "original": "？。",
      "suggestion": "？",
      "reason": "重复标点符号",
      "category": "标点错误"
    }
  ]
}
\`\`\``,
    shouldPass: true
  },
  {
    name: '仅包含errors数组的响应',
    response: `<think>
让我分析这个文档...
发现了一些问题需要标注。
</think>

"errors": [
  {
    "id": "error_1",
    "type": "suggestion",
    "original": "非常非常好",
    "suggestion": "非常好",
    "reason": "避免重复强调",
    "category": "表达优化"
  }
]`,
    shouldPass: true
  },
  {
    name: '纯文本响应（无JSON）',
    response: `<think>
这个文档看起来没有明显的错误。
内容质量较高，语法正确。
</think>

经过仔细分析，这个文档的质量很好，没有发现明显的错误需要修正。`,
    shouldPass: false
  }
];

/**
 * 运行测试
 */
async function runTests() {
  let passedTests = 0;
  let totalTests = testCases.length;

  console.log(`\n🚀 开始运行 ${totalTests} 个测试用例...\n`);

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`📝 测试 ${i + 1}: ${testCase.name}`);
    
    try {
      const result = parseDeepSeekR1Response(testCase.response);
      
      if (testCase.shouldPass) {
        if (result && result.errors && Array.isArray(result.errors)) {
          console.log(`✅ 通过 - 成功解析 ${result.errors.length} 个错误`);
          console.log(`   示例错误: ${result.errors[0]?.original} → ${result.errors[0]?.suggestion}`);
          passedTests++;
        } else {
          console.log(`❌ 失败 - 解析结果格式不正确`);
          console.log(`   结果:`, result);
        }
      } else {
        console.log(`❌ 意外通过 - 应该解析失败但成功了`);
      }
    } catch (error) {
      if (testCase.shouldPass) {
        console.log(`❌ 失败 - ${error.message}`);
      } else {
        console.log(`✅ 通过 - 正确识别无效响应`);
        passedTests++;
      }
    }
    
    console.log(''); // 空行分隔
  }

  console.log('=' .repeat(60));
  console.log(`📊 测试结果: ${passedTests}/${totalTests} 通过`);
  console.log(`✅ 成功率: ${Math.round(passedTests / totalTests * 100)}%`);

  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过！DeepSeek-R1响应解析优化成功！');
  } else {
    console.log('⚠️  部分测试失败，需要进一步优化');
  }

  return passedTests === totalTests;
}

/**
 * 测试实际API调用
 */
async function testActualAPI() {
  console.log('\n🌐 测试实际API调用...');
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: '这是一个测试文档，包含重复的的词汇和研究研究等问题。还有重复标点？。'
      })
    });

    const result = await response.json();
    
    if (response.ok && result.errors && Array.isArray(result.errors)) {
      console.log(`✅ API调用成功 - 发现 ${result.errors.length} 个错误`);
      
      result.errors.forEach((error, index) => {
        console.log(`   错误 ${index + 1}: "${error.original}" → "${error.suggestion}" (${error.reason})`);
      });
      
      return true;
    } else {
      console.log('❌ API调用失败:', result);
      return false;
    }
  } catch (error) {
    console.log('❌ API调用异常:', error.message);
    return false;
  }
}

/**
 * 生成测试报告
 */
function generateReport(testResults, apiResults) {
  const report = {
    timestamp: new Date().toISOString(),
    testName: 'DeepSeek-R1响应解析优化测试',
    results: {
      unitTests: {
        passed: testResults,
        description: 'parseDeepSeekR1Response函数单元测试'
      },
      apiTests: {
        passed: apiResults,
        description: '实际API调用集成测试'
      }
    },
    summary: {
      allTestsPassed: testResults && apiResults,
      optimizationStatus: testResults && apiResults ? '优化成功' : '需要进一步调整'
    }
  };

  const reportPath = path.join(__dirname, '..', 'test-reports', `deepseek-r1-parsing-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 测试报告已保存: ${reportPath}`);
  return report;
}

/**
 * 主函数
 */
async function main() {
  try {
    // 运行单元测试
    const testResults = await runTests();
    
    // 测试实际API
    const apiResults = await testActualAPI();
    
    // 生成报告
    const report = generateReport(testResults, apiResults);
    
    console.log('\n🏁 测试完成！');
    console.log(`状态: ${report.summary.optimizationStatus}`);
    
    process.exit(testResults && apiResults ? 0 : 1);
  } catch (error) {
    console.error('💥 测试执行失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
} 