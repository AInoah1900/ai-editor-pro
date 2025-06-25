#!/usr/bin/env node

/**
 * Token设置优化工具
 * 
 * 这个工具帮助您根据不同使用场景选择最佳的token设置，
 * 平衡响应速度、质量和资源消耗。
 */

const fs = require('fs');
const path = require('path');

// Token设置配置
const TOKEN_PRESETS = {
  'lightning': {
    tokens: 1200,
    name: '闪电模式',
    description: '超快响应，适合快速语法检查',
    useCase: '实时编辑、快速预览',
    avgTime: '12-18s',
    quality: '良好',
    icon: '⚡'
  },
  'fast': {
    tokens: 1800,
    name: '快速模式', 
    description: '快速响应，基础错误检测',
    useCase: '日常编辑、初稿检查',
    avgTime: '18-25s',
    quality: '优良',
    icon: '🚀'
  },
  'balanced': {
    tokens: 3000,
    name: '平衡模式',
    description: '质量和速度的最佳平衡',
    useCase: '学术编辑、正式文档',
    avgTime: '35-45s',
    quality: '优秀',
    icon: '⚖️'
  },
  'thorough': {
    tokens: 4500,
    name: '深度模式',
    description: '深度分析，全面错误检测',
    useCase: '论文终稿、重要文档',
    avgTime: '55-70s',
    quality: '卓越',
    icon: '🔍'
  },
  'comprehensive': {
    tokens: 6000,
    name: '全面模式',
    description: '最详尽分析，适合复杂文档',
    useCase: '长篇论文、技术手册',
    avgTime: '80-100s',
    quality: '完美',
    icon: '📚'
  }
};

// 根据文档特征智能推荐
function getSmartRecommendation(docLength, docType, urgency, domain) {
  let score = {
    lightning: 0,
    fast: 0,
    balanced: 0,
    thorough: 0,
    comprehensive: 0
  };

  // 文档长度权重
  if (docLength < 500) {
    score.lightning += 3;
    score.fast += 2;
  } else if (docLength < 2000) {
    score.fast += 3;
    score.balanced += 2;
  } else if (docLength < 5000) {
    score.balanced += 3;
    score.thorough += 1;
  } else if (docLength < 10000) {
    score.thorough += 3;
    score.comprehensive += 1;
  } else {
    score.comprehensive += 3;
    score.thorough += 2;
  }

  // 文档类型权重
  switch (docType) {
    case 'draft':
      score.lightning += 2;
      score.fast += 3;
      break;
    case 'academic':
      score.balanced += 3;
      score.thorough += 2;
      break;
    case 'final':
      score.thorough += 3;
      score.comprehensive += 2;
      break;
    case 'technical':
      score.comprehensive += 3;
      score.thorough += 1;
      break;
  }

  // 紧急程度权重
  switch (urgency) {
    case 'urgent':
      score.lightning += 3;
      score.fast += 2;
      break;
    case 'normal':
      score.balanced += 2;
      break;
    case 'relaxed':
      score.thorough += 2;
      score.comprehensive += 1;
      break;
  }

  // 专业领域权重
  if (['medical', 'legal', 'scientific'].includes(domain)) {
    score.thorough += 2;
    score.comprehensive += 1;
  }

  // 找出最高分的推荐
  let maxScore = 0;
  let recommendation = 'balanced';
  
  for (const [preset, points] of Object.entries(score)) {
    if (points > maxScore) {
      maxScore = points;
      recommendation = preset;
    }
  }

  return recommendation;
}

// 性能预测
function predictPerformance(tokens, docLength) {
  const baseTime = Math.max(10, docLength / 100); // 基础处理时间
  const tokenFactor = tokens / 1000; // token因子
  const complexity = Math.log(docLength + 1) / Math.log(10); // 复杂度因子
  
  const estimatedTime = Math.round(baseTime * tokenFactor * complexity);
  const memoryUsage = Math.round((tokens * docLength) / 10000); // MB估算
  const qualityScore = Math.min(100, Math.round(60 + (tokens / 100)));
  
  return {
    estimatedTime,
    memoryUsage,
    qualityScore
  };
}

// 显示所有预设
function showAllPresets() {
  console.log('\n📋 可用的Token预设配置:\n');
  
  Object.entries(TOKEN_PRESETS).forEach(([key, preset]) => {
    console.log(`${preset.icon} ${preset.name} (${preset.tokens} tokens)`);
    console.log(`   ${preset.description}`);
    console.log(`   适用: ${preset.useCase}`);
    console.log(`   响应时间: ${preset.avgTime}`);
    console.log(`   质量评级: ${preset.quality}`);
    console.log('');
  });
}

