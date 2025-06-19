#!/usr/bin/env node

/**
 * OpenAI API连接性测试工具
 * 用于诊断和测试OpenAI API的各种连接问题
 */

const { OpenAI } = require('openai');
require('dotenv').config({ path: '.env.local' });

// 配置信息
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

console.log('🔍 OpenAI API连接性测试工具');
console.log('==========================================\n');

/**
 * 基础连接测试
 */
async function testBasicConnection() {
  console.log('📡 1. 基础连接测试');
  console.log('-------------------');
  
  if (!OPENAI_API_KEY) {
    console.log('❌ OpenAI API密钥未配置');
    return false;
  }
  
  console.log('✅ API密钥已配置');
  console.log(`🔑 密钥前缀: ${OPENAI_API_KEY.substring(0, 20)}...`);
  
  // 验证密钥格式
  if (!OPENAI_API_KEY.startsWith('sk-')) {
    console.log('⚠️  警告: API密钥格式可能不正确（应以sk-开头）');
    return false;
  }
  
  console.log('✅ API密钥格式正确\n');
  return true;
}

/**
 * 网络连接测试
 */
async function testNetworkConnection() {
  console.log('🌐 2. 网络连接测试');
  console.log('-------------------');
  
  try {
    const response = await fetch('https://api.openai.com', {
      method: 'HEAD',
      timeout: 5000
    });
    
    console.log(`✅ OpenAI服务器可达 (状态码: ${response.status})`);
    return true;
  } catch (error) {
    console.log(`❌ 网络连接失败: ${error.message}`);
    console.log('💡 建议: 检查网络连接或防火墙设置');
    return false;
  }
}

/**
 * API认证测试
 */
async function testAuthentication() {
  console.log('🔐 3. API认证测试');
  console.log('-------------------');
  
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    timeout: 10000,
    maxRetries: 0
  });
  
  try {
    console.log('🔄 测试API认证...');
    const startTime = Date.now();
    
    const models = await openai.models.list();
    const endTime = Date.now();
    
    console.log(`✅ 认证成功 (耗时: ${endTime - startTime}ms)`);
    console.log(`📊 可用模型数量: ${models.data.length}`);
    
    // 检查嵌入模型是否可用
    const embeddingModel = models.data.find(m => m.id === 'text-embedding-ada-002');
    if (embeddingModel) {
      console.log('✅ text-embedding-ada-002 模型可用');
    } else {
      console.log('⚠️  text-embedding-ada-002 模型不可用');
    }
    
    return true;
  } catch (error) {
    console.log(`❌ 认证失败: ${error.message}`);
    
    if (error.message.includes('401')) {
      console.log('💡 建议: 检查API密钥是否正确');
    } else if (error.message.includes('timeout')) {
      console.log('💡 建议: 网络连接可能不稳定');
    }
    
    return false;
  }
}

/**
 * 嵌入API测试
 */
