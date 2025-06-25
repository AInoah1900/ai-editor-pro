#!/usr/bin/env node

/**
 * 测试本地聊天API优化 (OpenAI兼容格式)
 * 验证 /v1/chat/completions 接口的功能
 */

const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  baseURL: 'http://localhost:11434',
  model: 'deepseek-r1:8b',
  testTimeout: 60000 // 60秒超时
};

// 测试文本样本
const TEST_SAMPLES = {
  short: '基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述',
  academic: `本研究采用了定量分析方法，通过收集大量样本数据进行统计分析。实验设计包括对照组和实验组，
以确保结果的可靠性。数据分析使用了SPSS软件，采用了t检验和方差分析等统计方法。`
};

/**
 * 测试OpenAI兼容接口
 */
async function testOpenAICompatibleAPI() {
  console.log('🧪 测试OpenAI兼容接口 (/v1/chat/completions)');
  console.log('=' .repeat(60));
  
  const url = `${TEST_CONFIG.baseURL}/v1/chat/completions`;
  
  const requestBody = {
    model: TEST_CONFIG.model,
    messages: [
      {
        role: 'system',
        content: '你是一个专业的学术编辑，负责优化科研论文。'
      },
      {
        role: 'user',
        content: '请简单介绍你的功能。'
      }
    ],
    temperature: 0.3,
    max_tokens: 200,
    stream: false
  };

  try {
    console.log(`📍 API地址: ${url}`);
    console.log(`🤖 模型: ${requestBody.model}`);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ollama'
      },
      body: JSON.stringify(requestBody)
    });

    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API错误: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ OpenAI兼容接口测试成功');
    console.log(`⏱️  响应时间: ${duration}ms`);
    console.log(`📄 内容长度: ${result.choices[0]?.message?.content?.length || 0} 字符`);
    
    return { success: true, duration };
    
  } catch (error) {
    console.error('❌ OpenAI兼容接口测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 检查Ollama服务状态
 */
async function checkOllamaStatus() {
  console.log('🔍 检查Ollama服务状态');
  console.log('=' .repeat(60));
  
  try {
    const response = await fetch(`${TEST_CONFIG.baseURL}/api/tags`);
    
    if (!response.ok) {
      throw new Error(`Ollama服务不可用: ${response.status}`);
    }
    
    const data = await response.json();
    const models = data.models || [];
    
    console.log('✅ Ollama服务正常运行');
    console.log(`📋 可用模型数量: ${models.length}`);
    
    const targetModelAvailable = models.some(model => model.name === TEST_CONFIG.model);
    
    return {
      serviceRunning: true,
      modelsCount: models.length,
      targetModelAvailable,
      models: models.map(m => m.name)
    };
    
  } catch (error) {
    console.error('❌ Ollama服务检查失败:', error.message);
    return {
      serviceRunning: false,
      error: error.message
    };
  }
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🚀 本地聊天API优化测试开始');
  console.log('测试目标：验证OpenAI兼容格式的 /v1/chat/completions 接口');
  console.log('=' .repeat(80));
  
  const results = {};
  
  try {
    // 1. 检查Ollama服务状态
    results.ollamaStatus = await checkOllamaStatus();
    
    if (!results.ollamaStatus.serviceRunning) {
      console.error('\n❌ Ollama服务未运行，无法继续测试');
      return;
    }
    
    // 2. 测试OpenAI兼容接口
    results.openaiCompatible = await testOpenAICompatibleAPI();
    
    console.log('\n🎉 本地聊天API优化测试完成');
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}
