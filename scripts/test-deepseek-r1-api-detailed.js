#!/usr/bin/env node

/**
 * DeepSeek-R1 API详细测试脚本
 * 直接测试DeepSeek API调用和响应处理
 */

const fs = require('fs');
const path = require('path');

console.log('🔬 DeepSeek-R1 API详细测试');
console.log('=' .repeat(60));

/**
 * 直接调用DeepSeek双客户端进行测试
 */
async function testDeepSeekAPI() {
  console.log('\n🚀 开始测试DeepSeek API调用...');
  
  try {
    // 导入DeepSeek客户端
    const { getDualDeepSeekClient } = require('../lib/deepseek/deepseek-dual-client');
    const dualClient = getDualDeepSeekClient(true);
    
    // 获取当前提供商
    const currentProvider = dualClient.getCurrentProvider();
    console.log(`📍 当前提供商: ${currentProvider}`);
    
    // 测试内容
    const testContent = '这是一个测试文档，包含重复的的词汇和研究研究等问题。还有重复标点？。';
    
    // 优化的提示词
    const prompt = `请作为专业期刊编辑，对文档进行精确校对分析。

**重要指令**：
1. 禁止输出推理过程和解释
2. 直接返回JSON格式结果
3. 不要使用markdown代码块包装
4. 只标注具体错误词汇，不标注整句

**检查重点**：
- 重复词汇（如"研究研究"→"研究"）
- 重复标点（如"？。"→"？"）  
- 语法错误和用词不当

**输出格式**（严格遵循）：
{
  "errors": [
    {
      "id": "error_1",
      "type": "error",
      "original": "确切错误文字",
      "suggestion": "修改建议", 
      "reason": "简短原因",
      "category": "错误类别"
    }
  ]
}

**待分析文档**：
${testContent}

**输出要求**：直接返回JSON，无其他内容。`;

    console.log('\n📝 发送请求到DeepSeek API...');
    console.log(`📄 文档内容: ${testContent}`);
    console.log(`🎯 提供商: ${currentProvider}`);
    
    const startTime = Date.now();
    
    const response = await dualClient.createChatCompletion({
      messages: [
        {
          role: 'system',
          content: '你是专业期刊编辑。严格按要求返回JSON格式结果，禁止输出推理过程或解释。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.05,
      max_tokens: 2000,
      stream: false
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`\n⏱️  API调用耗时: ${duration}ms`);
    console.log(`🔄 使用的提供商: ${response.provider || '未知'}`);
    
    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      console.log('❌ API返回空响应');
      return false;
    }
    
    console.log(`\n📊 响应统计:`);
    console.log(`   长度: ${aiResponse.length} 字符`);
    console.log(`   包含<think>标签: ${aiResponse.includes('<think>') ? '是' : '否'}`);
    console.log(`   包含JSON: ${aiResponse.includes('{') && aiResponse.includes('}') ? '是' : '否'}`);
    
    // 显示响应预览
    console.log(`\n📄 响应预览 (前500字符):`);
    console.log('-'.repeat(50));
    console.log(aiResponse.substring(0, 500));
    if (aiResponse.length > 500) {
      console.log('...(截断)');
    }
    console.log('-'.repeat(50));
    
    // 测试解析
    console.log('\n🔍 测试响应解析...');
    try {
      const parsedResult = parseDeepSeekR1Response(aiResponse);
      
      if (parsedResult && parsedResult.errors && Array.isArray(parsedResult.errors)) {
        console.log(`✅ 解析成功 - 发现 ${parsedResult.errors.length} 个错误:`);
        
        parsedResult.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. "${error.original}" → "${error.suggestion}" (${error.reason})`);
        });
        
        return true;
      } else {
        console.log('❌ 解析失败 - 格式不正确');
        console.log('解析结果:', parsedResult);
        return false;
      }
    } catch (parseError) {
      console.log('❌ 解析异常:', parseError.message);
      return false;
    }
    
  } catch (error) {
    console.error('💥 API调用失败:', error.message);
    return false;
  }
}

/**
 * 解析DeepSeek-R1响应（从API路由复制）
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
    throw error;
  }
}

/**
 * 测试不同提供商
 */
async function testBothProviders() {
  console.log('\n🔄 测试不同提供商...');
  
  try {
    const { getDualDeepSeekClient } = require('../lib/deepseek/deepseek-dual-client');
    const dualClient = getDualDeepSeekClient(true);
    
    // 测试本地API
    console.log('\n🏠 测试本地API...');
    const localSuccess = await dualClient.switchProvider('local');
    if (localSuccess) {
      const localResult = await testDeepSeekAPI();
      console.log(`本地API测试结果: ${localResult ? '✅ 成功' : '❌ 失败'}`);
    }
    
    // 测试云端API
    console.log('\n🌐 测试云端API...');
    const cloudSuccess = await dualClient.switchProvider('cloud');
    if (cloudSuccess) {
      const cloudResult = await testDeepSeekAPI();
      console.log(`云端API测试结果: ${cloudResult ? '✅ 成功' : '❌ 失败'}`);
    }
    
  } catch (error) {
    console.error('提供商测试失败:', error);
  }
}

/**
 * 生成测试报告
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    testName: 'DeepSeek-R1 API详细测试',
    results: results,
    summary: {
      totalTests: results.length,
      passedTests: results.filter(r => r.success).length,
      optimizationStatus: results.some(r => r.success) ? '部分成功' : '需要优化'
    }
  };

  const reportPath = path.join(__dirname, '..', 'test-reports', `deepseek-r1-api-detailed-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 详细测试报告已保存: ${reportPath}`);
  return report;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('开始详细测试...\n');
    
    // 单次API测试
    const singleResult = await testDeepSeekAPI();
    
    // 双提供商测试
    await testBothProviders();
    
    // 生成报告
    const results = [
      {
        test: 'single_api_call',
        success: singleResult,
        timestamp: new Date().toISOString()
      }
    ];
    
    const report = generateReport(results);
    
    console.log('\n🏁 测试完成！');
    console.log(`状态: ${report.summary.optimizationStatus}`);
    
    process.exit(singleResult ? 0 : 1);
  } catch (error) {
    console.error('💥 测试执行失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  main();
} 