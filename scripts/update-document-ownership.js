const { Pool } = require('pg');

// 数据库连接配置
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'myuser',
  password: '12345678',
});

async function updateDatabaseSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 开始更新数据库结构...');
    
    // 1. 检查是否已经存在ownership_type字段
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'file_metadata' 
      AND column_name = 'ownership_type'
    `);
    
    if (checkColumn.rows.length === 0) {
      // 2. 添加ownership_type和owner_id字段
      console.log('📝 添加ownership_type和owner_id字段...');
      await client.query(`
        ALTER TABLE file_metadata 
        ADD COLUMN ownership_type VARCHAR(10),
        ADD COLUMN owner_id VARCHAR(255)
      `);
      
      // 3. 设置默认值为shared（共享知识库）
      await client.query(`
        UPDATE file_metadata 
        SET ownership_type = 'shared', owner_id = NULL 
        WHERE ownership_type IS NULL
      `);
      
      // 4. 设置字段为NOT NULL
      await client.query(`
        ALTER TABLE file_metadata 
        ALTER COLUMN ownership_type SET NOT NULL
      `);
      
      console.log('✅ 数据库结构更新完成');
    } else {
      console.log('ℹ️ ownership_type字段已存在，跳过结构更新');
    }
    
    // 5. 检查现有数据
    const existingFiles = await client.query(`
      SELECT id, filename, ownership_type, owner_id, domain 
      FROM file_metadata 
      ORDER BY upload_time DESC
    `);
    
    console.log(`📊 当前数据库中有 ${existingFiles.rows.length} 个文档:`);
    existingFiles.rows.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.filename} (${file.ownership_type || 'NULL'}, 领域: ${file.domain || '未分类'})`);
    });
    
    // 6. 创建一些示例专属知识库文档
    const privateDocuments = [
      {
        id: 'private_doc_1',
        filename: '个人研究笔记.md',
        file_path: '/private/personal_research_notes.md',
        file_size: 8192,
        file_type: 'md',
        content_hash: 'hash_private_1',
        domain: 'academic',
        tags: ['研究', '个人', '学术'],
        ownership_type: 'private',
        owner_id: 'default_user'
      },
      {
        id: 'private_doc_2', 
        filename: '个人写作风格指南.txt',
        file_path: '/private/personal_style_guide.txt',
        file_size: 4096,
        file_type: 'txt',
        content_hash: 'hash_private_2',
        domain: 'general',
        tags: ['写作', '风格', '个人'],
        ownership_type: 'private',
        owner_id: 'default_user'
      }
    ];
    
    // 7. 插入专属知识库示例文档
    console.log('📝 添加专属知识库示例文档...');
    for (const doc of privateDocuments) {
      // 检查是否已存在
      const existing = await client.query('SELECT id FROM file_metadata WHERE id = $1', [doc.id]);
      
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO file_metadata (
            id, filename, file_path, file_size, file_type, upload_time,
            vector_id, content_hash, domain, tags, ownership_type, owner_id,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `, [
          doc.id,
          doc.filename,
          doc.file_path,
          doc.file_size,
          doc.file_type,
          new Date(),
          `vector_${doc.id}_${Date.now()}`,
          doc.content_hash,
          doc.domain,
          doc.tags,
          doc.ownership_type,
          doc.owner_id,
          new Date(),
          new Date()
        ]);
        
        console.log(`✅ 已添加专属文档: ${doc.filename}`);
      } else {
        console.log(`ℹ️ 专属文档已存在: ${doc.filename}`);
      }
    }
    
    // 8. 获取最终统计
    const finalStats = await client.query(`
      SELECT 
        ownership_type,
        COUNT(*) as count,
        array_agg(DISTINCT domain) as domains
      FROM file_metadata 
      GROUP BY ownership_type
    `);
    
    console.log('\n📊 最终统计:');
    finalStats.rows.forEach(stat => {
      const type = stat.ownership_type === 'private' ? '专属知识库' : '共享知识库';
      console.log(`  ${type}: ${stat.count} 个文档, 领域: ${stat.domains.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ 更新数据库失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await updateDatabaseSchema();
    console.log('\n🎉 数据库更新完成！');
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { updateDatabaseSchema }; 