const http = require('http');

console.log('🔍 检查客户端渲染后的页面内容...\n');

function getPageContent() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/profile',
      method: 'GET',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          content: data
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('请求超时'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function checkContent() {
  try {
    console.log('📡 获取页面内容...');
    const response = await getPageContent();
    
    console.log(`📊 状态码: ${response.statusCode}`);
    console.log(`📄 内容长度: ${response.content.length} 字符`);
    
    // 检查是否包含客户端渲染标记
    if (response.content.includes('加载中...')) {
      console.log('✅ 发现客户端渲染标记: "加载中..."');
    }
    
    // 检查页面标题
    if (response.content.includes('AI Editor Pro')) {
      console.log('✅ 发现页面标题: "AI Editor Pro"');
    }
    
    // 检查是否有hydration相关内容
    if (response.content.includes('__next_f')) {
      console.log('✅ 发现Next.js hydration标记');
    }
    
    // 输出页面开头的内容
    console.log('\n📝 页面开头内容:');
    console.log(response.content.substring(0, 500) + '...');
    
    // 查找是否有关于profile的script标记
    if (response.content.includes('app/profile/page.js')) {
      console.log('\n✅ 发现profile页面脚本加载');
    } else {
      console.log('\n❌ 未发现profile页面脚本加载');
    }
    
  } catch (error) {
    console.log(`❌ 获取内容失败: ${error.message}`);
  }
}

checkContent(); 