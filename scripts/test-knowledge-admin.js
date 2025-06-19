async function testKnowledgeAdmin() {
  console.log('🔍 测试知识库管理页面数据...\n');
  
  try {
    // 测试 API 数据获取
    console.log('1. 测试 API 数据获取...');
    const response = await fetch('http://localhost:3000/api/knowledge-base');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API 数据获取成功');
      console.log('📊 统计信息:');
      console.log(`   - 总知识项: ${data.data.total_knowledge_items}`);
      console.log(`   - 总文件数: ${data.data.total_files}`);
      console.log(`   - 向量点数: ${data.data.vector_stats.points_count}`);
      console.log(`   - 最后更新: ${data.data.last_updated}`);
      
      console.log('\n🔬 按领域分布:');
      Object.entries(data.data.domains).forEach(([domain, count]) => {
        console.log(`   - ${domain}: ${count}`);
      });
      
      console.log('\n📚 按类型分布:');
      Object.entries(data.data.types).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
    } else {
      console.log('❌ API 数据获取失败:', data.error);
    }
    
    // 测试页面访问
    console.log('\n2. 测试页面访问...');
    const pageResponse = await fetch('http://localhost:3000/knowledge-admin');
    if (pageResponse.ok) {
      console.log('✅ 页面访问成功');
      const pageText = await pageResponse.text();
      
      // 检查页面是否包含正确的数据字段
      const hasTotalItems = pageText.includes('total_knowledge_items');
      const hasDomains = pageText.includes('domains');
      const hasTypes = pageText.includes('types');
      
      console.log('📋 页面数据字段检查:');
      console.log(`   - total_knowledge_items: ${hasTotalItems ? '✅' : '❌'}`);
      console.log(`   - domains: ${hasDomains ? '✅' : '❌'}`);
      console.log(`   - types: ${hasTypes ? '✅' : '❌'}`);
      
      if (hasTotalItems && hasDomains && hasTypes) {
        console.log('\n🎉 知识库管理页面数据显示修复成功！');
      } else {
        console.log('\n⚠️ 页面可能仍存在数据显示问题');
      }
    } else {
      console.log('❌ 页面访问失败:', pageResponse.status);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testKnowledgeAdmin(); 