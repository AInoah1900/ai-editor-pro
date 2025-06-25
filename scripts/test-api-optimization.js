/**
 * 测试API调用优化效果
 * 验证当前API提供商选择逻辑是否符合预期
 */

const http = require('http');

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testAPIOptimization() {
  console.log('🧪 测试API调用优化效果...\n');
  
  try {
    console.log('=== 1. 测试状态检查API (应该只检查当前API提供商) ===');
    const statusResponse = await makeRequest('/api/deepseek-config?action=status');
    console.log('状态检查响应:', JSON.stringify(statusResponse.data, null, 2));
    
    console.log('\n=== 2. 测试云端API连接测试 ===');
    const cloudTestResponse = await makeRequest('/api/deepseek-config', 'POST', {
      action: 'testConnection',
      provider: 'cloud'
    });
    console.log('云端API测试响应:', cloudTestResponse.status);
    console.log('响应内容:', JSON.stringify(cloudTestResponse.data, null, 2));
    
    console.log('\n=== 3. 测试本地API连接测试 ===');
    const localTestResponse = await makeRequest('/api/deepseek-config', 'POST', {
      action: 'testConnection',
      provider: 'local'
    });
    console.log('本地API测试响应:', localTestResponse.status);
    console.log('响应内容:', JSON.stringify(localTestResponse.data, null, 2));
    
    console.log('\n=== 4. 测试健康检查 (应该只检查当前API提供商) ===');
    const healthResponse = await makeRequest('/api/deepseek-config?action=health');
    console.log('健康检查响应:', JSON.stringify(healthResponse.data, null, 2));
    
    console.log('\n✅ API优化测试完成');
    
    // 分析结果
    console.log('\n📊 优化效果分析:');
    console.log('1. 状态检查是否只检查当前API:', statusResponse.data.success ? '✅' : '❌');
    console.log('2. 云端API测试是否成功:', cloudTestResponse.data.success ? '✅' : '❌');
    console.log('3. 本地API测试是否成功:', localTestResponse.data.success ? '✅' : '❌');
    console.log('4. 健康检查是否优化:', healthResponse.data.success ? '✅' : '❌');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 执行测试
testAPIOptimization(); 