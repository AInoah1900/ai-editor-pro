#!/bin/bash

# AI Editor Pro - 环境变量文件管理脚本

echo "🔧 AI Editor Pro 环境变量文件管理"
echo "=================================="

# 检查文件状态
echo "📋 当前环境文件状态："
ls -la .env* 2>/dev/null || echo "没有找到.env文件"

echo ""
echo "🎯 可用操作："
echo "1. 编辑 .env.local 文件"
echo "2. 编辑 .env.example 文件"
echo "3. 从 .env.example 复制到 .env.local"
echo "4. 查看 .env.local 内容"
echo "5. 查看 .env.example 内容"
echo "6. 检查Git状态"
echo "7. 退出"

read -p "请选择操作 (1-7): " choice

case $choice in
    1)
        echo "📝 编辑 .env.local 文件..."
        if command -v code &> /dev/null; then
            code .env.local
        elif command -v nano &> /dev/null; then
            nano .env.local
        else
            vi .env.local
        fi
        ;;
    2)
        echo "📝 编辑 .env.example 文件..."
        if command -v code &> /dev/null; then
            code .env.example
        elif command -v nano &> /dev/null; then
            nano .env.example
        else
            vi .env.example
        fi
        ;;
    3)
        echo "📋 从 .env.example 复制到 .env.local..."
        cp .env.example .env.local
        echo "✅ 复制完成！请编辑 .env.local 填入实际值"
        ;;
    4)
        echo "👀 .env.local 内容："
        echo "==================="
        cat .env.local 2>/dev/null || echo "文件不存在"
        ;;
    5)
        echo "👀 .env.example 内容："
        echo "====================="
        cat .env.example 2>/dev/null || echo "文件不存在"
        ;;
    6)
        echo "📊 Git状态："
        echo "============"
        git status | grep -E "\.(env|gitignore)" || echo "没有相关变更"
        ;;
    7)
        echo "👋 再见！"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        ;;
esac 