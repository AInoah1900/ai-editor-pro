/**
 * DeepSeek配置修复测试脚本
 * 验证环境变量、API端点、模型配置等
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
  console.log('🧪 开始DeepSeek配置修复测试...\n');

  // 测试1: 检查.env.local文件是否存在
  try {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envExists = fs.existsSync(envLocalPath);
    
    if (envExists) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      addTestResult(
        '.env.local文件存在性检查',
        'PASSED',
        `文件大小: ${envContent.length} 字符`
      );
      
      // 测试2: 检查关键配置项
      const requiredConfigs = [
        'DEEPSEEK_PROVIDER',
        'DEEPSEEK_LOCAL_BASE_URL',
        'DEEPSEEK_LOCAL_MODEL',
        'DEEPSEEK_CLOUD_BASE_URL',
        'DEEPSEEK_CLOUD_MODEL'
      ];
      
      let missingConfigs = [];
      for (const config of requiredConfigs) {
        if (!envContent.includes(config)) {
          missingConfigs.push(config);
        }
      }
      
      if (missingConfigs.length === 0) {
        addTestResult(
          '必需配置项检查',
          'PASSED',
          `所有${requiredConfigs.length}个配置项都存在`
        );
      } else {
        addTestResult(
          '必需配置项检查',
          'FAILED',
          `缺少配置项: ${missingConfigs.join(', ')}`
        );
      }
      
      // 测试3: 检查本地API配置
      if (envContent.includes('DEEPSEEK_LOCAL_BASE_URL=http://localhost:11434/api')) {
        addTestResult(
          '本地API端点配置',
          'PASSED',
          '本地API端点配置正确: http://localhost:11434/api'
        );
      } else {
        addTestResult(
          '本地API端点配置',
          'FAILED',
          '本地API端点配置不正确，应为: http://localhost:11434/api'
        );
      }
      
      // 测试4: 检查本地模型配置
      if (envContent.includes('DEEPSEEK_LOCAL_MODEL=deepseek-r1:8b')) {
        addTestResult(
          '本地模型配置',
          'PASSED',
          '本地模型配置正确: deepseek-r1:8b'
        );
      } else {
        addTestResult(
          '本地模型配置',
          'FAILED',
          '本地模型配置不正确，应为: deepseek-r1:8b'
        );
      }
      
      // 测试5: 检查云端API配置
      if (envContent.includes('DEEPSEEK_CLOUD_BASE_URL=https://api.deepseek.com/v1')) {
        addTestResult(
          '云端API端点配置',
          'PASSED',
          '云端API端点配置正确: https://api.deepseek.com/v1'
        );
      } else {
        addTestResult(
          '云端API端点配置',
          'FAILED',
          '云端API端点配置不正确，应为: https://api.deepseek.com/v1'
        );
      }
      
      // 测试6: 检查云端模型配置
      if (envContent.includes('DEEPSEEK_CLOUD_MODEL=deepseek-chat')) {
        addTestResult(
          '云端模型配置',
          'PASSED',
          '云端模型配置正确: deepseek-chat'
        );
      } else {
        addTestResult(
          '云端模型配置',
          'FAILED',
          '云端模型配置不正确，应为: deepseek-chat'
        );
      }
      
    } else {
      addTestResult(
        '.env.local文件存在性检查',
        'FAILED',
        '.env.local文件不存在'
      );
    }
  } catch (error) {
    addTestResult(
      '.env.local文件检查',
      'FAILED',
      null,
      error
    );
  }

  // 测试7: 检查配置文件代码
  try {
    const configPath = path.join(process.cwd(), 'lib/deepseek/deepseek-config.ts');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // 检查默认配置
      if (configContent.includes("baseURL: 'http://localhost:11434/api'") && 
          configContent.includes("model: 'deepseek-r1:8b'")) {
        addTestResult(
          '配置文件本地API设置',
          'PASSED',
          '本地API默认配置正确'
        );
      } else {
        addTestResult(
          '配置文件本地API设置',
          'FAILED',
          '本地API默认配置不正确'
        );
      }
      
      if (configContent.includes("baseURL: 'https://api.deepseek.com/v1'") && 
          configContent.includes("model: 'deepseek-chat'")) {
        addTestResult(
          '配置文件云端API设置',
          'PASSED',
          '云端API默认配置正确'
        );
      } else {
        addTestResult(
          '配置文件云端API设置',
          'FAILED',
          '云端API默认配置不正确'
        );
      }
    } else {
      addTestResult(
        '配置文件检查',
        'FAILED',
        '配置文件不存在'
      );
    }
  } catch (error) {
    addTestResult(
      '配置文件检查',
      'FAILED',
      null,
      error
    );
  }

  // 测试8: 测试本地API连接（如果可用）
  try {
    console.log('\n🔍 测试本地API连接...');
    const response = await fetch('http://localhost:11434/api/tags', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        const modelNames = data.models.map(m => m.name).join(', ');
        addTestResult(
          '本地API连接测试',
          'PASSED',
          `连接成功，可用模型: ${modelNames}`
        );
        
        // 检查是否包含目标模型
        const hasTargetModel = data.models.some(m => m.name === 'deepseek-r1:8b');
        if (hasTargetModel) {
          addTestResult(
            '目标模型可用性检查',
            'PASSED',
            'deepseek-r1:8b 模型可用'
          );
        } else {
          addTestResult(
            '目标模型可用性检查',
            'FAILED',
            `deepseek-r1:8b 模型不可用，可用模型: ${modelNames}`
          );
        }
      } else {
        addTestResult(
          '本地API连接测试',
          'FAILED',
          '本地API可连接但没有可用模型'
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
      '本地API不可用（这是正常的，如果Ollama未运行）',
      error
    );
  }

  // 测试9: 测试配置API端点
  try {
    console.log('\n🔍 测试配置API端点...');
    const response = await fetch('http://localhost:3002/api/deepseek-config?action=status', {
      method: 'GET',
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      addTestResult(
        '配置API端点测试',
        'PASSED',
        `API响应正常，当前提供商: ${data.data?.currentProvider || '未知'}`
      );
    } else {
      addTestResult(
        '配置API端点测试',
        'FAILED',
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
  } catch (error) {
    addTestResult(
      '配置API端点测试',
      'FAILED',
      '需要启动开发服务器才能测试此功能',
      error
    );
  }

  // 输出测试总结
  console.log('\n📊 测试总结:');
  console.log(`✅ 通过: ${testResults.summary.passed}`);
  console.log(`❌ 失败: ${testResults.summary.failed}`);
  console.log(`📝 总计: ${testResults.summary.total}`);
  
  const successRate = (testResults.summary.passed / testResults.summary.total * 100).toFixed(1);
  console.log(`📈 成功率: ${successRate}%`);

  // 保存详细报告
  const reportPath = path.join(process.cwd(), 'test-reports', `deepseek-config-fix-${Date.now()}.json`);
  
  // 确保目录存在
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  console.log(`\n📄 详细报告已保存: ${reportPath}`);

  // 根据测试结果给出建议
  console.log('\n💡 建议:');
  if (testResults.summary.failed === 0) {
    console.log('🎉 所有测试都通过了！DeepSeek配置修复成功。');
  } else {
    console.log('⚠️  部分测试失败，请检查上述错误信息并进行修复。');
    
    if (testResults.tests.some(t => t.name.includes('本地API连接') && t.status === 'FAILED')) {
      console.log('   - 本地API连接失败是正常的，如果您没有运行Ollama服务');
      console.log('   - 要使用本地API，请先安装并启动Ollama，然后下载deepseek-r1:8b模型');
    }
    
    if (testResults.tests.some(t => t.name.includes('配置API端点') && t.status === 'FAILED')) {
      console.log('   - 配置API端点测试失败是正常的，如果开发服务器未运行');
      console.log('   - 要测试完整功能，请运行: npm run dev');
    }
  }
}

// 运行测试
main().catch(error => {
  console.error('❌ 测试执行失败:', error);
  process.exit(1);
}); 