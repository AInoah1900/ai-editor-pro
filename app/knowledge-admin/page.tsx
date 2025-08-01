'use client';

import React, { useState, useEffect } from 'react';

interface KnowledgeStats {
  total_knowledge_items: number;
  total_files: number;
  domains: Record<string, number>;
  types: Record<string, number>;
  last_updated: string;
  vector_stats: {
    vectors_count: number;
    points_count: number;
  };
}

interface KnowledgeItem {
  id: string;
  type: 'terminology' | 'rule' | 'case' | 'style';
  domain: string;
  content: string;
  context: string;
  source: string;
  confidence: number;
  tags: string[];
}

interface JournalDomainOption {
  code: string;
  name: string;
  category_name: string;
}

export default function KnowledgeAdminPage() {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [domains, setDomains] = useState<JournalDomainOption[]>([]);
  const [newKnowledge, setNewKnowledge] = useState<Partial<KnowledgeItem>>({
    type: 'terminology',
    domain: 'general',
    content: '',
    context: '',
    source: '管理员添加',
    confidence: 0.8,
    tags: []
  });
  const [message, setMessage] = useState('');

  // 获取期刊领域列表
  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/journal-domains?format=simple');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDomains(result.data.domains);
          console.log(`✅ 获取到 ${result.data.domains.length} 个期刊领域`);
        }
      }
    } catch (error) {
      console.error('获取期刊领域失败:', error);
      // 如果新的API失败，使用备用的硬编码选项
      setDomains([
        { code: 'general', name: '通用', category_name: '通用' },
        { code: 'physics', name: '物理学', category_name: '自然科学与工程技术' },
        { code: 'chemistry', name: '化学', category_name: '自然科学与工程技术' },
        { code: 'biology', name: '生物学', category_name: '自然科学与工程技术' },
        { code: 'medicine', name: '医学', category_name: '自然科学与工程技术' },
        { code: 'engineering', name: '工程与技术', category_name: '自然科学与工程技术' },
        { code: 'mathematics', name: '数学', category_name: '自然科学与工程技术' }
      ]);
    }
  };

  // 获取知识库统计
  const fetchStats = async () => {
    console.log('🔄 开始获取知识库统计...');
    try {
      // 获取知识库统计数据
      const statsResponse = await fetch('/api/knowledge-base?action=getLibraryStats');
      console.log('📊 统计API响应状态:', statsResponse.status);
      
      if (!statsResponse.ok) {
        throw new Error(`HTTP ${statsResponse.status}: ${statsResponse.statusText}`);
      }
      
      const statsResult = await statsResponse.json();
      console.log('📊 基础统计数据:', statsResult);
      
      if (!statsResult.success) {
        throw new Error(statsResult.error || '获取统计失败');
      }
      
      // 获取知识项数据以计算详细统计
      const knowledgeResponse = await fetch('/api/knowledge-base?query=&limit=100');
      console.log('📚 知识项API响应状态:', knowledgeResponse.status);
      
      if (!knowledgeResponse.ok) {
        throw new Error(`HTTP ${knowledgeResponse.status}: ${knowledgeResponse.statusText}`);
      }
      
      const knowledgeResult = await knowledgeResponse.json();
      console.log('📚 知识项数据:', knowledgeResult);
      
      if (!knowledgeResult.success) {
        throw new Error(knowledgeResult.error || '获取知识项失败');
      }
      
      // 计算统计数据
      const knowledgeItems = knowledgeResult.knowledge_items || [];
      console.log('📝 知识项数量:', knowledgeItems.length);
      
      const domains: Record<string, number> = {};
      const types: Record<string, number> = {};
      
      knowledgeItems.forEach((item: any, index: number) => {
        console.log(`📋 知识项 ${index + 1}:`, {
          domain: item.domain,
          type: item.type,
          content: item.content?.substring(0, 30) + '...'
        });
        
        // 统计领域分布
        if (item.domain) {
          domains[item.domain] = (domains[item.domain] || 0) + 1;
        }
        
        // 统计类型分布
        if (item.type) {
          types[item.type] = (types[item.type] || 0) + 1;
        }
      });
      
      console.log('🏷️ 领域分布:', domains);
      console.log('📂 类型分布:', types);
      
      // 组合统计数据
      const combinedStats: KnowledgeStats = {
        total_knowledge_items: knowledgeItems.length,
        total_files: statsResult.stats.total_private + statsResult.stats.total_shared,
        domains,
        types,
        last_updated: new Date().toISOString(),
        vector_stats: {
          vectors_count: knowledgeItems.length,
          points_count: knowledgeItems.length
        }
      };
      
      console.log('✅ 最终统计数据:', combinedStats);
      setStats(combinedStats);
      setMessage('✅ 统计数据加载成功！');
      
    } catch (error) {
      console.error('❌ 获取统计失败:', error);
      setMessage(`❌ 获取统计失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 初始化知识库
  const initializeKnowledgeBase = async () => {
    setLoading(true);
    setMessage('正在初始化知识库...');
    
    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setMessage('✅ 知识库初始化成功！');
        setStats(result.data);
      } else {
        setMessage(`❌ 初始化失败: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ 初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // 添加知识项
  const addKnowledgeItem = async () => {
    if (!newKnowledge.content) {
      setMessage('❌ 请填写知识内容');
      return;
    }

    setLoading(true);
    setMessage('正在添加知识项...');

    try {
      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'add', 
          knowledge: {
            ...newKnowledge,
            tags: typeof newKnowledge.tags === 'string' 
              ? (newKnowledge.tags as string).split(',').map(t => t.trim())
              : newKnowledge.tags
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        setMessage('✅ 知识项添加成功！');
        setNewKnowledge({
          type: 'terminology',
          domain: 'general',
          content: '',
          context: '',
          source: '管理员添加',
          confidence: 0.8,
          tags: []
        });
        await fetchStats();
      } else {
        setMessage(`❌ 添加失败: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ 添加失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 头部 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            RAG知识库管理中心
          </h1>
          <p className="text-gray-600">
            管理AI编辑系统的专业知识库，包括术语、规则、案例和风格指南
          </p>
        </div>

        {/* 状态消息 */}
        {message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">{message}</p>
          </div>
        )}

        {/* 知识库统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📊 总体统计
            </h3>
            {stats ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">总知识项:</span>
                  <span className="font-semibold text-blue-600">{stats.total_knowledge_items}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">总文件数:</span>
                  <span className="font-semibold text-blue-600">{stats.total_files}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">向量点数:</span>
                  <span className="font-semibold text-blue-600">{stats.vector_stats.points_count}</span>
                </div>
                <button
                  onClick={fetchStats}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  刷新统计
                </button>
              </div>
            ) : (
              <p className="text-gray-500">加载中...</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔬 按领域分布
            </h3>
            {stats && stats.domains && Object.keys(stats.domains).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.domains).map(([domain, count]) => (
                  <div key={domain} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{domain}:</span>
                    <span className="font-medium text-green-600">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">暂无数据</p>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📚 按类型分布
            </h3>
            {stats && stats.types && Object.keys(stats.types).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.types).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{type}:</span>
                    <span className="font-medium text-purple-600">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">暂无数据</p>
            )}
          </div>
        </div>

        {/* 操作面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 知识库初始化 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🚀 知识库初始化
            </h3>
            <p className="text-gray-600 mb-4">
              初始化知识库基础设施，包括 Qdrant 向量数据库集合和 PostgreSQL 数据表结构。
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                ⚠️ 注意：此操作将创建必要的数据库表结构和向量集合。确保 Qdrant 和 PostgreSQL 服务正在运行。
              </p>
            </div>
            <button
              onClick={initializeKnowledgeBase}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '初始化中...' : '初始化知识库'}
            </button>
          </div>

          {/* 添加知识项 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ➕ 添加知识项
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    类型
                  </label>
                  <select
                    value={newKnowledge.type}
                    onChange={(e) => setNewKnowledge({
                      ...newKnowledge,
                      type: e.target.value as 'terminology' | 'rule' | 'case' | 'style'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="terminology">术语</option>
                    <option value="rule">规则</option>
                    <option value="case">案例</option>
                    <option value="style">风格</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    领域 ({domains.length}个可选)
                  </label>
                  <select
                    value={newKnowledge.domain}
                    onChange={(e) => setNewKnowledge({
                      ...newKnowledge,
                      domain: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择领域</option>
                    {domains.map(domain => (
                      <option key={domain.code} value={domain.code}>
                        {domain.name} ({domain.category_name})
                      </option>
                    ))}
                  </select>
                  {domains.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">正在加载期刊领域选项...</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  知识内容 *
                </label>
                <textarea
                  value={newKnowledge.content}
                  onChange={(e) => setNewKnowledge({
                    ...newKnowledge,
                    content: e.target.value
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入知识内容..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  上下文说明
                </label>
                <textarea
                  value={newKnowledge.context}
                  onChange={(e) => setNewKnowledge({
                    ...newKnowledge,
                    context: e.target.value
                  })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入上下文说明..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    来源
                  </label>
                  <input
                    type="text"
                    value={newKnowledge.source}
                    onChange={(e) => setNewKnowledge({
                      ...newKnowledge,
                      source: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="知识来源..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    置信度
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={newKnowledge.confidence}
                    onChange={(e) => setNewKnowledge({
                      ...newKnowledge,
                      confidence: parseFloat(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  标签 (逗号分隔)
                </label>
                <input
                  type="text"
                  value={Array.isArray(newKnowledge.tags) ? newKnowledge.tags.join(', ') : newKnowledge.tags || ''}
                  onChange={(e) => setNewKnowledge({
                    ...newKnowledge,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: 术语, 专业词汇, 化学"
                />
              </div>

              <button
                onClick={addKnowledgeItem}
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '添加中...' : '添加知识项'}
              </button>
            </div>
          </div>
        </div>

        {/* 配置信息 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ⚙️ 配置信息
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">向量数据库:</span>
              <span className="ml-2 font-mono text-blue-600">Qdrant (本地)</span>
            </div>
            <div>
              <span className="text-gray-600">关系数据库:</span>
              <span className="ml-2 font-mono text-green-600">PostgreSQL (本地)</span>
            </div>
            <div>
              <span className="text-gray-600">向量维度:</span>
                              <span className="ml-2 font-mono text-purple-600">4096</span>
            </div>
            <div>
              <span className="text-gray-600">相似度算法:</span>
              <span className="ml-2 font-mono text-orange-600">Cosine</span>
            </div>
            <div>
              <span className="text-gray-600">嵌入模型:</span>
              <span className="ml-2 font-mono text-indigo-600">Ollama (deepseek-r1:8b) + 本地算法</span>
            </div>
            <div>
              <span className="text-gray-600">AI 模型:</span>
              <span className="ml-2 font-mono text-teal-600">DeepSeek Chat</span>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              💡 <strong>系统状态:</strong> 已升级到 Qdrant + PostgreSQL 双数据库架构，数据完全本地化，确保高性能和安全性。
            </p>
          </div>
          
          {stats && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                📊 <strong>实时统计:</strong> 最后更新: {new Date(stats.last_updated).toLocaleString('zh-CN')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 