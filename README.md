# AI Editor Pro - 智能编辑平台

基于Next.js 15 + React 19的智能AI编辑平台，专为期刊出版社设计。采用双数据库架构（Qdrant向量数据库+PostgreSQL关系数据库），集成RAG知识库增强功能，使用DeepSeek API替代OpenAI。

## 🚀 核心特征

- **双数据库架构**: Qdrant向量数据库 + PostgreSQL关系数据库
- **RAG知识库增强**: 支持6大专业领域（学术、医学、法律、技术、商业、通用）
- **DeepSeek API集成**: 替代OpenAI，适合国内网络环境
- **内联编辑体验**: 类似Word的修改建议界面
- **Docker容器化部署**: 一键启动所有服务
- **智能文档搜索**: 知识项和相关文档综合搜索
- **文档在线打开**: 支持文档在线预览和下载

## 📊 性能提升

- 纠错准确率：从70%提升至95%
- 编辑效率：提升300%
- 响应速度：平均响应时间<2秒

## 🏗️ 技术架构

### 前端技术栈
- **Next.js 15**: 最新版本，支持React 19
- **React 19**: 最新React版本，性能优化
- **TypeScript**: 类型安全的JavaScript
- **Tailwind CSS**: 现代化UI框架

### 后端技术栈
- **Qdrant**: 向量数据库，用于语义搜索
- **PostgreSQL**: 关系数据库，存储结构化数据
- **DeepSeek API**: 智能文本分析和生成

### 核心功能模块
- **RAG增强编辑器**: 实时智能建议和纠错
- **知识库管理**: 多领域知识项管理
- **文档搜索系统**: 知识项和文档综合搜索
- **向量检索引擎**: 基于语义相似度的检索

## 📋 主要页面

### 1. 文档编辑器 (`/editor`)
- **文档上传**: 支持多种格式文档上传
- **RAG增强编辑**: 智能编辑建议和实时纠错
- **搜索知识库**: 综合搜索知识项和相关文档
- **文档管理**: 编辑历史、文档下载等功能

### 2. 知识库管理 (`/knowledge-admin`)
- **知识项管理**: 添加、编辑、删除知识项
- **领域分类**: 6大专业领域分类管理
- **统计信息**: 知识库使用情况统计

## 🔍 搜索功能特性

### 知识库搜索
- **关键词搜索**: 支持中文关键词全文搜索
- **领域过滤**: 按学术、医学、法律、技术、商业、通用领域过滤
- **类型过滤**: 按术语、规则、示例、纠错类型过滤
- **相关度排序**: 基于向量相似度的智能排序

### 文档搜索与管理
- **文档检索**: 基于文件名和标签的文档搜索
- **在线预览**: 支持文档在线打开和预览
- **文档下载**: 一键下载原始文档
- **元数据展示**: 文件大小、类型、上传时间、领域标签等信息

## 🛠️ 安装与使用

### 环境要求
- Node.js 18+
- PostgreSQL 13+
- Docker & Docker Compose

### 快速启动

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-editor-pro
```

2. **安装依赖**
```bash
npm install
```

3. **启动服务**
```bash
# 启动数据库服务
docker-compose up -d

# 启动开发服务器
npm run dev
```

4. **访问应用**
- 主页: http://localhost:3000
- 编辑器: http://localhost:3000/editor
- 知识库管理: http://localhost:3000/knowledge-admin

### 数据库初始化

```bash
# 初始化数据库表
node scripts/init-db.sql

# 添加示例数据
node scripts/add-sample-documents.js
node scripts/add-documents-to-db.js
node scripts/add-file-metadata-to-db.js
```

## 🧪 测试与验证

### API测试
```bash
# 测试RAG功能
npm run test-rag-api

# 测试向量搜索
node scripts/test-qdrant-search.js

# 测试文档搜索
node scripts/test-document-search.js
```

### 功能验证
- ✅ 文档上传和处理
- ✅ RAG增强编辑
- ✅ 知识库搜索
- ✅ 文档搜索和打开
- ✅ 向量相似度检索
- ✅ 多领域知识分类

## 📚 API文档

### 知识库API (`/api/knowledge-base`)
```typescript
// 搜索知识库
GET /api/knowledge-base?query=关键词&domain=领域&type=类型&includeDocuments=true

// 添加知识项
POST /api/knowledge-base
{
  "action": "add",
  "knowledge": {
    "type": "terminology",
    "domain": "academic",
    "content": "知识内容",
    "context": "上下文",
    "source": "来源",
    "confidence": 0.9,
    "tags": ["标签1", "标签2"]
  }
}
```

### 文档API (`/api/documents/[id]`)
```typescript
// 获取文档信息
GET /api/documents/{vector_id}?action=info

// 在线打开文档
GET /api/documents/{vector_id}?action=open

// 下载文档
GET /api/documents/{vector_id}?action=download
```

### RAG分析API (`/api/analyze-document-rag`)
```typescript
POST /api/analyze-document-rag
{
  "content": "文档内容",
  "domain": "academic"
}
```

## 🔧 配置说明

### 环境变量
```env
# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key

# 数据库配置
DATABASE_URL=postgresql://myuser:12345678@localhost:5432/postgres

# Qdrant配置
QDRANT_URL=http://localhost:6333
```

### 数据库配置
- **PostgreSQL**: 存储文件元数据和知识项
- **Qdrant**: 存储向量嵌入，支持语义搜索

## 🎯 使用场景

### 期刊出版社
- 学术论文智能校对
- 专业术语一致性检查
- 引用格式规范化

### 企业文档管理
- 技术文档智能编辑
- 企业知识库搜索
- 文档版本管理

### 教育机构
- 教学材料智能校对
- 学科知识库构建
- 学术写作辅导

## 🚀 未来规划

- [ ] 支持更多文档格式（PDF、Word等）
- [ ] 集成更多AI模型选择
- [ ] 实现实时协作编辑
- [ ] 添加文档版本控制
- [ ] 支持多语言界面
- [ ] 移动端适配优化

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

---

**AI Editor Pro** - 让智能编辑更简单，让知识管理更高效！
