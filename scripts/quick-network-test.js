#!/usr/bin/env node

/**
 * 快速网络连接测试工具
 * 用于诊断网络连接问题
 */

console.log('🌐 快速网络连接测试');
console.log('====================\n');

/**
 * 测试通用网站连接
 */
async function testGeneralConnectivity() {
  const sites = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'GitHub', url: 'https://api.github.com' },
    { name: 'Cloudflare', url: 'https://1.1.1.1' }
  ];
  
  console.log('🔍 测试通用网站连接:');
  
  for (const site of sites) {
    try {
      const startTime = Date.now();
      const response = await fetch(site.url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      const endTime = Date.now();
      
      console.log(`   ✅ ${site.name}: ${response.status} (${endTime - startTime}ms)`);
    } catch (error) {
      console.log(`   ❌ ${site.name}: ${error.message}`);
    }
  }
}

/**
 * 测试OpenAI相关连接
 */
async function testOpenAIConnectivity() {
  const openaiEndpoints = [
    { name: 'OpenAI主站', url: 'https://openai.com' },
    { name: 'OpenAI API', url: 'https://api.openai.com' },
    { name: 'OpenAI状态页', url: 'https://status.openai.com' }
  ];
  
  console.log('\n🤖 测试OpenAI相关连接:');
  
  for (const endpoint of openaiEndpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint.url, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(10000)
      });
      const endTime = Date.now();
      
      console.log(`   ✅ ${endpoint.name}: ${response.status} (${endTime - startTime}ms)`);
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
    }
  }
}

/**
 * DNS解析测试
 */
async function testDNSResolution() {
  console.log('\n🔍 DNS解析测试:');
  
  const domains = [
    'api.openai.com',
    'openai.com',
    'google.com'
  ];
  
  for (const domain of domains) {
    try {
      const startTime = Date.now();
      // 使用DNS查询API
      const response = await fetch(`https://1.1.1.1/dns-query?name=${domain}&type=A`, {
        headers: { 'Accept': 'application/dns-json' },
        signal: AbortSignal.timeout(5000)
      });
      const endTime = Date.now();
      
      if (response.ok) {
        const data = await response.json();
        const ips = data.Answer?.map(a => a.data) || [];
        console.log(`   ✅ ${domain}: ${ips.join(', ')} (${endTime - startTime}ms)`);
      } else {
        console.log(`   ❌ ${domain}: DNS查询失败`);
      }
    } catch (error) {
      console.log(`   ❌ ${domain}: ${error.message}`);
    }
  }
}

/**
 * 网络环境诊断
 */
async function diagnoseNetworkEnvironment() {
  console.log('\n🩺 网络环境诊断:');
  
  // 检查用户代理
  console.log(`   📱 运行环境: Node.js ${process.version}`);
  console.log(`   🖥️  操作系统: ${process.platform} ${process.arch}`);
  
  // 检查环境变量中的代理设置
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy'];
  const proxies = proxyVars.filter(v => process.env[v]);
  
  if (proxies.length > 0) {
    console.log(`   🔀 检测到代理设置: ${proxies.join(', ')}`);
  } else {
    console.log(`   ➡️  未检测到代理设置`);
  }
  
  // 检查网络接口（仅限支持的平台）
  try {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const activeInterfaces = Object.keys(interfaces).filter(name => 
      interfaces[name].some(iface => !iface.internal && iface.family === 'IPv4')
    );
    console.log(`   🔌 活动网络接口: ${activeInterfaces.join(', ')}`);
  } catch (error) {
    console.log(`   ⚠️  无法获取网络接口信息`);
  }
}

/**
 * 提供解决方案建议
 */
function provideSolutions() {
  console.log('\n💡 解决方案建议:');
  console.log('================');
  
  console.log('\n🔧 网络连接问题:');
  console.log('   1. 检查网络连接是否正常');
  console.log('   2. 尝试访问 https://api.openai.com （浏览器测试）');
  console.log('   3. 检查防火墙设置是否阻止了HTTPS连接');
  console.log('   4. 尝试使用手机热点或其他网络环境');
  
  console.log('\n🌍 网络环境优化:');
  console.log('   1. 如果在企业网络环境，联系网络管理员');
  console.log('   2. 考虑使用VPN服务改善连接质量');
  console.log('   3. 检查DNS设置，可尝试使用8.8.8.8或1.1.1.1');
  console.log('   4. 临时禁用代理软件进行测试');
  
  console.log('\n⚙️  系统配置:');
  console.log('   1. 系统已支持智能降级到模拟向量');
  console.log('   2. 在网络问题解决前，系统仍可正常工作');
  console.log('   3. 模拟向量提供基本的语义匹配功能');
  console.log('   4. 建议定期检查网络连接状态');
}

/**
 * 主测试流程
 */
async function runQuickTest() {
  try {
    console.log(`开始时间: ${new Date().toLocaleString()}\n`);
    
    await testGeneralConnectivity();
    await testOpenAIConnectivity();
    await testDNSResolution();
    await diagnoseNetworkEnvironment();
    
    provideSolutions();
    
    console.log(`\n测试完成时间: ${new Date().toLocaleString()}`);
    console.log('====================================');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
if (require.main === module) {
  runQuickTest();
} 