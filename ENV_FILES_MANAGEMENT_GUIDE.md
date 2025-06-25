# 环境变量文件管理指南

## 🎯 问题解决

已成功解决.gitignore保护问题，现在可以正常编辑.env文件！

## ✅ 已完成的修改

### 1. 更新.gitignore规则
```gitignore
# 修改前
.env*

# 修改后  
.env.local
.env.development.local
.env.test.local
.env.production.local
.env
!.env.example
```

### 2. 文件状态
- ✅ `.env.example` - 已创建模板文件，可以编辑
- ✅ `.env.local` - 已添加到Git跟踪，可以编辑
- ✅ `.gitignore` - 已更新规则

## 🔧 编辑方法

### 方法1：使用管理脚本（推荐）
```bash
./scripts/manage-env-files.sh
```

### 方法2：命令行编辑
```bash
# 编辑 .env.local
nano .env.local
# 或
vim .env.local
# 或
code .env.local  # VS Code

# 编辑 .env.example
nano .env.example
```

### 方法3：图形界面
```bash
# 在Finder中打开
open .env.local
open .env.example
```

### 方法4：Cursor编辑器
现在应该可以直接在Cursor中编辑这些文件了！

## 📋 文件说明

### .env.example（模板文件）
```env
# AI Editor Pro - 环境变量配置模板
# 复制此文件为 .env.local 并填入实际值

# ===== DeepSeek API 配置 =====
DEEPSEEK_PROVIDER=cloud
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_CLOUD_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_CLOUD_MODEL=deepseek-reasoner

# ===== PostgreSQL 数据库配置 =====
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password

# ===== Qdrant 向量数据库配置 =====
QDRANT_URL=http://localhost:6333
QDRANT_TIMEOUT=600000
QDRANT_COLLECTION_NAME=knowledge_vectors
QDRANT_VECTOR_SIZE=4096
```

### .env.local（实际配置）
包含真实的API密钥和数据库密码，已配置完成。

## 🔒 安全注意事项

### 当前设置的安全级别
- ✅ `.env.local` 已添加到Git跟踪（为了方便编辑）
- ⚠️ **重要**：在生产环境中，建议将`.env.local`从Git中移除

### 生产环境建议
```bash
# 如果要在生产环境中移除.env.local的Git跟踪
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"

# 然后将.env.local重新添加到.gitignore
```

## 🚀 快速开始

1. **复制模板**
   ```bash
   cp .env.example .env.local
   ```

2. **编辑配置**
   ```bash
   ./scripts/manage-env-files.sh
   # 选择选项1编辑.env.local
   ```

3. **填入实际值**
   - DeepSeek API密钥
   - 数据库连接信息
   - 其他配置项

4. **验证配置**
   ```bash
   node scripts/test-database-config-optimization.js
   ```

## 🔍 故障排除

### 如果仍然无法编辑
1. 检查文件权限：`ls -la .env*`
2. 检查Git状态：`git status`
3. 强制添加到Git：`git add -f .env.local`
4. 重启Cursor编辑器

### 如果需要重置
```bash
# 删除现有文件
rm .env.local

# 从模板重新创建
cp .env.example .env.local

# 重新添加到Git
git add -f .env.local
```

## 📞 获取帮助

如果遇到问题，可以：
1. 运行管理脚本：`./scripts/manage-env-files.sh`
2. 查看文件状态：`ls -la .env*`
3. 检查Git状态：`git status`

---

**现在你可以自由编辑.env文件了！** 🎉 