#!/usr/bin/env node

/**
 * DeepSeek API连接性测试工具
 * 专为中国国内网络环境设计，测试DeepSeek API的各项功能
 */

require('dotenv').config({ path: '.env.local' });

// 配置信息
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1';

console.log('🔍 DeepSeek API连接性测试工具');
console.log('=========================================\n');

/**
 * 基础连接测试
 */
async function testBasicConnection() {
  console.log('📡 1. 基础连接测试');
  console.log('-------------------');
  
  if (!DEEPSEEK_API_KEY) {
    console.log('❌ DeepSeek API密钥未配置');
    console.log('💡 请在.env.local文件中设置DEEPSEEK_API_KEY');
    return false;
  }
  
  console.log('✅ API密钥已配置');
  console.log(`🔑 密钥前缀: ${DEEPSEEK_API_KEY.substring(0, 20)}...`);
  
  // 验证密钥格式
  if (!DEEPSEEK_API_KEY.startsWith('sk-')) {
    console.log('⚠️  警告: API密钥格式可能不正确（通常以sk-开头）');
  } else {
    console.log('✅ API密钥格式正确');
  }
  
  console.log('');
  return true;
}

/**
 * 网络连接测试
 */
async function testNetworkConnection() {
  console.log('🌐 2. 网络连接测试');
  console.log('-------------------');
  
  try {
    console.log('🔄 测试DeepSeek服务器连接...');
    const response = await fetch(`${DEEPSEEK_API_URL}/models`, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      timeout: 10000
    });
    
    console.log(`✅ DeepSeek服务器可达 (状态码: ${response.status})`);
    
    if (response.status === 401) {
      console.log('⚠️  API密钥可能无效或已过期');
      return false;
    }
    
    return true;
  } catch (error) {
    console.log(`❌ 网络连接失败: ${error.message}`);
    console.log('💡 建议: 检查网络连接或尝试VPN/代理');
    return false;
  }
}

/**
 * API认证测试
 */
async function testAuthentication() {
  console.log('🔐 3. API认证测试');
  console.log('-------------------');
  
  try {
    console.log('🔄 测试API认证...');
    const startTime = Date.now();
    
    const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 10
      }),
      timeout: 15000
    });
    
    const endTime = Date.now();
    
    if (response.ok) {
      console.log(`✅ 认证成功 (耗时: ${endTime - startTime}ms)`);
      
      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        console.log('📊 API响应正常，模型可用');
        console.log(`💬 测试响应: "${data.choices[0].message.content}"`);
      }
      
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ 认证失败: ${response.status} - ${response.statusText}`);
      console.log(`📝 错误详情: ${JSON.stringify(errorData, null, 2)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 认证失败: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.log('💡 建议: 网络连接可能不稳定，请检查网络环境');
    } else if (error.message.includes('401')) {
      console.log('💡 建议: 检查API密钥是否正确');
    }
    
    return false;
  }
}

/**
 * Chat Completion API测试
 */
