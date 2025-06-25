#!/usr/bin/env node

const fs = require('fs');

/**
 * 测试本地API修复
 */
async function testLocalAPIFix() {
  console.log('🔧 测试本地API修复...\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // 1. 测试Ollama服务状态
    console.log('1️⃣ 检查Ollama服务状态...');
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Ollama服务运行正常');
        console.log(`📊 可用模型数量: ${data.models?.length || 0}`);
        
        if (data.models && data.models.length > 0) {
          console.log('📋 可用模型:');
          data.models.forEach(model => {
            console.log(`   - ${model.name} (${model.size} bytes)`);
          });
          results.tests.ollamaService = {
            status: 'success',
            models: data.models.map(m => m.name)
          };
        } else {
          console.log('⚠️ 没有可用的模型');
          results.tests.ollamaService = {
            status: 'warning',
            message: '没有可用的模型'
          };
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Ollama服务不可用:', error.message);
      results.tests.ollamaService = {
        status: 'error',
        error: error.message
      };
      return results;
    }

    // 2. 测试聊天API端点
    console.log('\n2️⃣ 测试聊天API端点...');
    try {
      const chatResponse = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-r1:8b',
          messages: [
            { role: 'user', content: '你好，请简单回复' }
          ],
          stream: false
        })
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        console.log('✅ 聊天API测试成功');
        console.log(`📝 回复: ${chatData.message?.content?.substring(0, 100)}...`);
        results.tests.chatAPI = {
          status: 'success',
          response: chatData.message?.content?.substring(0, 200)
        };
      } else {
        const errorText = await chatResponse.text();
        console.log('❌ 聊天API测试失败:', chatResponse.status, errorText);
        results.tests.chatAPI = {
          status: 'error',
          httpStatus: chatResponse.status,
          error: errorText
        };
      }
    } catch (error) {
      console.log('❌ 聊天API连接失败:', error.message);
      results.tests.chatAPI = {
        status: 'error',
        error: error.message
      };
    }

    // 3. 测试配置页面的API调用
    console.log('\n3️⃣ 测试配置页面API调用...');
    try {
      const configResponse = await fetch('http://localhost:3002/api/deepseek-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test',
          provider: 'local'
        })
      });

      if (configResponse.ok) {
        const configData = await configResponse.json();
        console.log('✅ 配置页面API测试成功');
        console.log(`📊 结果:`, configData);
        results.tests.configAPI = {
          status: 'success',
          data: configData
        };
      } else {
        const errorText = await configResponse.text();
        console.log('❌ 配置页面API测试失败:', configResponse.status);
        console.log('📝 错误详情:', errorText);
        results.tests.configAPI = {
          status: 'error',
          httpStatus: configResponse.status,
          error: errorText
        };
      }
    } catch (error) {
      console.log('❌ 配置页面API连接失败:', error.message);
      results.tests.configAPI = {
        status: 'error',
        error: error.message
      };
    }

    // 4. 检查环境变量配置
    console.log('\n4️⃣ 检查环境变量配置...');
    const envFile = '.env.local';
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf-8');
      console.log('✅ .env.local 文件存在');
      
      const envVars = [
        'DEEPSEEK_API_KEY',
        'DEEPSEEK_LOCAL_BASE_URL', 
        'DEEPSEEK_LOCAL_MODEL',
        'DEEPSEEK_CLOUD_BASE_URL',
        'DEEPSEEK_CLOUD_MODEL'
      ];
      
      const configStatus = {};
      envVars.forEach(varName => {
        const hasVar = envContent.includes(varName);
        console.log(`${hasVar ? '✅' : '❌'} ${varName}: ${hasVar ? '已配置' : '未配置'}`);
        configStatus[varName] = hasVar;
      });
      
      results.tests.environment = {
        status: 'success',
        variables: configStatus
      };
    } else {
      console.log('❌ .env.local 文件不存在');
      results.tests.environment = {
        status: 'error',
        error: '.env.local 文件不存在'
      };
    }

  } catch (error) {
    console.error('💥 测试过程中出现错误:', error);
    results.tests.general = {
      status: 'error',
      error: error.message
    };
  }

  // 保存测试结果
  const reportFile = `test-reports/local-api-fix-${Date.now()}.json`;
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 测试报告已保存: ${reportFile}`);

  // 总结
  console.log('\n📋 测试总结:');
  const testResults = Object.values(results.tests);
  const successCount = testResults.filter(t => t.status === 'success').length;
  const errorCount = testResults.filter(t => t.status === 'error').length;
  const warningCount = testResults.filter(t => t.status === 'warning').length;

  console.log(`✅ 成功: ${successCount}`);
  console.log(`❌ 失败: ${errorCount}`);
  console.log(`⚠️ 警告: ${warningCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 所有测试通过！本地API配置正常。');
  } else {
    console.log('\n🔧 存在问题需要修复，请查看上述错误信息。');
  }

  return results;
}

// 运行测试
if (require.main === module) {
  testLocalAPIFix().catch(console.error);
}

module.exports = { testLocalAPIFix }; 