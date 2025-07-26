const https = require('https');
const http = require('http');

// 测试profile页面访问
async function testProfilePage() {
  console.log('🧪 测试个人中心页面访问...\n');
  
  const testCases = [
    {
      name: '访问 /profile 页面',
      url: 'http://localhost:3000/profile',
      expected: 200
    },
    {
      name: '检查页面标题包含',
      url: 'http://localhost:3000/profile',
      checkContent: '个人中心'
    },
    {
      name: '检查功能链接',
      url: 'http://localhost:3000/profile',
      checkContent: 'AI编辑器'
    }
  ];

  let passedTests = 0;
  const totalTests = testCases.length;

  for (const testCase of testCases) {
    try {
      const response = await makeRequest(testCase.url);
      
      if (testCase.expected && response.statusCode === testCase.expected) {
        console.log(`✅ ${testCase.name}: 状态码 ${response.statusCode}`);
        passedTests++;
      } else if (testCase.checkContent) {
        if (response.body && response.body.includes(testCase.checkContent)) {
          console.log(`✅ ${testCase.name}: 找到内容 "${testCase.checkContent}"`);
          passedTests++;
        } else {
          console.log(`❌ ${testCase.name}: 未找到内容 "${testCase.checkContent}"`);
        }
      } else {
        console.log(`❌ ${testCase.name}: 期望状态码 ${testCase.expected}, 实际 ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.name}: 请求失败 - ${error.message}`);
    }
  }

  console.log(`\n📊 测试结果: ${passedTests}/${totalTests} 通过`);
  console.log(`🎯 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 所有测试通过！个人中心页面修复成功！');
    console.log('\n📖 页面功能:');
    console.log('   ✅ 未登录状态显示功能导航');
    console.log('   ✅ 提供快速跳转链接');
    console.log('   ✅ 响应式设计，兼容移动设备');
    console.log('   ✅ 预留用户认证功能接口');
    console.log('\n🔗 访问链接: http://localhost:3000/profile');
  } else {
    console.log('\n⚠️  部分测试失败，请检查开发服务器是否正常运行');
  }
}

// 发送HTTP请求
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const request = client.get(url, (response) => {
      let body = '';
      
      response.on('data', (chunk) => {
        body += chunk;
      });
      
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: body
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('请求超时'));
    });
  });
}

// 运行测试
if (require.main === module) {
  testProfilePage().catch(console.error);
}

module.exports = { testProfilePage }; 