// 智能推荐
function getRecommendation() {
  console.log('\n🤖 智能Token设置推荐\n');
  
  // 模拟用户输入 (实际应用中可以通过命令行参数或交互式输入获取)
  const scenarios = [
    {
      name: "快速语法检查",
      docLength: 800,
      docType: 'draft',
      urgency: 'urgent',
      domain: 'general'
    },
    {
      name: "学术论文编辑",
      docLength: 3500,
      docType: 'academic',
      urgency: 'normal',
      domain: 'scientific'
    },
    {
      name: "技术文档审查",
      docLength: 12000,
      docType: 'technical',
      urgency: 'relaxed',
      domain: 'technical'
    },
    {
      name: "医学论文终稿",
      docLength: 6000,
      docType: 'final',
      urgency: 'relaxed',
      domain: 'medical'
    }
  ];

  scenarios.forEach(scenario => {
    const recommendation = getSmartRecommendation(
      scenario.docLength,
      scenario.docType,
      scenario.urgency,
      scenario.domain
    );
    
    const preset = TOKEN_PRESETS[recommendation];
    const performance = predictPerformance(preset.tokens, scenario.docLength);
    
    console.log(`📝 场景: ${scenario.name}`);
    console.log(`   文档长度: ${scenario.docLength} 字符`);
    console.log(`   推荐设置: ${preset.icon} ${preset.name} (${preset.tokens} tokens)`);
    console.log(`   预计时间: ${performance.estimatedTime}s`);
    console.log(`   质量分数: ${performance.qualityScore}/100`);
    console.log(`   内存使用: ~${performance.memoryUsage}MB`);
    console.log('');
  });
}

// 更新配置文件
function updateConfigFile(presetName) {
  const preset = TOKEN_PRESETS[presetName];
  if (!preset) {
    console.error(`❌ 错误: 预设 "${presetName}" 不存在`);
    return false;
  }

  try {
    const configPath = path.join(__dirname, '../lib/deepseek/deepseek-dual-client.ts');
    let content = fs.readFileSync(configPath, 'utf8');
    
    // 更新默认token值
    content = content.replace(
      /max_tokens: request\.max_tokens \?\? \d+/g,
      `max_tokens: request.max_tokens ?? ${preset.tokens}`
    );
    
    fs.writeFileSync(configPath, content);
    
    console.log(`✅ 已更新Token设置为: ${preset.name} (${preset.tokens} tokens)`);
    console.log(`📊 预期效果: ${preset.description}`);
    
    return true;
  } catch (error) {
    console.error('❌ 更新配置文件失败:', error.message);
    return false;
  }
}

// 性能测试
function performanceTest() {
  console.log('\n🧪 Token设置性能对比测试\n');
  
  const testDoc = {
    short: 500,
    medium: 2500,
    long: 8000
  };
  
  console.log('| 预设模式    | 短文档(500字) | 中文档(2500字) | 长文档(8000字) |');
  console.log('|-------------|---------------|----------------|----------------|');
  
  Object.entries(TOKEN_PRESETS).forEach(([key, preset]) => {
    const shortPerf = predictPerformance(preset.tokens, testDoc.short);
    const mediumPerf = predictPerformance(preset.tokens, testDoc.medium);
    const longPerf = predictPerformance(preset.tokens, testDoc.long);
    
    console.log(`| ${preset.name.padEnd(10)} | ${shortPerf.estimatedTime}s (${shortPerf.qualityScore}%) | ${mediumPerf.estimatedTime}s (${mediumPerf.qualityScore}%) | ${longPerf.estimatedTime}s (${longPerf.qualityScore}%) |`);
  });
  
  console.log('\n💡 提示: 数字格式为 "时间(质量分数)"');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  console.log('🎯 AI Editor Pro - Token优化工具');
  console.log('=====================================');
  
  if (args.length === 0) {
    console.log('\n使用方法:');
    console.log('  node optimize-token-settings.js [命令]');
    console.log('\n可用命令:');
    console.log('  list        - 查看所有可用预设');
    console.log('  recommend   - 获取智能推荐');
    console.log('  test        - 性能对比测试');
    console.log('  set [预设]  - 应用指定预设');
    console.log('\n可用预设: lightning, fast, balanced, thorough, comprehensive');
    console.log('\n示例:');
    console.log('  node optimize-token-settings.js list');
    console.log('  node optimize-token-settings.js set balanced');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'list':
      showAllPresets();
      break;
    case 'recommend':
      getRecommendation();
      break;
    case 'test':
      performanceTest();
      break;
    case 'set':
      if (args[1]) {
        updateConfigFile(args[1]);
      } else {
        console.error('❌ 请指定要应用的预设名称');
      }
      break;
    default:
      console.error(`❌ 未知命令: ${command}`);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  TOKEN_PRESETS,
  getSmartRecommendation,
  predictPerformance,
  updateConfigFile
}; 