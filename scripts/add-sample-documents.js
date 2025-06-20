const http = require('http');
const fs = require('fs');
const path = require('path');

async function addSampleDocuments() {
  console.log('📄 添加示例文档数据...\n');
  
  // 创建示例文档目录
  const documentsDir = path.join(__dirname, '../public/sample-documents');
  if (!fs.existsSync(documentsDir)) {
    fs.mkdirSync(documentsDir, { recursive: true });
  }
  
  // 创建示例文档文件
  const sampleDocuments = [
    {
      filename: '学术论文写作规范.md',
      content: `# 学术论文写作规范

## 1. 标题要求
- 标题应简洁明了，准确反映论文内容
- 中文标题一般不超过20个汉字
- 英文标题实词首字母大写

## 2. 摘要撰写
- 摘要应包含研究目的、方法、结果和结论
- 中文摘要200-300字
- 英文摘要与中文摘要内容对应

## 3. 关键词选择
- 关键词3-8个
- 应选择能准确概括论文主题的词汇
- 按重要性排序

## 4. 参考文献格式
- 采用国标GB/T 7714-2015格式
- 按文中出现顺序编号
- 确保引用准确完整
`,
      domain: 'academic',
      tags: ['学术', '论文', '写作', '规范']
    },
    {
      filename: '医学术语标准化指南.txt',
      content: `医学术语标准化指南

1. 解剖学术语
- 使用国际解剖学术语委员会制定的标准术语
- 避免使用过时或地方性术语
- 中英文对照应准确

2. 疾病命名规范
- 遵循ICD-11国际疾病分类标准
- 使用标准的疾病名称
- 避免使用俗称或简称

3. 药物名称规范
- 优先使用通用名
- 标注剂量和给药途径
- 注明药物相互作用

4. 检查项目术语
- 使用标准化的检查项目名称
- 标注正常值范围
- 说明临床意义
`,
      domain: 'medical',
      tags: ['医学', '术语', '标准化', '指南']
    },
    {
      filename: '技术文档编写最佳实践.md',
      content: `# 技术文档编写最佳实践

## 1. 文档结构
- 清晰的目录结构
- 逐步递进的内容组织
- 合理的章节划分

## 2. 代码示例
- 提供完整可运行的代码
- 添加详细的注释说明
- 包含错误处理示例

## 3. 图表使用
- 使用流程图说明复杂逻辑
- 提供架构图展示系统设计
- 截图应清晰且有标注

## 4. 版本管理
- 记录文档版本变更
- 标注更新日期和作者
- 维护变更日志
`,
      domain: 'technical',
      tags: ['技术', '文档', '编写', '最佳实践']
    }
  ];
  
  // HTTP请求帮助函数
  function makeRequest(method, path, data) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: jsonData });
          } catch (err) {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });
      
      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }
  
  // 添加文档数据
  for (const doc of sampleDocuments) {
    try {
      // 创建文件
      const filePath = path.join(documentsDir, doc.filename);
      fs.writeFileSync(filePath, doc.content, 'utf8');
      
      // 获取文件信息
      const stats = fs.statSync(filePath);
      const fileExtension = path.extname(doc.filename).slice(1) || 'txt';
      
      // 准备文档元数据
      const fileMetadata = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: doc.filename,
        file_path: filePath,
        file_size: stats.size,
        file_type: fileExtension,
        upload_time: new Date(),
        vector_id: `vector_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content_hash: require('crypto').createHash('md5').update(doc.content).digest('hex'),
        domain: doc.domain,
        tags: doc.tags
      };
      
      console.log(`正在添加文档: ${doc.filename}`);
      
      // 这里我们需要直接调用数据库方法，因为目前还没有文档上传的API
      // 暂时先创建文件，后续可以通过知识库管理界面或API添加
      console.log(`文件已创建: ${filePath}`);
      console.log(`文件大小: ${stats.size} 字节`);
      console.log(`领域: ${doc.domain}`);
      console.log(`标签: ${doc.tags.join(', ')}`);
      console.log('---');
      
    } catch (error) {
      console.error(`添加文档 ${doc.filename} 失败:`, error.message);
    }
  }
  
  console.log('\n✅ 示例文档创建完成!');
  console.log('📁 文档位置:', documentsDir);
  console.log('💡 提示: 您可以通过知识库管理界面手动添加这些文档到数据库中');
}

// 运行脚本
addSampleDocuments().catch(console.error); 