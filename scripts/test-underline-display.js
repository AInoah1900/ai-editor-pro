const http = require('http');

console.log('🧪 测试智能编辑加工功能的下划线显示');

// 测试页面访问
function testPageAccess() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/test-editor',
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 页面访问状态: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          console.log('✅ 页面访问成功');
          
          // 检查关键元素
          const hasTitle = data.includes('智能编辑加工功能测试');
          const hasErrorStyles = data.includes('error-underline') || data.includes('warning-underline') || data.includes('suggestion-underline');
          const hasContent = data.includes('这是是') && data.includes('人工') && data.includes('全个');
          
          console.log(`📋 页面标题检查: ${hasTitle ? '✅ 通过' : '❌ 失败'}`);
          console.log(`🎨 错误样式检查: ${hasErrorStyles ? '✅ 通过' : '❌ 失败'}`);
          console.log(`📝 测试内容检查: ${hasContent ? '✅ 通过' : '❌ 失败'}`);
          
          // 检查CSS样式是否正确应用
          if (data.includes('border-bottom: 2px solid #ef4444')) {
            console.log('🔴 红色下划线样式: ✅ 已定义');
          }
          if (data.includes('border-bottom: 2px solid #f59e0b')) {
            console.log('🟡 黄色下划线样式: ✅ 已定义');
          }
          if (data.includes('border-bottom: 2px solid #10b981')) {
            console.log('🟢 绿色下划线样式: ✅ 已定义');
          }
          
          resolve({
            success: true,
            hasTitle,
            hasErrorStyles,
            hasContent,
            statusCode: res.statusCode
          });
        } else {
          console.log(`❌ 页面访问失败: ${res.statusCode}`);
          resolve({
            success: false,
            statusCode: res.statusCode,
            error: `HTTP ${res.statusCode}`
          });
        }
      });
    });

    req.on('error', (err) => {
      console.log(`❌ 请求错误: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.log('❌ 请求超时');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 主测试函数
async function runTests() {
  try {
    console.log('🚀 开始测试...');
    console.log('');
    
    // 等待服务器启动
    console.log('⏳ 等待开发服务器启动...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const result = await testPageAccess();
    
    console.log('');
    console.log('📊 测试结果汇总:');
    console.log(`   页面访问: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    
    if (result.success) {
      console.log('   功能检查:');
      console.log(`     - 页面标题: ${result.hasTitle ? '✅' : '❌'}`);
      console.log(`     - 错误样式: ${result.hasErrorStyles ? '✅' : '❌'}`);
      console.log(`     - 测试内容: ${result.hasContent ? '✅' : '❌'}`);
      
      const allPassed = result.hasTitle && result.hasErrorStyles && result.hasContent;
      console.log('');
      console.log(`🎯 总体状态: ${allPassed ? '✅ 全部通过' : '⚠️ 部分问题'}`);
      
      if (allPassed) {
        console.log('');
        console.log('🎉 测试完成！请访问 http://localhost:3000/test-editor 查看效果');
        console.log('');
        console.log('📝 测试说明:');
        console.log('   1. 页面中应该显示彩色下划线标记错误文字');
        console.log('   2. 鼠标悬停在下划线文字上应显示弹窗');
        console.log('   3. 弹窗提供替换、编辑、忽略三种操作');
        console.log('   4. 不同错误类型使用不同颜色下划线');
      }
    } else {
      console.log(`❌ 测试失败: ${result.error}`);
    }
    
  } catch (error) {
    console.log(`❌ 测试过程中出现错误: ${error.message}`);
  }
}

// 运行测试
runTests(); 