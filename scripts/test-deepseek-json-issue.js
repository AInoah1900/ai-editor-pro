#!/usr/bin/env node

/**
 * 测试DeepSeek JSON输出问题
 */

console.log('🔍 测试DeepSeek JSON输出问题');
console.log('=' .repeat(50));

async function testDeepSeekJsonOutput() {
  console.log('🤖 测试DeepSeek JSON输出...');
  
  try {
    // 使用非常简单的prompt
    const simplePrompt = `请分析这个文档："测试测试文档"，找出重复词汇。

请严格按照以下JSON格式返回，不要包含任何其他文字：
{
  "errors": [
    {
      "type": "error",
      "original": "测试测试",
      "suggestion": "测试",
      "reason": "重复词汇",
      "category": "语法",
      "position": {"start": 0, "end": 4}
    }
  ]
}`;

    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        messages: [
          {
            role: 'system',
            content: '你是一个JSON输出助手。只输出JSON格式的数据，不要包含任何其他内容。'
          },
          {
            role: 'user',
            content: simplePrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500,  // 限制token数量
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content;
    
    console.log('📋 DeepSeek响应分析:');
    console.log('- 响应长度:', aiResponse?.length || 0);
    console.log('- 包含think标签:', aiResponse?.includes('<think>') ? '是' : '否');
    console.log('- 包含JSON大括号:', aiResponse?.includes('{') && aiResponse?.includes('}') ? '是' : '否');
    console.log('- 响应是否完整:', aiResponse?.trim().endsWith('}') || aiResponse?.trim().endsWith(']') ? '是' : '否');
    
    console.log('\n📝 完整响应内容:');
    console.log('---开始---');
    console.log(aiResponse);
    console.log('---结束---');
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ API调用失败:', error.message);
    return null;
  }
}

async function testIncreasedTokens() {
  console.log('\n🔄 测试增加token限制...');
  
  try {
    // 使用更高的token限制
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        messages: [
          {
            role: 'system',
            content: '你是一个JSON输出助手。只输出JSON格式的数据，不要包含任何其他内容。不要使用<think>标签。'
          },
          {
            role: 'user',
            content: `请分析这个文档："测试测试文档"，找出重复词汇。

请直接返回JSON格式：
{
  "errors": [
    {
      "type": "error",
      "original": "测试测试",
      "suggestion": "测试",
      "reason": "重复词汇",
      "category": "语法",
      "position": {"start": 0, "end": 4}
    }
  ]
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500,  // 增加token限制
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content;
    
    console.log('📋 增加token后的响应分析:');
    console.log('- 响应长度:', aiResponse?.length || 0);
    console.log('- 包含think标签:', aiResponse?.includes('<think>') ? '是' : '否');
    console.log('- 响应是否完整:', aiResponse?.trim().endsWith('}') || aiResponse?.trim().endsWith(']') ? '是' : '否');
    
    console.log('\n📝 完整响应内容:');
    console.log('---开始---');
    console.log(aiResponse);
    console.log('---结束---');
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ 增加token测试失败:', error.message);
    return null;
  }
}

async function testNoThinkPrompt() {
  console.log('\n🚫 测试禁止think标签的prompt...');
  
  try {
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:8b',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的JSON输出助手。严格按照以下规则：1. 只输出JSON格式数据 2. 不要使用<think>标签 3. 不要添加任何解释文字 4. 直接输出结果'
          },
          {
            role: 'user',
            content: `分析文档："测试测试文档"，找出重复词汇。

输出格式：
{"errors":[{"type":"error","original":"测试测试","suggestion":"测试","reason":"重复词汇","category":"语法","position":{"start":0,"end":4}}]}`
          }
        ],
        temperature: 0.1,
        max_tokens: 800,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content;
    
    console.log('📋 禁止think标签后的响应分析:');
    console.log('- 响应长度:', aiResponse?.length || 0);
    console.log('- 包含think标签:', aiResponse?.includes('<think>') ? '是' : '否');
    console.log('- 响应是否完整:', aiResponse?.trim().endsWith('}') || aiResponse?.trim().endsWith(']') ? '是' : '否');
    
    console.log('\n📝 完整响应内容:');
    console.log('---开始---');
    console.log(aiResponse);
    console.log('---结束---');
    
    // 尝试解析JSON
    if (aiResponse) {
      try {
        let cleanResponse = aiResponse.trim();
        
        // 移除think标签
        if (cleanResponse.includes('<think>')) {
          cleanResponse = cleanResponse.replace(/<think>[\s\S]*?<\/think>/gi, '');
        }
        
        // 提取JSON
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          const parsed = JSON.parse(jsonStr);
          console.log('\n✅ JSON解析成功!');
          console.log('📊 错误数量:', parsed.errors?.length || 0);
          return jsonStr;
        } else {
          console.log('\n❌ 未找到JSON结构');
        }
      } catch (error) {
        console.log('\n❌ JSON解析失败:', error.message);
      }
    }
    
    return aiResponse;
    
  } catch (error) {
    console.error('❌ 禁止think标签测试失败:', error.message);
    return null;
  }
}

async function main() {
  try {
    console.log('🚀 开始测试DeepSeek JSON输出问题...\n');
    
    // 1. 基础测试
    const basicResponse = await testDeepSeekJsonOutput();
    
    // 2. 增加token限制测试
    const increasedResponse = await testIncreasedTokens();
    
    // 3. 禁止think标签测试
    const noThinkResponse = await testNoThinkPrompt();
    
    // 4. 总结
    console.log('\n📊 测试总结:');
    console.log('=' .repeat(40));
    console.log(`🔹 基础测试: ${basicResponse ? '有响应' : '无响应'}`);
    console.log(`🔹 增加token测试: ${increasedResponse ? '有响应' : '无响应'}`);
    console.log(`🔹 禁止think标签测试: ${noThinkResponse ? '有响应' : '无响应'}`);
    
    console.log('\n💡 问题分析:');
    if (basicResponse?.includes('<think>')) {
      console.log('- DeepSeek模型默认会使用<think>标签进行思考');
    }
    
    if (basicResponse && !basicResponse.trim().endsWith('}')) {
      console.log('- 响应可能被截断，没有完整的JSON结构');
    }
    
    if (noThinkResponse && !noThinkResponse.includes('<think>')) {
      console.log('- 可以通过prompt控制避免think标签');
    }
    
    console.log('\n🔧 建议解决方案:');
    console.log('1. 在system prompt中明确禁止使用<think>标签');
    console.log('2. 增加max_tokens限制，确保响应完整');
    console.log('3. 使用更简洁的prompt格式');
    console.log('4. 在JSON提取逻辑中处理截断的响应');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
} 