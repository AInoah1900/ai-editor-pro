#!/usr/bin/env node

/**
 * 验证URL重复/v1问题的修复
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 验证URL重复/v1问题修复');
console.log('=' .repeat(50));

async function testRAGAnalysis() {
  console.log('📝 测试RAG分析功能...');
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: '这是一个测试文档，用于验证RAG分析功能是否正常工作。'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors && Array.isArray(result.errors)) {
      console.log('✅ RAG分析成功');
      console.log(`📊 发现 ${result.errors.length} 个分析结果`);
      console.log(`🎯 文档领域: ${result.domain_info?.domain || '未知'}`);
      console.log(`🔧 使用降级模式: ${result.fallback_used ? '是' : '否'}`);
      return true;
    } else {
      console.log('⚠️  RAG分析返回了意外的格式:', result);
      return false;
    }
    
  } catch (error) {
    console.error('❌ RAG分析测试失败:', error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('🏥 测试系统健康检查...');
  
  try {
    const response = await fetch('http://localhost:3000/api/deepseek-config?action=health');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('✅ 健康检查成功');
      console.log(`🌐 云端API: ${result.data.cloud.available ? '可用' : '不可用'}`);
      console.log(`🏠 本地API: ${result.data.local.available ? '可用' : '不可用'}`);
      console.log(`📍 当前提供商: ${result.data.current}`);
      
      if (result.data.local.available) {
        console.log('✅ 本地API完全可用，URL重复问题已修复');
        return true;
      } else {
        console.log('⚠️  本地API不可用');
        return false;
      }
    } else {
      console.log('⚠️  健康检查返回了意外的格式:', result);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    return false;
  }
}

async function checkCodeFixes() {
  console.log('🔍 检查代码修复...');
  
  const filesToCheck = [
    'lib/deepseek/deepseek-dual-client.ts',
    'lib/deepseek/deepseek-config.ts'
  ];
  
  let allFixed = true;
  
  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // 检查是否包含URL重复修复逻辑
      const hasUrlFix = content.includes('baseURL.endsWith(\'/v1\')') || 
                       content.includes('避免重复的/v1');
      
      if (hasUrlFix) {
        console.log(`✅ ${file}: URL修复逻辑已应用`);
      } else {
        console.log(`⚠️  ${file}: 可能缺少URL修复逻辑`);
        allFixed = false;
      }
    } else {
      console.log(`❌ ${file}: 文件不存在`);
      allFixed = false;
    }
  }
  
  return allFixed;
}

async function main() {
  try {
    console.log('🚀 开始验证修复...\n');
    
    // 1. 检查代码修复
    const codeFixed = await checkCodeFixes();
    console.log('');
    
    // 2. 测试健康检查
    const healthOk = await testHealthCheck();
    console.log('');
    
    // 3. 测试RAG分析
    const ragOk = await testRAGAnalysis();
    console.log('');
    
    // 总结
    console.log('📋 修复验证总结:');
    console.log('=' .repeat(30));
    console.log(`🔧 代码修复: ${codeFixed ? '✅ 完成' : '❌ 未完成'}`);
    console.log(`🏥 健康检查: ${healthOk ? '✅ 通过' : '❌ 失败'}`);
    console.log(`📝 RAG分析: ${ragOk ? '✅ 正常' : '❌ 异常'}`);
    
    if (codeFixed && healthOk && ragOk) {
      console.log('\n🎉 所有测试通过！URL重复/v1问题已完全修复！');
      console.log('💡 系统现在可以正常使用本地API进行文档分析');
    } else {
      console.log('\n⚠️  部分测试未通过，可能需要进一步检查');
    }
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { testRAGAnalysis, testHealthCheck, checkCodeFixes }; 