async function testChatCompletion() {
  console.log('💬 4. Chat Completion API测试');
  console.log('------------------------------');
  
  const testCases = [
    { 
      prompt: '你好', 
      desc: '基础中文对话' 
    },
    { 
      prompt: 'Hello, how are you?', 
      desc: '英文对话测试' 
    },
    { 
      prompt: '请帮我校对这段文本：量子力学是是物理学的重要分支。', 
      desc: '文本校对任务' 
    },
    { 
      prompt: '请返回JSON格式：{"result": "测试成功"}', 
      desc: 'JSON输出测试' 
    }
  ];
  
  for (const [index, testCase] of testCases.entries()) {
    try {
      console.log(`🔄 ${index + 1}. ${testCase.desc}`);
      console.log(`   输入: "${testCase.prompt}"`);
      
      const startTime = Date.now();
      const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: testCase.prompt }],
          max_tokens: 200,
          temperature: 0.1
        }),
        timeout: 20000
      });
      
      const endTime = Date.now();
      
      if (response.ok) {
        const data = await response.json();
        const reply = data.choices[0]?.message?.content || '无响应';
        
        console.log(`   ✅ 成功 (${endTime - startTime}ms)`);
        console.log(`   📝 输出: "${reply.substring(0, 100)}${reply.length > 100 ? '...' : ''}"`);
        
        // 检查token使用情况
        if (data.usage) {
          console.log(`   📊 Token使用: ${data.usage.prompt_tokens} + ${data.usage.completion_tokens} = ${data.usage.total_tokens}`);
        }
      } else {
        console.log(`   ❌ 失败: ${response.status} - ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ 失败: ${error.message}`);
    }
    
    // 测试间隔，避免频率限制
    if (index < testCases.length - 1) {
      console.log('   ⏳ 等待2秒...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

/**
 * 向量生成测试（本地算法）
 */
async function testEmbeddingGeneration() {
  console.log('\n🧠 5. 向量生成测试（本地算法）');
  console.log('--------------------------------');
  
  try {
    // 动态导入DeepSeek客户端
    const { createDeepSeekClient } = await import('../lib/deepseek/deepseek-client.js');
    const client = createDeepSeekClient(DEEPSEEK_API_KEY);
    
    const testTexts = [
      '量子力学是物理学的重要分支',
      'DeepSeek是一个优秀的AI模型',
      '人工智能正在改变世界',
      '机器学习算法需要大量数据训练'
    ];
    
    console.log('🔄 使用DeepSeek本地算法生成向量...');
    
    for (const [index, text] of testTexts.entries()) {
      const startTime = Date.now();
      const embeddings = await client.createEmbedding(text);
      const endTime = Date.now();
      
      const embedding = embeddings[0];
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      
      console.log(`${index + 1}. "${text}"`);
      console.log(`   ✅ 生成成功 (${endTime - startTime}ms)`);
      console.log(`   📏 向量维度: ${embedding.length}`);
      console.log(`   📐 向量模长: ${magnitude.toFixed(4)}`);
      console.log(`   🎯 向量质量: ${magnitude > 0.9 && magnitude < 1.1 ? '良好' : '需调整'}`);
    }
    
    // 测试向量相似度
    console.log('\n🔍 向量相似度测试:');
    const embeddings1 = await client.createEmbedding('人工智能技术');
    const embeddings2 = await client.createEmbedding('AI技术发展');
    const embeddings3 = await client.createEmbedding('天气预报');
    
    const similarity12 = calculateCosineSimilarity(embeddings1[0], embeddings2[0]);
    const similarity13 = calculateCosineSimilarity(embeddings1[0], embeddings3[0]);
    
    console.log(`相似文本相似度: ${similarity12.toFixed(4)} (期望: >0.5)`);
    console.log(`不同文本相似度: ${similarity13.toFixed(4)} (期望: <0.5)`);
    console.log(`语义区分度: ${similarity12 > similarity13 ? '✅ 良好' : '⚠️  需优化'}`);
    
  } catch (error) {
    console.log(`❌ 向量生成测试失败: ${error.message}`);
    console.log('💡 请确保DeepSeek客户端模块正确安装');
  }
}

/**
 * 性能压力测试
 */
async function testPerformance() {
  console.log('\n⚡ 6. 性能压力测试');
  console.log('-------------------');
  
  const testCount = 5;
  const testPrompt = '请简要回答：什么是人工智能？';
  
  console.log(`🔄 连续执行${testCount}次API调用...`);
  
  const results = [];
  
  for (let i = 0; i < testCount; i++) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${DEEPSEEK_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: testPrompt }],
          max_tokens: 100,
          temperature: 0.1
        }),
        timeout: 15000
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (response.ok) {
        results.push(duration);
        console.log(`   ${i + 1}. ✅ 成功 (${duration}ms)`);
      } else {
        console.log(`   ${i + 1}. ❌ 失败: ${response.status}`);
        results.push(-1);
      }
      
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
    
    if (avgTime > 5000) {
      console.log(`   ⚠️  平均响应时间较长，可能存在网络问题`);
    } else {
      console.log(`   ✅ 响应时间良好`);
    }
  }
}

/**
 * 计算余弦相似度
 */
function calculateCosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * 给出使用建议
 */
function provideUsageRecommendations() {
  console.log('\n💡 使用建议与最佳实践');
  console.log('=======================');
  
  console.log('\n🔧 API配置优化:');
  console.log('   - 使用较长的超时时间（30秒）适应国内网络');
  console.log('   - 设置适当的重试机制（3次）');
  console.log('   - temperature设置为0.1获得更稳定的输出');
  console.log('   - 根据任务调整max_tokens参数');
  
  console.log('\n🌐 网络优化建议:');
  console.log('   - 优先使用稳定的网络环境');
  console.log('   - 如遇连接问题，可尝试VPN或代理');
  console.log('   - 监控API调用频率，避免触发限制');
  
  console.log('\n🎯 向量生成策略:');
  console.log('   - 本地DeepSeek算法无需网络，性能稳定');
  console.log('   - 支持中英文混合文本处理');
  console.log('   - 自动领域识别和特征提取');
  console.log('   - 1024维向量兼容Pinecone');
  
  console.log('\n📈 性能监控:');
  console.log('   - 定期检查API响应时间');
  console.log('   - 监控token使用量控制成本');
  console.log('   - 记录成功率和错误类型');
  console.log('   - 设置适当的降级策略');
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
      provideUsageRecommendations();
      return;
    }
    
    // 2. 网络连接测试
    const networkOk = await testNetworkConnection();
    if (!networkOk) {
      console.log('\n⚠️  网络连接异常，但可以继续测试');
    }
    
    // 3. API认证测试
    console.log('');
    const authOk = await testAuthentication();
    if (!authOk) {
      console.log('\n❌ 认证测试失败，跳过API功能测试');
      provideUsageRecommendations();
      return;
    }
    
    // 4. Chat Completion测试
    console.log('');
    await testChatCompletion();
    
    // 5. 向量生成测试
    await testEmbeddingGeneration();
    
    // 6. 性能测试
    await testPerformance();
    
    // 7. 使用建议
    provideUsageRecommendations();
    
    console.log(`\n✅ 测试完成时间: ${new Date().toLocaleString()}`);
    console.log('=========================================');
    console.log('🎉 DeepSeek API已准备就绪！');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
    provideUsageRecommendations();
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
  testChatCompletion,
  testEmbeddingGeneration,
  testPerformance
}; 