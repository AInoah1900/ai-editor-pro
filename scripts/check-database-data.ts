import { Pool } from 'pg';

// 数据库配置
const pool = new Pool({
  user: 'myuser',
  host: 'localhost',
  database: 'postgres',
  password: '12345678',
  port: 5432,
});

interface KnowledgeItem {
  id: string;
  domain: string;
  type: string;
  ownership_type: string;
  content: string;
}

interface FileMetadata {
  id: string;
  filename: string;
  domain: string;
  file_path: string;
}

interface DomainStats {
  domain: string;
  count: string;
  ownership_type: string;
}

async function checkDatabaseData(): Promise<void> {
  try {
    console.log('=== 检查数据库连接 ===');
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');
    
    console.log('\n=== 检查知识项表 ===');
    const knowledgeResult = await client.query('SELECT COUNT(*) as count FROM knowledge_items');
    console.log('知识项总数:', knowledgeResult.rows[0].count);
    
    if (parseInt(knowledgeResult.rows[0].count) > 0) {
      const sampleKnowledge = await client.query('SELECT id, domain, type, ownership_type, content FROM knowledge_items LIMIT 5');
      console.log('前5个知识项:');
      sampleKnowledge.rows.forEach((item: KnowledgeItem, index: number) => {
        console.log(`${index + 1}. ID: ${item.id}, Domain: ${item.domain}, Type: ${item.type}, Ownership: ${item.ownership_type}`);
        console.log(`   Content: ${item.content.substring(0, 100)}...`);
      });
    }
    
    console.log('\n=== 检查文件元数据表 ===');
    const fileResult = await client.query('SELECT COUNT(*) as count FROM file_metadata');
    console.log('文件元数据总数:', fileResult.rows[0].count);
    
    if (parseInt(fileResult.rows[0].count) > 0) {
      const sampleFiles = await client.query('SELECT id, filename, domain, file_path FROM file_metadata LIMIT 5');
      console.log('前5个文件:');
      sampleFiles.rows.forEach((file: FileMetadata, index: number) => {
        console.log(`${index + 1}. ID: ${file.id}, Filename: ${file.filename}, Domain: ${file.domain}`);
        console.log(`   Path: ${file.file_path}`);
      });
    }
    
    console.log('\n=== 检查按领域分组的知识项 ===');
    const domainStats = await client.query(`
      SELECT domain, COUNT(*) as count, ownership_type
      FROM knowledge_items 
      GROUP BY domain, ownership_type 
      ORDER BY count DESC
    `);
    console.log('按领域和所有权分组:');
    domainStats.rows.forEach((row: DomainStats) => {
      console.log(`  ${row.domain} (${row.ownership_type}): ${row.count} 项`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('检查数据库失败:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseData();
