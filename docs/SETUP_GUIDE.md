# RAG知识库设置指南

## 🚀 快速开始

本指南将帮助您配置和使用基于Pinecone的RAG知识库增强功能。

## 📋 前置要求

1. **Pinecone账号和API密钥**
   - 注册Pinecone账号: https://www.pinecone.io/
   - 获取API密钥和索引信息

2. **OpenAI API密钥** (用于生成嵌入向量)
   - 注册OpenAI账号: https://platform.openai.com/
   - 获取API密钥

## ⚙️ 环境配置

### 1. 创建环境变量文件

```bash
# 复制示例文件
cp .env.example .env.local

# 编辑环境变量
vim .env.local
```

### 2. 配置环境变量

在`.env.local`文件中设置以下变量：

```bash
# DeepSeek API配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions

# Pinecone向量数据库配置
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=chatbot
PINECONE_HOST=https://chatbot-p5rkfet.svc.aped-4627-b74a.pinecone.io

# OpenAI API配置 (用于生成嵌入向量)
OPENAI_API_KEY=your_openai_api_key_here

# Next.js配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **注意**: 示例中的Pinecone配置已经为您预配置，如果您想使用自己的Pinecone实例，请替换相应的值。

## 🎯 知识库初始化

### 方法1: 使用管理界面 (推荐)

1. 启动开发服务器：
```bash
npm run dev
```

2. 访问知识库管理界面：
```
http://localhost:3000/knowledge-admin
```

3. 点击"初始化知识库"按钮

### 方法2: 使用命令行脚本

```bash
npm run init-knowledge
```

### 方法3: 使用API

```bash
curl -X POST http://localhost:3000/api/knowledge-base \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize"}'
```

## 📊 知识库结构

RAG知识库包含以下类型的知识项：

### 1. 术语知识 (terminology)
- 专业术语的定义和用法
- 标准术语规范
- 领域特定词汇

### 2. 规则知识 (rule)
- 学术写作规范
- 格式要求
- 语法规则

### 3. 案例知识 (case)
- 历史纠错案例
- 成功修改示例
- 用户反馈学习

### 4. 风格知识 (style)
- 期刊特定风格
- 写作风格指南
- 表达习惯

## 🎨 使用RAG增强功能

### 1. 访问RAG增强编辑器

```
http://localhost:3000/editor-rag
```

### 2. 在编辑器中启用RAG

- 确保"RAG增强"复选框已勾选
- 观察RAG信息面板显示的领域识别和知识应用情况

### 3. 用户反馈学习

- **接受建议**: 点击"应用"按钮，系统自动学习成功案例
- **拒绝建议**: 点击"忽略"按钮，系统记录错误建议
- **自定义修改**: 直接编辑文本，系统学习用户偏好

## 🔧 高级配置

### 1. 自定义知识项

通过管理界面或API添加自定义知识项：

```javascript
const customKnowledge = {
  type: 'terminology',
  domain: 'physics',
  content: '量子态：描述量子系统状态的数学表示',
  context: '量子力学中的基本概念',
  source: '量子力学教材',
  confidence: 0.95,
  tags: ['量子力学', '基本概念']
};
```

### 2. 支持的领域

- **physics**: 物理学
- **chemistry**: 化学
- **biology**: 生物学
- **medicine**: 医学
- **engineering**: 工程学
- **mathematics**: 数学
- **general**: 通用

### 3. 向量化设置

- **模型**: text-embedding-ada-002
- **维度**: 1536
- **相似度算法**: cosine

## 📈 性能监控

### 1. 知识库统计

访问管理界面查看：
- 总知识项数量
- 按领域分布
- 按类型分布

### 2. RAG置信度

在编辑器中观察：
- 领域识别置信度
- 知识检索相关度
- RAG整体置信度

### 3. 用户反馈分析

系统自动收集：
- 接受/拒绝建议的比例
- 用户自定义修改的模式
- 知识项使用频率

## 🐛 故障排除

### 1. Pinecone连接失败

检查环境变量配置：
```bash
echo $PINECONE_API_KEY
echo $PINECONE_INDEX_NAME
```

### 2. OpenAI API限制

如果遇到API限制，系统会使用模拟向量：
- 检查API密钥是否正确
- 确认账户余额充足
- 考虑使用较小的批量大小

### 3. 知识检索无结果

可能原因：
- 知识库尚未初始化
- 领域匹配不准确
- 查询文本过短或过长

### 4. 日志调试

查看浏览器控制台和服务器日志：
```bash
# 开发模式下查看详细日志
npm run dev
```

## 📚 API参考

### 知识库管理API

```typescript
// 获取统计信息
GET /api/knowledge-base

// 初始化知识库
POST /api/knowledge-base
{
  "action": "initialize"
}

// 添加知识项
POST /api/knowledge-base
{
  "action": "add",
  "knowledge": { ... }
}

// 用户反馈学习
PUT /api/knowledge-base
{
  "original": "错误文本",
  "suggestion": "AI建议",
  "feedback": "accept|reject|modify",
  "domain": "physics",
  "finalVersion": "最终版本"
}
```

### RAG增强分析API

```typescript
// RAG增强文档分析
POST /api/analyze-document-rag
{
  "content": "文档内容"
}

// 响应格式
{
  "errors": [...],
  "domain_info": {
    "domain": "physics",
    "confidence": 0.85,
    "keywords": ["量子", "纠缠"]
  },
  "knowledge_used": ["相关知识1", "相关知识2"],
  "rag_confidence": 0.88,
  "fallback_used": false
}
```

## 🎉 成功指标

系统成功运行的标志：

- ✅ Pinecone连接正常，无错误日志
- ✅ 知识库初始化完成，包含10+基础知识项
- ✅ 领域识别准确率>80%
- ✅ RAG置信度>0.7
- ✅ 用户反馈学习正常工作

## 🤝 获取帮助

如果遇到问题：

1. 查看浏览器控制台错误
2. 检查服务器日志
3. 确认环境变量配置
4. 参考故障排除部分

---

**恭喜！您已经成功设置了RAG知识库增强功能。** 🎊

现在可以体验专业级的AI编辑服务，享受基于知识库的精确纠错和智能建议！ 