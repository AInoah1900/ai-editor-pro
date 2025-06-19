# 环境变量配置指南

## 概述

AI Editor Pro 使用环境变量来管理敏感配置信息，如API密钥、数据库连接等。这种方式提高了应用的安全性，避免将敏感信息硬编码在源代码中。

## 快速开始

### 1. 复制环境变量模板

```bash
cp .env.example .env.local
```

### 2. 编辑配置文件

打开 `.env.local` 文件，填入真实的配置值：

```bash
# 使用你喜欢的编辑器
nano .env.local
# 或者
code .env.local
```

## 环境变量说明

### DeepSeek AI API配置

| 变量名 | 必需 | 说明 | 示例值 |
|--------|------|------|--------|
| `DEEPSEEK_API_KEY` | ✅ | DeepSeek API密钥 | `sk-xxxxxxxxxxxxxxxx` |
| `DEEPSEEK_API_URL` | ❌ | DeepSeek API端点 | `https://api.deepseek.com/chat/completions` |

#### 获取DeepSeek API密钥

1. 访问 [DeepSeek官网](https://platform.deepseek.com/)
2. 注册账号并登录
3. 进入API管理页面
4. 创建新的API密钥
5. 复制密钥到 `DEEPSEEK_API_KEY` 变量

### 应用配置

| 变量名 | 必需 | 说明 | 示例值 |
|--------|------|------|--------|
| `NODE_ENV` | ❌ | 运行环境 | `development` / `production` |
| `NEXT_PUBLIC_APP_NAME` | ❌ | 应用名称 | `AI Editor Pro` |
| `NEXT_PUBLIC_APP_VERSION` | ❌ | 应用版本 | `1.0.0` |

### 安全配置

| 变量名 | 必需 | 说明 | 示例值 |
|--------|------|------|--------|
| `JWT_SECRET` | ❌ | JWT签名密钥 | `your-strong-secret-key` |
| `ENCRYPTION_KEY` | ❌ | 数据加密密钥 | `your-encryption-key` |

## 环境文件说明

### `.env.local`
- **用途**: 本地开发环境配置
- **包含**: 真实的API密钥和敏感信息
- **版本控制**: ❌ 不提交到Git（已在.gitignore中）

### `.env.example`
- **用途**: 环境变量模板和文档
- **包含**: 变量名和示例值（非真实值）
- **版本控制**: ✅ 提交到Git，供团队参考

## 安全最佳实践

### 1. 密钥管理
- ✅ 使用强密钥（至少32位随机字符）
- ✅ 定期轮换API密钥
- ✅ 不同环境使用不同密钥
- ❌ 不要在代码中硬编码密钥

### 2. 文件权限
```bash
# 设置环境文件权限（仅所有者可读写）
chmod 600 .env.local
```

### 3. 生产环境
- 使用环境变量或密钥管理服务
- 不要将 `.env.local` 部署到生产环境
- 考虑使用 Docker secrets 或 Kubernetes secrets

## 故障排除

### 问题1: API密钥未生效
**症状**: 应用显示"API密钥未配置"错误

**解决方案**:
1. 确认 `.env.local` 文件存在
2. 检查变量名拼写是否正确
3. 确认没有多余的空格或引号
4. 重启开发服务器

```bash
# 重启开发服务器
npm run dev
```

### 问题2: 环境变量读取失败
**症状**: `process.env.VARIABLE_NAME` 返回 undefined

**解决方案**:
1. 确认变量名正确
2. 检查 `.env.local` 文件格式
3. 确认Next.js支持该变量类型

### 问题3: 客户端变量未生效
**症状**: 客户端代码无法访问环境变量

**解决方案**:
- 客户端变量必须以 `NEXT_PUBLIC_` 开头
- 服务端变量不能在客户端访问

## 开发工作流

### 新团队成员加入
1. 克隆项目
2. 复制 `.env.example` 为 `.env.local`
3. 向团队管理员获取真实的API密钥
4. 填入配置文件
5. 启动开发服务器

### 添加新的环境变量
1. 在 `.env.local` 中添加变量
2. 在 `.env.example` 中添加示例
3. 更新此文档
4. 在代码中使用 `process.env.VARIABLE_NAME`

## 相关文档

- [Next.js环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [DeepSeek API文档](https://platform.deepseek.com/api-docs)
- [项目README](../README.md) 