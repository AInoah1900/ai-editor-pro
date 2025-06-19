#!/bin/bash

# RAG 服务启动脚本
# 用于启动 Qdrant 向量数据库和 PostgreSQL 关系型数据库

echo "🚀 启动 RAG 知识库服务..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查 docker-compose 是否可用
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装，请先安装 docker-compose"
    exit 1
fi

# 停止现有服务（如果存在）
echo "🛑 停止现有服务..."
docker-compose down

# 启动服务
echo "📦 启动 Qdrant 向量数据库和 PostgreSQL..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."

# 检查 Qdrant
if curl -s http://localhost:6333/collections > /dev/null; then
    echo "✅ Qdrant 向量数据库启动成功 (http://localhost:6333)"
else
    echo "❌ Qdrant 向量数据库启动失败"
fi

# 检查 PostgreSQL
if docker exec postgres-rag-db pg_isready -U myuser > /dev/null 2>&1; then
    echo "✅ PostgreSQL 数据库启动成功 (localhost:5432)"
    echo "   用户名: myuser"
    echo "   密码: 12345678"
else
    echo "❌ PostgreSQL 数据库启动失败"
fi

# 检查 pgAdmin（可选）
if curl -s http://localhost:5050 > /dev/null; then
    echo "✅ pgAdmin 管理界面启动成功 (http://localhost:5050)"
    echo "   邮箱: admin@example.com"
    echo "   密码: admin123"
else
    echo "⚠️  pgAdmin 管理界面启动失败（可选服务）"
fi

echo ""
echo "🎉 RAG 知识库服务启动完成！"
echo ""
echo "📋 服务信息："
echo "   • Qdrant 向量数据库: http://localhost:6333"
echo "   • PostgreSQL 数据库: localhost:5432"
echo "   • pgAdmin 管理界面: http://localhost:5050"
echo ""
echo "🔧 管理命令："
echo "   • 查看服务状态: docker-compose ps"
echo "   • 查看服务日志: docker-compose logs"
echo "   • 停止服务: docker-compose down"
echo "   • 重启服务: docker-compose restart"
echo ""
echo "📚 下一步："
echo "   1. 确保服务正常运行"
echo "   2. 在应用中配置数据库连接"
echo "   3. 初始化知识库" 