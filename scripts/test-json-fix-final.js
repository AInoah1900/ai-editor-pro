#!/usr/bin/env node

/**
 * 最终JSON解析修复验证
 */

console.log('🔧 最终JSON解析修复验证');
console.log('=' .repeat(50));

// 模拟DeepSeek返回的数组格式JSON
const testArrayJson = `[
  {
    "type": "error",
    "original": "研究研究了",
    "suggestion": "研究了",
    "reason": "词语重复",
    "category": "冗余表达",
    "position": {"start": 0, "end": 10}
  },
  {
    "type": "warning",
    "original": "实验实验结果",
    "suggestion": "实验结果",
    "reason": "避免重复表达",
    "category": "语言规范",
    "position": {"start": 15, "end": 25}
  }
]`;

// 模拟包含think标签的完整响应
const testThinkResponse = `<think>
用户要求分析文档并返回JSON格式...
需要检查重复词汇问题...
</think>
[
  {
    "type": "error",
    "original": "数据数据分析",
    "suggestion": "数据分析",
    "reason": "消除重复词汇",
    "category": "表达优化",
    "position": {"start": 0, "end": 10}
  }
]`;

function testJsonExtraction(response, testName) {
  console.log(`\n🧪 测试: ${testName}`);
  console.log('📝 输入响应长度:', response.length);
  
  try {
    // 模拟API中的处理逻辑
    let processed = response.trim();
    
    // 移除think标签
    if (processed.includes('<think>')) {
      console.log('🧠 检测到think标签，正在移除...');
      processed = processed.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      console.log('✂️ 移除后长度:', processed.length);
    }
    
    // 查找JSON边界
    const arrayStart = processed.indexOf('[');
    const arrayEnd = processed.lastIndexOf(']');
    const objectStart = processed.indexOf('{');
    const objectEnd = processed.lastIndexOf('}');
    
    let jsonStart = -1;
    let jsonEnd = -1;
    let jsonType = '';
    
    if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
      jsonStart = arrayStart;
      jsonEnd = arrayEnd;
      jsonType = 'array';
    } else if (objectStart !== -1) {
      jsonStart = objectStart;
      jsonEnd = objectEnd;
      jsonType = 'object';
    }
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = processed.substring(jsonStart, jsonEnd + 1);
      console.log(`🎯 找到JSON${jsonType}，长度:`, jsonStr.length);
      
      // 尝试解析
      const parsed = JSON.parse(jsonStr);
      console.log('✅ JSON解析成功');
      
      // 检查格式
      let errors = [];
      if (Array.isArray(parsed)) {
        errors = parsed;
        console.log('📊 直接数组格式，包含', errors.length, '个错误');
      } else if (parsed.errors && Array.isArray(parsed.errors)) {
        errors = parsed.errors;
        console.log('📊 对象格式，包含', errors.length, '个错误');
      }
      
      // 显示错误项
      errors.forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.original} → ${error.suggestion}`);
      });
      
      return true;
    } else {
      console.log('❌ 未找到JSON边界');
      return false;
    }
    
  } catch (error) {
    console.log('❌ 处理失败:', error.message);
    return false;
  }
}

async function testRealAPI() {
  console.log('\n🌐 测试真实API响应...');
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: '这个研究研究了重要问题。实验实验结果显示显示了性能提升。'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    console.log('📋 API响应结构:');
    console.log('- 有errors:', Array.isArray(result.errors) ? '是' : '否');
    console.log('- errors数量:', result.errors?.length || 0);
    console.log('- 领域:', result.domain_info?.domain || '未知');
    console.log('- 降级模式:', result.fallback_used ? '是' : '否');
    
    if (result.errors && result.errors.length > 0) {
      console.log('📝 发现的问题:');
      result.errors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. [${error.type}] ${error.original} → ${error.suggestion}`);
      });
    }
    
    return result.errors && result.errors.length > 0;
    
  } catch (error) {
    console.log('❌ API测试失败:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始最终验证...\n');
  
  // 1. 测试数组格式JSON
  const test1 = testJsonExtraction(testArrayJson, '纯数组格式');
  
  // 2. 测试包含think标签的响应
  const test2 = testJsonExtraction(testThinkResponse, '包含think标签');
  
  // 3. 测试真实API
  const test3 = await testRealAPI();
  
  // 总结
  console.log('\n📊 测试总结:');
  console.log('=' .repeat(30));
  console.log(`🔧 数组格式解析: ${test1 ? '通过' : '失败'}`);
  console.log(`🧠 think标签处理: ${test2 ? '通过' : '失败'}`);
  console.log(`🌐 真实API测试: ${test3 ? '通过' : '失败'}`);
  
  const passedTests = [test1, test2, test3].filter(Boolean).length;
  console.log(`\n🎯 总体结果: ${passedTests}/3 测试通过`);
  
  if (passedTests === 3) {
    console.log('\n🎉 所有测试通过！JSON解析功能已完全修复！');
    console.log('💡 系统能够正确处理：');
    console.log('   - DeepSeek的数组格式JSON响应');
    console.log('   - 包含<think>标签的复杂响应');
    console.log('   - 实际的RAG增强分析');
  } else {
    console.log('\n⚠️ 部分测试失败，需要进一步调试');
  }
}

if (require.main === module) {
  main();
} 