const axios = require('axios');

const QDRANT_URL = 'http://localhost:6333';

async function checkQdrantStatus() {
  try {
    console.log('🔍 检查Qdrant服务状态...');
    
    // 检查服务健康状态
    const healthResponse = await axios.get(`${QDRANT_URL}/health`);
    console.log('✅ Qdrant服务状态:', healthResponse.data);
    
    // 检查集合列表
    const collectionsResponse = await axios.get(`${QDRANT_URL}/collections`);
    console.log('📋 现有集合:', collectionsResponse.data);
    
    // 检查knowledge集合详情
    try {
      const knowledgeResponse = await axios.get(`${QDRANT_URL}/collections/knowledge`);
      console.log('🧠 knowledge集合详情:', JSON.stringify(knowledgeResponse.data, null, 2));
      
      // 检查向量数量
      const countResponse = await axios.post(`${QDRANT_URL}/collections/knowledge/points/count`, {});
      console.log('📊 knowledge集合向量数量:', countResponse.data);
      
    } catch (error) {
      console.log('❌ knowledge集合不存在或查询失败:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('❌ Qdrant检查失败:', error.response?.data || error.message);
  }
}

checkQdrantStatus(); 