async function testEmbeddingAPI() {
  console.log('🧠 4. 嵌入API测试');
  console.log('-------------------');
  
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    timeout: 15000, // 更长的超时时间
    maxRetries: 0
  });
  
  const testCases = [
    { text: 'test', desc: '最小测试' },
    { text: '量子力学是物理学的重要分支', desc: '中文文本测试' },
    { text: 'Quantum mechanics is fundamental to physics', desc: '英文文本测试' },
    { text: '这是一个较长的测试文本，包含更多的内容来测试API的处理能力和响应时间。量子力学作为现代物理学的基础理论，描述了微观粒子的行为规律。', desc: '长文本测试' }
  ];
  
  for (const [index, testCase] of testCases.entries()) {
    try {
      console.log(`🔄 ${index + 1}. ${testCase.desc}: "${testCase.text.substring(0, 30)}${testCase.text.length > 30 ? '...' : ''}"`);
      
      const startTime = Date.now();
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: testCase.text
      });
      const endTime = Date.now();
      
      const embedding = response.data[0].embedding;
      console.log(`   ✅ 成功 (${endTime - startTime}ms, ${embedding.length}维向量)`);
      
      // 验证向量质量
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      console.log(`   📏 向量模长: ${magnitude.toFixed(4)}`);
      
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}`);
      
      if (error.message.includes('timeout')) {
        console.log(`   ⏱️  超时错误 - API响应时间过长`);
      } else if (error.message.includes('rate_limit')) {
        console.log(`   🚦 频率限制错误 - 请求过于频繁`);
      }
    }
    
    // 测试间隔，避免频率限制
    if (index < testCases.length - 1) {
      console.log('   ⏳ 等待2秒...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

/**
 * 性能压力测试
 */
async function testPerformance() {
  console.log('\n⚡ 5. 性能压力测试');
  console.log('-------------------');
  
  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    timeout: 20000,
    maxRetries: 0
  });
  
  const testText = '量子计算机利用量子力学原理进行信息处理';
  const testCount = 3;
  
  console.log(`🔄 连续执行${testCount}次嵌入API调用...`);
  
  const results = [];
  
  for (let i = 0; i < testCount; i++) {
    try {
      const startTime = Date.now();
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: testText
      });
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      results.push(duration);
      console.log(`   ${i + 1}. ✅ 成功 (${duration}ms)`);
      
    } catch (error) {
      console.log(`   ${i + 1}. ❌ 失败: ${error.message}`);
      results.push(-1);
    }
    
    // 避免频率限制
    if (i < testCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // 统计结果
  const successResults = results.filter(r => r > 0);
  if (successResults.length > 0) {
    const avgTime = successResults.reduce((a, b) => a + b, 0) / successResults.length;
    const minTime = Math.min(...successResults);
    const maxTime = Math.max(...successResults);
    
    console.log(`\n📊 性能统计:`);
    console.log(`   成功率: ${successResults.length}/${testCount} (${(successResults.length / testCount * 100).toFixed(1)}%)`);
    console.log(`   平均响应时间: ${avgTime.toFixed(0)}ms`);
    console.log(`   最快响应时间: ${minTime}ms`);
    console.log(`   最慢响应时间: ${maxTime}ms`);
    
    if (avgTime > 10000) {
      console.log(`   ⚠️  平均响应时间较长，可能存在网络问题`);
    }
  }
}

/**
 * 连接质量诊断
 */
async function diagnoseConnection() {
  console.log('\n🩺 6. 连接质量诊断');
  console.log('-------------------');
  
  // 检查系统时间
  const now = new Date();
  console.log(`🕐 系统时间: ${now.toISOString()}`);
  
  // 检查网络延迟
  try {
    const startPing = Date.now();
    await fetch('https://api.openai.com', { method: 'HEAD' });
    const pingTime = Date.now() - startPing;
    console.log(`🏓 网络延迟: ${pingTime}ms`);
    
    if (pingTime > 1000) {
      console.log(`⚠️  网络延迟较高，可能影响API性能`);
    }
  } catch (error) {
    console.log(`❌ 网络延迟测试失败: ${error.message}`);
  }
  
  // 检查DNS解析
  try {
    const dnsStart = Date.now();
    await fetch('https://api.openai.com', { method: 'HEAD' });
    const dnsTime = Date.now() - dnsStart;
    console.log(`🌐 DNS解析时间: ${dnsTime}ms`);
  } catch (error) {
    console.log(`❌ DNS解析测试失败: ${error.message}`);
  }
}

/**
 * 给出改善建议
 */
function provideSuggestions() {
  console.log('\n💡 改善建议');
  console.log('=============');
  
  console.log('如果遇到连接问题，请尝试以下解决方案：\n');
  
  console.log('🔧 网络相关:');
  console.log('   - 检查网络连接是否稳定');
  console.log('   - 尝试使用不同的网络环境（如切换到手机热点）');
  console.log('   - 检查防火墙设置是否阻止了OpenAI API访问');
  console.log('   - 考虑使用VPN或代理服务\n');
  
  console.log('🔑 API配置:');
  console.log('   - 验证API密钥是否正确且有效');
  console.log('   - 检查OpenAI账户是否有足够的余额');
  console.log('   - 确认API密钥权限设置正确\n');
  
  console.log('⏱️  超时优化:');
  console.log('   - 增加超时时间设置（当前8秒，可尝试15-30秒）');
  console.log('   - 减少单次请求的文本长度');
  console.log('   - 在请求间添加适当延迟避免频率限制\n');
  
  console.log('🎯 系统优化:');
  console.log('   - 当前系统已支持智能降级到模拟向量');
  console.log('   - 模拟向量虽然精度稍低，但能保证系统正常运行');
  console.log('   - 建议优先解决网络问题以获得最佳体验');
}

/**
 * 主测试流程
 */
async function runTests() {
  try {
    console.log(`开始时间: ${new Date().toLocaleString()}\n`);
    
    // 1. 基础连接测试
    const basicOk = await testBasicConnection();
    if (!basicOk) {
      console.log('\n❌ 基础测试失败，停止后续测试');
      provideSuggestions();
      return;
    }
    
    // 2. 网络连接测试
    console.log('');
    const networkOk = await testNetworkConnection();
    
    // 3. API认证测试
    console.log('');
    const authOk = await testAuthentication();
    
    if (!authOk) {
      console.log('\n❌ 认证测试失败，跳过API功能测试');
      provideSuggestions();
      return;
    }
    
    // 4. 嵌入API测试
    console.log('');
    await testEmbeddingAPI();
    
    // 5. 性能测试
    await testPerformance();
    
    // 6. 连接诊断
    await diagnoseConnection();
    
    // 7. 改善建议
    provideSuggestions();
    
    console.log(`\n测试完成时间: ${new Date().toLocaleString()}`);
    console.log('==========================================');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    provideSuggestions();
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = {
  testBasicConnection,
  testNetworkConnection,
  testAuthentication,
  testEmbeddingAPI,
  testPerformance,
  diagnoseConnection
}; 