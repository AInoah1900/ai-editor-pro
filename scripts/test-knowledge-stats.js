const fetch = require('node-fetch');

async function testKnowledgeStats() {
  console.log('🧪 测试知识库统计数据...\n');
  
  try {
    // 1. 测试基础统计API
    console.log('1️⃣ 测试基础统计API...');
    const statsResponse = await fetch('http://localhost:3002/api/knowledge-base?action=getLibraryStats');
    if (!statsResponse.ok) {
      throw new Error(`HTTP ${statsResponse.status}: ${statsResponse.statusText}`);
    }
    
    const statsResult = await statsResponse.json();
    console.log('基础统计数据:', JSON.stringify(statsResult, null, 2));
    
    // 2. 测试知识项获取API
    console.log('\n2️⃣ 测试知识项获取API...');
    const knowledgeResponse = await fetch('http://localhost:3002/api/knowledge-base?query=&limit=100');
    if (!knowledgeResponse.ok) {
      throw new Error(`HTTP ${knowledgeResponse.status}: ${knowledgeResponse.statusText}`);
    }
    
    const knowledgeResult = await knowledgeResponse.json();
    console.log(`获取到 ${knowledgeResult.knowledge_items?.length || 0} 个知识项`);
    
    // 3. 计算统计数据
    console.log('\n3️⃣ 计算详细统计...');
    const knowledgeItems = knowledgeResult.knowledge_items || [];
    const domains = {};
    const types = {};
    
    knowledgeItems.forEach((item, index) => {
      console.log(`知识项 ${index + 1}: ${item.domain} - ${item.type} - ${item.content.substring(0, 30)}...`);
      
      // 统计领域分布
      if (item.domain) {
        domains[item.domain] = (domains[item.domain] || 0) + 1;
      }
      
      // 统计类型分布
      if (item.type) {
        types[item.type] = (types[item.type] || 0) + 1;
      }
    });
    
    console.log('\n📊 统计结果:');
    console.log('总知识项数:', knowledgeItems.length);
    console.log('按领域分布:', domains);
    console.log('按类型分布:', types);
    
    // 4. 测试前端统计逻辑
    console.log('\n4️⃣ 模拟前端统计逻辑...');
    const combinedStats = {
      total_knowledge_items: knowledgeItems.length,
      total_files: statsResult.stats.total_private + statsResult.stats.total_shared,
      domains,
      types,
      last_updated: new Date().toISOString(),
      vector_stats: {
        vectors_count: knowledgeItems.length,
        points_count: knowledgeItems.length
      }
    };
    
    console.log('前端应该显示的统计数据:');
    console.log(JSON.stringify(combinedStats, null, 2));
    
    // 5. 验证数据完整性
    console.log('\n5️⃣ 验证数据完整性...');
    let isValid = true;
    
    if (knowledgeItems.length === 0) {
      console.log('⚠️  警告: 没有找到知识项');
      isValid = false;
    }
    
    if (Object.keys(domains).length === 0) {
      console.log('⚠️  警告: 没有领域分布数据');
      isValid = false;
    }
    
    if (Object.keys(types).length === 0) {
      console.log('⚠️  警告: 没有类型分布数据');
      isValid = false;
    }
    
    if (isValid) {
      console.log('✅ 统计数据验证通过！');
    } else {
      console.log('❌ 统计数据存在问题');
    }
    
    return isValid;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
}

// 运行测试
testKnowledgeStats()
  .then(success => {
    console.log(`\n🎯 测试${success ? '成功' : '失败'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  }); 