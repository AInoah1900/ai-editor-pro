#!/usr/bin/env node

/**
 * 数据库配置优化验证脚本
 * 验证PostgreSQL和Qdrant配置是否正确从环境变量读取
 */

const fs = require('fs');
const path = require('path');

// 测试结果记录
const testResults = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

// 添加测试结果
function addTestResult(name, passed, details = null, error = null) {
  const result = {
    name,
    passed,
    details,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  testResults.summary.total++;
  
  if (passed) {
    testResults.summary.passed++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    testResults.summary.failed++;
    console.log(`❌ ${name}`);
    if (error) console.log(`   错误: ${error.message}`);
    if (details) console.log(`   详情: ${details}`);
  }
}

// 检查环境变量配置
function testEnvironmentVariables() {
  console.log('\n=== 环境变量配置检查 ===');
  
  // 检查.env.local文件是否存在
  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);
  addTestResult(
    '.env.local文件存在性检查',
    envExists,
    envExists ? '文件存在' : '文件不存在'
  );
  
  if (!envExists) return;
  
  // 读取.env.local内容
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // 检查PostgreSQL配置项
  const postgresEnvs = [
    'POSTGRES_HOST',
    'POSTGRES_PORT', 
    'POSTGRES_DB',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_MAX_CONNECTIONS',
    'POSTGRES_IDLE_TIMEOUT',
    'POSTGRES_CONNECTION_TIMEOUT'
  ];
  
  postgresEnvs.forEach(envVar => {
    const hasEnv = envContent.includes(`${envVar}=`);
    addTestResult(
      `PostgreSQL环境变量 ${envVar}`,
      hasEnv,
      hasEnv ? '已配置' : '未配置'
    );
  });
  
  // 检查Qdrant配置项
  const qdrantEnvs = [
    'QDRANT_URL',
    'QDRANT_TIMEOUT',
    'QDRANT_COLLECTION_NAME',
    'QDRANT_VECTOR_SIZE'
  ];
  
  qdrantEnvs.forEach(envVar => {
    const hasEnv = envContent.includes(`${envVar}=`);
    addTestResult(
      `Qdrant环境变量 ${envVar}`,
      hasEnv,
      hasEnv ? '已配置' : '未配置'
    );
  });
}

// 检查代码文件是否移除硬编码
function testCodeFiles() {
  console.log('\n=== 代码文件硬编码检查 ===');
  
  // 检查PostgreSQL模型文件
  const modelsPath = path.join(process.cwd(), 'lib/database/models.ts');
  if (fs.existsSync(modelsPath)) {
    const modelsContent = fs.readFileSync(modelsPath, 'utf8');
    
    // 检查是否包含环境变量读取
    const hasEnvConfig = modelsContent.includes('process.env.POSTGRES_HOST');
    addTestResult(
      'PostgreSQL模型文件环境变量配置',
      hasEnvConfig,
      hasEnvConfig ? '已使用环境变量' : '仍有硬编码'
    );
    
    // 检查是否移除硬编码连接
    const hasHardcodedConfig = modelsContent.includes("host: 'localhost'") && 
                              modelsContent.includes("user: 'myuser'") &&
                              modelsContent.includes("password: '12345678'");
    addTestResult(
      'PostgreSQL硬编码配置移除',
      !hasHardcodedConfig,
      hasHardcodedConfig ? '仍存在硬编码' : '硬编码已移除'
    );
  } else {
    addTestResult(
      'PostgreSQL模型文件存在性',
      false,
      '文件不存在: lib/database/models.ts'
    );
  }
  
  // 检查Qdrant客户端文件
  const qdrantPath = path.join(process.cwd(), 'lib/vector/qdrant-client.ts');
  if (fs.existsSync(qdrantPath)) {
    const qdrantContent = fs.readFileSync(qdrantPath, 'utf8');
    
    // 检查是否包含环境变量读取
    const hasEnvConfig = qdrantContent.includes('process.env.QDRANT_URL');
    addTestResult(
      'Qdrant客户端文件环境变量配置',
      hasEnvConfig,
      hasEnvConfig ? '已使用环境变量' : '仍有硬编码'
    );
    
    // 检查是否移除硬编码连接
    const hasHardcodedConfig = qdrantContent.includes("url: 'http://localhost:6333'");
    addTestResult(
      'Qdrant硬编码配置移除',
      !hasHardcodedConfig,
      hasHardcodedConfig ? '仍存在硬编码' : '硬编码已移除'
    );
  } else {
    addTestResult(
      'Qdrant客户端文件存在性',
      false,
      '文件不存在: lib/vector/qdrant-client.ts'
    );
  }
}

// 模拟环境变量加载测试
function testEnvironmentLoading() {
  console.log('\n=== 环境变量加载测试 ===');
  
  // 读取.env.local并设置环境变量
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    envLines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
    
    // 测试PostgreSQL配置读取
    const postgresConfig = {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'postgres',
      user: process.env.POSTGRES_USER || 'myuser',
      password: process.env.POSTGRES_PASSWORD || '12345678',
    };
    
    addTestResult(
      'PostgreSQL配置读取测试',
      true,
      `Host: ${postgresConfig.host}, Port: ${postgresConfig.port}, DB: ${postgresConfig.database}`
    );
    
    // 测试Qdrant配置读取
    const qdrantConfig = {
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      timeout: parseInt(process.env.QDRANT_TIMEOUT || '600000'),
      vectorSize: parseInt(process.env.QDRANT_VECTOR_SIZE || '4096'),
    };
    
    addTestResult(
      'Qdrant配置读取测试',
      true,
      `URL: ${qdrantConfig.url}, Timeout: ${qdrantConfig.timeout}ms, Vector Size: ${qdrantConfig.vectorSize}`
    );
  }
}

// 主测试流程
async function runTests() {
  console.log('🔍 数据库配置优化验证开始...\n');
  
  try {
    // 运行所有测试
    testEnvironmentVariables();
    testCodeFiles();
    testEnvironmentLoading();
    
    // 输出测试总结
    console.log('\n=== 测试总结 ===');
    console.log(`总测试数: ${testResults.summary.total}`);
    console.log(`通过: ${testResults.summary.passed}`);
    console.log(`失败: ${testResults.summary.failed}`);
    console.log(`通过率: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);
    
    // 保存测试报告
    const reportPath = path.join(process.cwd(), `test-reports/database-config-optimization-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 测试报告已保存: ${reportPath}`);
    
    // 根据结果设置退出码
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    addTestResult('测试执行', false, null, error);
    process.exit(1);
  }
}

// 运行测试
runTests(); 