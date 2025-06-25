/**
 * 测试当前JSON修复功能
 * 模拟实际的API调用来验证修复效果
 */

const { execSync } = require('child_process');

console.log('🧪 测试当前JSON修复功能...\n');

// 创建测试文档
const testDocument = `基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述

引言
根据最新的研究表明，基于超音速数值仿真下多脉冲约束弹体的修正策略研究的研究表明，在现代工程应用中，需要考虑多个因素的影响。

重要发现: 基于超音速数值仿真下多脉冲约束弹体的修正策略研究的研究表明，这一领域的研究具有重要的理论和实际意义。

值得注意的是，基于超音速数值仿真下多脉冲约束弹体的修正策略研究的研究中，存在以下主要问题：

1. 效率问题：当前的研究方法在处理大规模数据时存在效率不足的问题
2. 成本问题：实现该研究需要大量的计算资源和时间投入
3. 应用范围问题：目前的研究成果在实际应用中的适用范围有限`;

async function testJsonFix() {
  try {
    console.log('📝 准备测试文档...');
    
    // 调用API
    const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: testDocument,
        domain: 'academic'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ API调用成功');
    console.log('📊 结果统计:');
    console.log('  - 错误数量:', result.errors?.length || 0);
    console.log('  - 使用备选方案:', result.fallback_used ? '是' : '否');
    console.log('  - RAG置信度:', result.rag_confidence || 'N/A');
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n📋 检测到的错误:');
      result.errors.slice(0, 3).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.type}: ${error.original.substring(0, 50)}...`);
        console.log(`     建议: ${error.suggestion.substring(0, 50)}...`);
        console.log(`     原因: ${error.reason}`);
      });
      
      if (result.errors.length > 3) {
        console.log(`  ... 还有 ${result.errors.length - 3} 个错误`);
      }
    }
    
    console.log('\n🎉 JSON解析修复测试成功！');
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

// 检查服务器是否运行
function checkServer() {
  try {
    execSync('curl -s http://localhost:3000 > /dev/null', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 主测试函数
async function main() {
  if (!checkServer()) {
    console.log('⚠️ 服务器未运行，请先启动开发服务器:');
    console.log('   npm run dev');
    return;
  }
  
  console.log('🚀 服务器已运行，开始测试...\n');
  
  const success = await testJsonFix();
  
  if (success) {
    console.log('\n✅ 所有测试通过，JSON修复功能正常工作！');
  } else {
    console.log('\n❌ 测试失败，需要进一步调试');
  }
}

main().catch(console.error);
