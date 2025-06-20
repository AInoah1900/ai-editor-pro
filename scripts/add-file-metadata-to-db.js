const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function addFileMetadataToDatabase() {
  console.log('📄 直接向数据库添加文件元数据...\n');
  
  // 数据库连接
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'myuser',
    password: '12345678',
  });
  
  const documentsDir = path.join(__dirname, '../public/sample-documents');
  
  // 示例文档信息
  const documents = [
    {
      filename: '学术论文写作规范.md',
      domain: 'academic',
      tags: ['学术', '论文', '写作', '规范']
    },
    {
      filename: '医学术语标准化指南.txt',
      domain: 'medical',
      tags: ['医学', '术语', '标准化', '指南']
    },
    {
      filename: '技术文档编写最佳实践.md',
      domain: 'technical',
      tags: ['技术', '文档', '编写', '最佳实践']
    }
  ];
  
  try {
    // 确保表存在
    await pool.query(`
      CREATE TABLE IF NOT EXISTS file_metadata (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(500) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        upload_time TIMESTAMP NOT NULL,
        vector_id VARCHAR(255) NOT NULL,
        content_hash VARCHAR(255) NOT NULL,
        domain VARCHAR(100),
        tags TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    for (const doc of documents) {
      try {
        const filePath = path.join(documentsDir, doc.filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  文件不存在: ${filePath}`);
          continue;
        }
        
        // 读取文件信息
        const content = fs.readFileSync(filePath, 'utf8');
        const stats = fs.statSync(filePath);
        const fileExtension = path.extname(doc.filename).slice(1) || 'txt';
        const contentHash = crypto.createHash('md5').update(content).digest('hex');
        
        const fileMetadata = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          filename: doc.filename,
          file_path: filePath,
          file_size: stats.size,
          file_type: fileExtension,
          upload_time: new Date(),
          vector_id: `vector_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content_hash: contentHash,
          domain: doc.domain,
          tags: doc.tags
        };
        
        console.log(`正在添加文件元数据: ${doc.filename}`);
        
        // 插入数据库
        await pool.query(`
          INSERT INTO file_metadata (
            id, filename, file_path, file_size, file_type, upload_time,
            vector_id, content_hash, domain, tags, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          fileMetadata.id,
          fileMetadata.filename,
          fileMetadata.file_path,
          fileMetadata.file_size,
          fileMetadata.file_type,
          fileMetadata.upload_time,
          fileMetadata.vector_id,
          fileMetadata.content_hash,
          fileMetadata.domain,
          fileMetadata.tags,
          new Date(),
          new Date(),
        ]);
        
        console.log(`✅ 成功添加文件元数据: ${doc.filename}`);
        console.log(`   ID: ${fileMetadata.id}`);
        console.log(`   向量ID: ${fileMetadata.vector_id}`);
        console.log(`   文件路径: ${fileMetadata.file_path}`);
        console.log(`   文件大小: ${fileMetadata.file_size} 字节`);
        console.log(`   领域: ${fileMetadata.domain}`);
        console.log('---');
        
      } catch (error) {
        console.error(`处理文档 ${doc.filename} 时出错:`, error.message);
      }
    }
    
    // 查询验证
    const result = await pool.query('SELECT COUNT(*) as count FROM file_metadata');
    console.log(`\n📊 数据库中现在有 ${result.rows[0].count} 个文件记录`);
    
  } catch (error) {
    console.error('数据库操作失败:', error);
  } finally {
    await pool.end();
  }
  
  console.log('\n🎉 文件元数据添加完成!');
  console.log('💡 现在您可以在搜索界面测试文档搜索和打开功能了');
}

// 运行脚本
addFileMetadataToDatabase().catch(console.error); 