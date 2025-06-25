#!/usr/bin/env node

/**
 * 云端API认证修复验证脚本
 * 
 * 此脚本用于验证云端API认证问题是否已经修复
 */

const fs = require('fs');
const path = require('path');

async function testCloudAPIAuth() {
  console.log('🔍 云端API认证修复验证');
  console.log('================================');
  
  try {
    // 动态导入双客户端（使用require方式）
    const { getDualDeepSeekClient } = require('../lib/deepseek/deepseek-dual-client');
    
    console.log('📋 正在检查云端API配置...');
    
    const dualClient = getDualDeepSeekClient();
    
    // 获取健康检查状态
    console.log('🏥 执行健康检查...');
    const healthStatus = await dualClient.healthCheck();
    
    console.log('\n📊 健康检查结果:');
    console.log('云端API状态:', healthStatus.cloud.available ? '✅ 可用' : '❌ 不可用');
    if (healthStatus.cloud.error) {
      console.log('云端API错误:', healthStatus.cloud.error);
    }
    
    console.log('本地API状态:', healthStatus.local.available ? '✅ 可用' : '❌ 不可用');
    if (healthStatus.local.error) {
      console.log('本地API错误:', healthStatus.local.error);
    }
    
    console.log('当前提供商:', healthStatus.current);
    
    // 如果云端API可用，进行连接测试
    if (healthStatus.cloud.available) {
      console.log('\n🌐 测试云端API连接...');
      try {
        await dualClient.testProviderConnection('cloud');
        console.log('✅ 云端API连接测试成功！');
        
        // 尝试简单的聊天测试
        console.log('\n💬 测试云端API聊天功能...');
        const response = await dualClient.createChatCompletion({
          messages: [
            { role: 'user', content: '请回复"测试成功"' }
          ],
          max_tokens: 50
        });
        
        console.log('✅ 云端API聊天测试成功！');
        console.log('响应提供商:', response.provider);
        console.log('响应内容:', response.choices[0]?.message?.content);
        
      } catch (error) {
        console.error('❌ 云端API连接测试失败:', error.message);
        
        // 分析错误类型
        if (error.message.includes('401')) {
          console.log('\n🔧 认证错误分析:');
          console.log('- 这是401认证错误，表示API密钥问题');
          console.log('- 请检查DEEPSEEK_API_KEY环境变量是否正确设置');
          console.log('- 请确保API密钥格式正确（通常以sk-开头）');
        } else if (error.message.includes('ollama')) {
          console.log('\n🔧 发现ollama认证错误:');
          console.log('- 检测到代码中仍在使用"ollama"作为认证头');
          console.log('- 这表明还有地方没有修复完成');
        }
      }
    } else {
      console.log('\n⚠️  云端API不可用，跳过连接测试');
      console.log('请检查以下配置:');
      console.log('1. DEEPSEEK_API_KEY环境变量是否设置');
      console.log('2. API密钥是否有效');
      console.log('3. 网络连接是否正常');
    }
    
    // 检查配置文件
    console.log('\n📁 检查配置文件...');
    const configPath = path.join(__dirname, '../lib/deepseek/deepseek-dual-client.ts');
    const content = fs.readFileSync(configPath, 'utf8');
    
    // 检查是否还有错误的ollama认证头
    const cloudAuthMatches = content.match(/Authorization.*Bearer.*ollama.*cloudConfig/g);
    const problematicMatches = content.match(/Authorization.*Bearer.*ollama(?!.*本地)/g);
    
    if (problematicMatches && problematicMatches.length > 0) {
      console.log('⚠️  发现可能的问题:');
      problematicMatches.forEach((match, index) => {
        console.log(`${index + 1}. ${match}`);
      });
    } else {
      console.log('✅ 代码检查通过，没有发现明显的认证问题');
    }
    
    // 环境变量检查
    console.log('\n🔐 环境变量检查:');
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      console.log('✅ DEEPSEEK_API_KEY已设置');
      console.log('API密钥格式:', apiKey.startsWith('sk-') ? '✅ 正确' : '⚠️  可能不正确');
      console.log('API密钥长度:', apiKey.length, '字符');
    } else {
      console.log('❌ DEEPSEEK_API_KEY未设置');
      console.log('请设置环境变量: export DEEPSEEK_API_KEY=your_api_key_here');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    console.error('错误详情:', error.stack);
  }
}

// 主函数
async function main() {
  console.log('🚀 开始云端API认证修复验证...\n');
  
  await testCloudAPIAuth();
  
  console.log('\n📋 修复建议:');
  console.log('1. 确保DEEPSEEK_API_KEY环境变量正确设置');
  console.log('2. 检查API密钥是否有效且有足够的配额');
  console.log('3. 如果仍有问题，请检查网络连接');
  console.log('4. 考虑使用本地API作为备用方案');
  
  console.log('\n✅ 验证完成！');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCloudAPIAuth }; 