const { Pool } = require('pg');

// 数据库配置
const pool = new Pool({
  user: 'myuser',
  host: 'localhost',
  database: 'postgres',
  password: '12345678',
  port: 5432,
});

async function fixDatabaseSync() {
  let client;
  
  try {
    console.log('🔧 开始修复数据库同步问题...');
    client = await pool.connect();
    
    // 1. 清理现有数据
    console.log('🗑️ 清理现有不匹配的数据...');
    await client.query('DELETE FROM knowledge_items');
    await client.query('DELETE FROM file_metadata');
    
    // 2. 清理Qdrant数据
    console.log('🗑️ 清理Qdrant向量数据...');
    const response = await fetch('http://localhost:6333/collections/knowledge_vectors', {
      method: 'DELETE'
    });
    
    if (response.ok) {
      console.log('✅ Qdrant集合删除成功');
    } else {
      console.log('⚠️ Qdrant集合删除失败，可能不存在');
    }
    
    // 3. 重新创建Qdrant集合
    console.log('🔄 重新创建Qdrant集合...');
    const createResponse = await fetch('http://localhost:6333/collections/knowledge_vectors', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vectors: {
          size: 4096,
          distance: 'Cosine'
        }
      })
    });
    
    if (createResponse.ok) {
      console.log('✅ Qdrant集合创建成功');
    } else {
      console.log('❌ Qdrant集合创建失败');
      return;
    }
    
    // 4. 添加示例知识项
    console.log('📚 添加示例知识项...');
    const sampleKnowledgeItems = [
      {
        id: 'academic_writing_1',
        type: 'rule',
        domain: 'academic',
        content: '学术论文应当使用客观、严谨的语言，避免主观色彩过强的表达。',
        context: '学术写作规范',
        source: '学术写作指南',
        confidence: 0.95,
        tags: ['学术写作', '语言规范'],
        ownership_type: 'shared',
        owner_id: null
      },
      {
        id: 'technical_doc_1',
        type: 'rule',
        domain: 'technical',
        content: '技术文档应当包含清晰的步骤说明，每个步骤都应该可以独立验证。',
        context: '技术文档编写',
        source: '技术写作最佳实践',
        confidence: 0.9,
        tags: ['技术文档', '步骤说明'],
        ownership_type: 'shared',
        owner_id: null
      },
      {
        id: 'medical_term_1',
        type: 'terminology',
        domain: 'medical',
        content: '诊断是指通过病史采集、体格检查和辅助检查确定疾病性质的过程。',
        context: '医学术语',
        source: '医学教材',
        confidence: 0.98,
        tags: ['医学', '诊断'],
        ownership_type: 'shared',
        owner_id: null
      },
      {
        id: 'research_method_1',
        type: 'case',
        domain: 'academic',
        content: '定量研究方法适用于需要数据统计分析的研究问题，强调客观性和可重复性。',
        context: '研究方法论',
        source: '研究方法指南',
        confidence: 0.92,
        tags: ['研究方法', '定量研究'],
        ownership_type: 'shared',
        owner_id: null
      },
      {
        id: 'business_analysis_1',
        type: 'case',
        domain: 'business',
        content: '市场分析应当包括目标市场规模、竞争对手分析和市场趋势预测三个核心要素。',
        context: '商业分析',
        source: '商业分析手册',
        confidence: 0.88,
        tags: ['市场分析', '商业'],
        ownership_type: 'shared',
        owner_id: null
      }
    ];
    
    // 5. 使用NewKnowledgeRetriever添加数据
    console.log('🔄 使用知识检索器添加数据...');
    const { NewKnowledgeRetriever } = require('../lib/rag/new-knowledge-retriever');
    const retriever = new NewKnowledgeRetriever();
    
    for (const item of sampleKnowledgeItems) {
      try {
        await retriever.addKnowledgeItem(item);
        console.log(`✅ 添加知识项: ${item.id}`);
      } catch (error) {
        console.error(`❌ 添加知识项失败 ${item.id}:`, error.message);
      }
    }
    
    // 6. 验证数据同步
    console.log('🔍 验证数据同步...');
    const pgCount = await client.query('SELECT COUNT(*) as count FROM knowledge_items');
    console.log(`PostgreSQL知识项数量: ${pgCount.rows[0].count}`);
    
    const qdrantResponse = await fetch('http://localhost:6333/collections/knowledge_vectors');
    const qdrantInfo = await qdrantResponse.json();
    console.log(`Qdrant向量数量: ${qdrantInfo.result.points_count}`);
    
    // 7. 测试搜索功能
    console.log('🔍 测试搜索功能...');
    const searchResults = await retriever.retrieveRelevantKnowledge('学术写作', undefined, undefined, 3);
    console.log(`搜索结果数量: ${searchResults.length}`);
    
    if (searchResults.length > 0) {
      console.log('✅ 数据库同步修复成功！');
      searchResults.forEach((item, index) => {
        console.log(`${index + 1}. ${item.id}: ${item.content.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ 搜索仍然返回0结果，需要进一步调试');
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

fixDatabaseSync(); 