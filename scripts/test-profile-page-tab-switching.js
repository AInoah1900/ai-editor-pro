const puppeteer = require('puppeteer');

async function testProfilePageTabSwitching() {
  console.log('🧪 个人中心页面Tab切换功能测试');
  console.log('=====================================');

  let browser;
  let testResults = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    results: []
  };

  try {
    // 启动浏览器
    browser = await puppeteer.launch({ 
      headless: false, // 设置为false以便观察测试过程
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();

    // 测试1: 访问个人中心页面，检查默认Tab状态
    console.log('\n📋 测试1: 检查个人中心页面默认Tab状态');
    testResults.totalTests++;
    
    await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle2' });
    
    // 等待页面加载完成
    await page.waitForSelector('.border-b-2', { timeout: 5000 });
    
    // 检查默认是否显示登录Tab
    const loginTabActive = await page.evaluate(() => {
      const loginTab = document.querySelector('button:nth-child(1)');
      return loginTab && loginTab.classList.contains('text-blue-600');
    });
    
    if (loginTabActive) {
      console.log('✅ 默认显示登录Tab - 通过');
      testResults.passedTests++;
      testResults.results.push({ test: '默认Tab状态', status: '通过', details: '默认显示登录Tab' });
    } else {
      console.log('❌ 默认Tab状态异常 - 失败');
      testResults.failedTests++;
      testResults.results.push({ test: '默认Tab状态', status: '失败', details: '未默认显示登录Tab' });
    }

    // 测试2: 点击注册Tab，检查切换效果
    console.log('\n📋 测试2: 点击注册Tab检查切换效果');
    testResults.totalTests++;
    
    await page.click('button:nth-child(2)'); // 点击注册Tab
    await page.waitForTimeout(500); // 等待切换完成
    
    // 检查注册Tab是否激活
    const registerTabActive = await page.evaluate(() => {
      const registerTab = document.querySelector('button:nth-child(2)');
      return registerTab && registerTab.classList.contains('text-blue-600');
    });
    
    // 检查URL哈希是否变化
    const currentHash = await page.evaluate(() => window.location.hash);
    
    if (registerTabActive && currentHash === '#register') {
      console.log('✅ 注册Tab切换成功 - 通过');
      console.log(`   URL哈希: ${currentHash}`);
      testResults.passedTests++;
      testResults.results.push({ test: '注册Tab切换', status: '通过', details: `Tab激活且URL哈希为${currentHash}` });
    } else {
      console.log('❌ 注册Tab切换失败 - 失败');
      console.log(`   Tab激活: ${registerTabActive}, URL哈希: ${currentHash}`);
      testResults.failedTests++;
      testResults.results.push({ test: '注册Tab切换', status: '失败', details: `Tab激活: ${registerTabActive}, URL哈希: ${currentHash}` });
    }

    // 测试3: 检查注册表单是否显示
    console.log('\n📋 测试3: 检查注册表单显示');
    testResults.totalTests++;
    
    const registerFormVisible = await page.evaluate(() => {
      const registerTitle = document.querySelector('h2');
      return registerTitle && registerTitle.textContent.includes('用户注册');
    });
    
    if (registerFormVisible) {
      console.log('✅ 注册表单正确显示 - 通过');
      testResults.passedTests++;
      testResults.results.push({ test: '注册表单显示', status: '通过', details: '注册表单正确显示' });
    } else {
      console.log('❌ 注册表单未显示 - 失败');
      testResults.failedTests++;
      testResults.results.push({ test: '注册表单显示', status: '失败', details: '注册表单未正确显示' });
    }

    // 测试4: 点击注册表单中的"立即登录"链接
    console.log('\n📋 测试4: 点击注册表单中的"立即登录"链接');
    testResults.totalTests++;
    
    await page.click('a[href="#login"]');
    await page.waitForTimeout(500);
    
    // 检查是否切换到登录Tab
    const backToLoginTab = await page.evaluate(() => {
      const loginTab = document.querySelector('button:nth-child(1)');
      return loginTab && loginTab.classList.contains('text-blue-600');
    });
    
    const loginHash = await page.evaluate(() => window.location.hash);
    
    if (backToLoginTab && loginHash === '#login') {
      console.log('✅ "立即登录"链接切换成功 - 通过');
      console.log(`   URL哈希: ${loginHash}`);
      testResults.passedTests++;
      testResults.results.push({ test: '"立即登录"链接', status: '通过', details: `成功切换到登录Tab，URL哈希: ${loginHash}` });
    } else {
      console.log('❌ "立即登录"链接切换失败 - 失败');
      console.log(`   Tab激活: ${backToLoginTab}, URL哈希: ${loginHash}`);
      testResults.failedTests++;
      testResults.results.push({ test: '"立即登录"链接', status: '失败', details: `Tab激活: ${backToLoginTab}, URL哈希: ${loginHash}` });
    }

    // 测试5: 检查登录表单是否显示
    console.log('\n📋 测试5: 检查登录表单显示');
    testResults.totalTests++;
    
    const loginFormVisible = await page.evaluate(() => {
      const loginTitle = document.querySelector('h2');
      return loginTitle && loginTitle.textContent.includes('用户登录');
    });
    
    if (loginFormVisible) {
      console.log('✅ 登录表单正确显示 - 通过');
      testResults.passedTests++;
      testResults.results.push({ test: '登录表单显示', status: '通过', details: '登录表单正确显示' });
    } else {
      console.log('❌ 登录表单未显示 - 失败');
      testResults.failedTests++;
      testResults.results.push({ test: '登录表单显示', status: '失败', details: '登录表单未正确显示' });
    }

    // 测试6: 点击登录表单中的"立即注册"链接
    console.log('\n📋 测试6: 点击登录表单中的"立即注册"链接');
    testResults.totalTests++;
    
    await page.click('a[href="#register"]');
    await page.waitForTimeout(500);
    
    const backToRegisterTab = await page.evaluate(() => {
      const registerTab = document.querySelector('button:nth-child(2)');
      return registerTab && registerTab.classList.contains('text-blue-600');
    });
    
    const registerHash2 = await page.evaluate(() => window.location.hash);
    
    if (backToRegisterTab && registerHash2 === '#register') {
      console.log('✅ "立即注册"链接切换成功 - 通过');
      console.log(`   URL哈希: ${registerHash2}`);
      testResults.passedTests++;
      testResults.results.push({ test: '"立即注册"链接', status: '通过', details: `成功切换到注册Tab，URL哈希: ${registerHash2}` });
    } else {
      console.log('❌ "立即注册"链接切换失败 - 失败');
      console.log(`   Tab激活: ${backToRegisterTab}, URL哈希: ${registerHash2}`);
      testResults.failedTests++;
      testResults.results.push({ test: '"立即注册"链接', status: '失败', details: `Tab激活: ${backToRegisterTab}, URL哈希: ${registerHash2}` });
    }

    // 测试7: 浏览器前进后退按钮测试
    console.log('\n📋 测试7: 浏览器前进后退按钮功能');
    testResults.totalTests++;
    
    await page.goBack(); // 后退
    await page.waitForTimeout(500);
    
    const backButtonHash = await page.evaluate(() => window.location.hash);
    const backButtonTab = await page.evaluate(() => {
      const loginTab = document.querySelector('button:nth-child(1)');
      return loginTab && loginTab.classList.contains('text-blue-600') ? 'login' : 'register';
    });
    
    if (backButtonHash === '#login' && backButtonTab === 'login') {
      console.log('✅ 浏览器后退按钮功能正常 - 通过');
      console.log(`   URL哈希: ${backButtonHash}, 当前Tab: ${backButtonTab}`);
      testResults.passedTests++;
      testResults.results.push({ test: '浏览器后退功能', status: '通过', details: `后退到登录Tab，URL同步` });
    } else {
      console.log('❌ 浏览器后退按钮功能异常 - 失败');
      console.log(`   URL哈希: ${backButtonHash}, 当前Tab: ${backButtonTab}`);
      testResults.failedTests++;
      testResults.results.push({ test: '浏览器后退功能', status: '失败', details: `哈希: ${backButtonHash}, Tab: ${backButtonTab}` });
    }

    // 测试8: 直接访问带哈希的URL
    console.log('\n📋 测试8: 直接访问带哈希的URL');
    testResults.totalTests++;
    
    await page.goto('http://localhost:3000/profile#register', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(500);
    
    const directHashTab = await page.evaluate(() => {
      const registerTab = document.querySelector('button:nth-child(2)');
      return registerTab && registerTab.classList.contains('text-blue-600');
    });
    
    const directHashUrl = await page.evaluate(() => window.location.hash);
    
    if (directHashTab && directHashUrl === '#register') {
      console.log('✅ 直接访问哈希URL功能正常 - 通过');
      console.log(`   URL哈希: ${directHashUrl}`);
      testResults.passedTests++;
      testResults.results.push({ test: '直接访问哈希URL', status: '通过', details: '正确显示注册Tab' });
    } else {
      console.log('❌ 直接访问哈希URL功能异常 - 失败');
      console.log(`   Tab激活: ${directHashTab}, URL哈希: ${directHashUrl}`);
      testResults.failedTests++;
      testResults.results.push({ test: '直接访问哈希URL', status: '失败', details: `Tab激活: ${directHashTab}, URL: ${directHashUrl}` });
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    testResults.failedTests++;
    testResults.results.push({ test: '测试执行', status: '错误', details: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // 输出测试结果
  console.log('\n🎯 测试结果总结');
  console.log('=====================================');
  console.log(`📊 总测试数: ${testResults.totalTests}`);
  console.log(`✅ 通过测试: ${testResults.passedTests}`);
  console.log(`❌ 失败测试: ${testResults.failedTests}`);
  console.log(`📈 通过率: ${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%`);

  if (testResults.results.length > 0) {
    console.log('\n📋 详细测试结果:');
    testResults.results.forEach((result, index) => {
      const statusIcon = result.status === '通过' ? '✅' : result.status === '失败' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${statusIcon} ${result.test}: ${result.status}`);
      if (result.details) {
        console.log(`   详情: ${result.details}`);
      }
    });
  }

  console.log('\n🎉 个人中心页面Tab切换测试完成！');

  if (testResults.failedTests === 0) {
    console.log('🌟 所有测试通过！Tab切换功能工作正常。');
    return true;
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能。');
    return false;
  }
}

// 运行测试
if (require.main === module) {
  testProfilePageTabSwitching().catch(console.error);
}

module.exports = testProfilePageTabSwitching; 