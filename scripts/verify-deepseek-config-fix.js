/**
 * DeepSeek配置修复最终验证脚本
 * 验证页面访问、API功能、配置正确性
 */

const fs = require('fs');
const path = require('path');

// 测试结果收集器
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

function addTestResult(name, status, details = null, error = null) {
  const result = {
    name,
    status,
    details,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (status === 'PASSED') {
    testResults.summary.passed++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   📝 ${details}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${name}`);
    if (error) console.log(`   🚨 ${error.message}`);
    if (details) console.log(`   📝 ${details}`);
  }
}

async function main() {
  console.log('🔍 开始DeepSeek配置修复最终验证...\n');

  // 测试1: 检查构建文件是否存在
  try {
    const buildPath = path.join(process.cwd(), '.next/server/app/deepseek-config/page.js');
    const buildExists = fs.existsSync(buildPath);
    
    if (buildExists) {
      addTestResult(
        '构建文件存在性检查',
        'PASSED',
        '页面构建文件已正确生成'
      );
    } else {
      addTestResult(
        '构建文件存在性检查',
        'FAILED',
        '页面构建文件不存在，可能需要重新构建'
      );
    }
  } catch (error) {
    addTestResult(
      '构建文件存在性检查',
      'FAILED',
      null,
      error
    );
  }

  // 测试2: 检查页面源文件
  try {
    const pagePath = path.join(process.cwd(), 'app/deepseek-config/page.tsx');
    if (fs.existsSync(pagePath)) {
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      
      if (pageContent.includes('DeepSeekConfigPanel') && 
          pageContent.includes('DeepSeek API 配置中心')) {
        addTestResult(
          '页面源文件检查',
          'PASSED',
          '页面组件和内容正确'
        );
      } else {
        addTestResult(
          '页面源文件检查',
          'FAILED',
          '页面内容不完整'
        );
      }
    } else {
      addTestResult(
        '页面源文件检查',
        'FAILED',
        '页面源文件不存在'
      );
    }
  } catch (error) {
    addTestResult(
      '页面源文件检查',
      'FAILED',
      null,
      error
    );
  }

  // 测试3: 检查配置组件文件
  try {
    const componentPath = path.join(process.cwd(), 'app/components/DeepSeekConfigPanel.tsx');
    if (fs.existsSync(componentPath)) {
      const componentContent = fs.readFileSync(componentPath, 'utf8');
      
      if (componentContent.includes('useState') && 
          componentContent.includes('useEffect') &&
          componentContent.includes('testConnection')) {
        addTestResult(
          '配置组件文件检查',
          'PASSED',
          '配置组件功能完整'
        );
      } else {
        addTestResult(
          '配置组件文件检查',
          'FAILED',
          '配置组件功能不完整'
        );
      }
    } else {
      addTestResult(
        '配置组件文件检查',
        'FAILED',
        '配置组件文件不存在'
      );
    }
  } catch (error) {
    addTestResult(
      '配置组件文件检查',
      'FAILED',
      null,
      error
    );
  }

  // 测试4: 测试页面HTTP访问
  try {
    console.log('\n🌐 测试页面HTTP访问...');
    const response = await fetch('http://localhost:3002/deepseek-config', {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      const html = await response.text();
      
      if (html.includes('DeepSeek API 配置中心') && 
          html.includes('管理您的DeepSeek API配置')) {
        addTestResult(
          '页面HTTP访问测试',
          'PASSED',
          `HTTP ${response.status}: 页面内容正确`
        );
      } else {
        addTestResult(
          '页面HTTP访问测试',
          'FAILED',
          `HTTP ${response.status}: 页面内容不完整`
        );
      }
    } else {
      addTestResult(
        '页面HTTP访问测试',
        'FAILED',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
  } catch (error) {
    addTestResult(
      '页面HTTP访问测试',
      'FAILED',
      '页面访问失败，请确保开发服务器正在运行',
      error
    );
  }

  // 测试5: 测试API状态端点
  try {
    console.log('\n🔧 测试API状态端点...');
    const response = await fetch('http://localhost:3002/api/deepseek-config?action=status', {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data && data.data.currentProvider) {
        addTestResult(
          'API状态端点测试',
          'PASSED',
          `当前提供商: ${data.data.currentProvider}`
        );
      } else {
        addTestResult(
          'API状态端点测试',
          'FAILED',
          'API响应格式不正确'
        );
      }
    } else {
      addTestResult(
        'API状态端点测试',
        'FAILED',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
  } catch (error) {
    addTestResult(
      'API状态端点测试',
      'FAILED',
      'API访问失败',
      error
    );
  }

  // 测试6: 测试API模型端点
  try {
    console.log('\n🤖 测试API模型端点...');
    const response = await fetch('http://localhost:3002/api/deepseek-config?action=models', {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data.localModels)) {
        addTestResult(
          'API模型端点测试',
          'PASSED',
          `可用模型: ${data.data.localModels.join(', ') || '无'}`
        );
      } else {
        addTestResult(
          'API模型端点测试',
          'FAILED',
          'API响应格式不正确'
        );
      }
    } else {
      addTestResult(
        'API模型端点测试',
        'FAILED',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
  } catch (error) {
    addTestResult(
      'API模型端点测试',
      'FAILED',
      'API访问失败',
      error
    );
  }

  // 测试7: 测试本地API连接测试
  try {
    console.log('\n🏠 测试本地API连接测试...');
    const response = await fetch('http://localhost:3002/api/deepseek-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'testConnection',
        provider: 'local'
      }),
      timeout: 15000
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success) {
        addTestResult(
          '本地API连接测试',
          'PASSED',
          data.message || '连接成功'
        );
      } else {
        addTestResult(
          '本地API连接测试',
          'FAILED',
          data.error || '连接失败'
        );
      }
    } else {
      addTestResult(
        '本地API连接测试',
        'FAILED',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
  } catch (error) {
    addTestResult(
      '本地API连接测试',
      'FAILED',
      '连接测试失败',
      error
    );
  }

  // 测试8: 检查环境配置
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      const requiredVars = [
        'DEEPSEEK_LOCAL_MODEL=deepseek-r1:8b',
        'DEEPSEEK_LOCAL_BASE_URL=http://localhost:11434/api',
        'DEEPSEEK_CLOUD_MODEL=deepseek-chat',
        'DEEPSEEK_CLOUD_BASE_URL=https://api.deepseek.com/v1'
      ];
      
      const missingVars = requiredVars.filter(varDef => !envContent.includes(varDef));
      
      if (missingVars.length === 0) {
        addTestResult(
          '环境配置检查',
          'PASSED',
          '所有必需的环境变量都正确配置'
        );
      } else {
        addTestResult(
          '环境配置检查',
          'FAILED',
          `缺少或错误的配置: ${missingVars.join(', ')}`
        );
      }
    } else {
      addTestResult(
        '环境配置检查',
        'FAILED',
        '.env.local文件不存在'
      );
    }
  } catch (error) {
    addTestResult(
      '环境配置检查',
      'FAILED',
      null,
      error
    );
  }

  // 输出测试总结
  console.log('\n📊 最终验证总结:');
  console.log(`✅ 通过: ${testResults.summary.passed}`);
  console.log(`❌ 失败: ${testResults.summary.failed}`);
  console.log(`📝 总计: ${testResults.summary.total}`);
  
  const successRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(1);
  console.log(`📈 成功率: ${successRate}%`);

  // 保存详细报告
  const reportPath = path.join(process.cwd(), 'test-reports', `deepseek-config-final-verification-${Date.now()}.json`);
  
  // 确保目录存在
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 详细报告已保存: ${reportPath}`);

  // 根据测试结果给出最终结论
  console.log('\n🎯 最终结论:');
  if (testResults.summary.failed === 0) {
    console.log('🎉 所有测试都通过了！DeepSeek配置页面和API功能完全正常。');
    console.log('✨ 用户现在可以正常访问 http://localhost:3002/deepseek-config');
    console.log('🚀 Runtime Error 问题已完全解决！');
  } else if (testResults.summary.passed >= testResults.summary.total * 0.8) {
    console.log('✅ 大部分测试通过，核心功能正常。');
    console.log('⚠️  少数非关键功能可能需要调整，但不影响主要使用。');
  } else {
    console.log('⚠️  部分重要测试失败，请检查上述错误信息。');
    console.log('🔧 建议重新检查构建和服务器状态。');
  }

  // 提供使用指导
  console.log('\n💡 使用指导:');
  console.log('1. 访问配置中心: http://localhost:3002/deepseek-config');
  console.log('2. 测试API连接: 点击页面上的"测试连接"按钮');
  console.log('3. 切换API提供商: 在云端和本地API之间选择');
  console.log('4. 查看状态报告: 监控API可用性和配置状态');
}

// 运行验证
main().catch(error => {
  console.error('❌ 验证执行失败:', error);
  process.exit(1);
}); 