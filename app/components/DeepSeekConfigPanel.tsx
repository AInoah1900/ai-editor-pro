'use client';

import React, { useState, useEffect } from 'react';

interface ConfigStatus {
  currentProvider: 'cloud' | 'local';
  cloudStatus: { available: boolean; configured: boolean };
  localStatus: { available: boolean; configured: boolean };
  recommendations: string[];
}

interface HealthStatus {
  cloud: { available: boolean; error?: string };
  local: { available: boolean; error?: string };
  current: 'cloud' | 'local';
}

interface ModelInfo {
  localModels: string[];
  currentModel: string;
  isAvailable: boolean;
  error?: string;
}

/**
 * DeepSeek API配置管理面板
 */
export default function DeepSeekConfigPanel() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [testing, setTesting] = useState<'cloud' | 'local' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // 加载配置状态
  const loadConfigStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deepseek-config?action=status');
      const result = await response.json();
      
      if (result.success) {
        setConfigStatus(result.data);
      } else {
        setMessage({ type: 'error', text: result.error || '获取配置状态失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，无法获取配置状态' });
    } finally {
      setLoading(false);
    }
  };

  // 执行健康检查
  const performHealthCheck = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/deepseek-config?action=health');
      const result = await response.json();
      
      if (result.success) {
        setHealthStatus(result.data);
      } else {
        setMessage({ type: 'error', text: result.error || '健康检查失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，无法执行健康检查' });
    } finally {
      setLoading(false);
    }
  };

  // 加载模型信息
  const loadModelInfo = async () => {
    try {
      const response = await fetch('/api/deepseek-config?action=models');
      const result = await response.json();
      
      if (result.success) {
        setModelInfo(result.data);
      } else {
        setMessage({ type: 'error', text: result.error || '获取模型信息失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，无法获取模型信息' });
    }
  };

  // 切换API提供商
  const switchProvider = async (provider: 'cloud' | 'local') => {
    try {
      setSwitching(true);
      const response = await fetch('/api/deepseek-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'switchProvider',
          provider 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        // 重新加载所有状态，确保数据同步
        await Promise.all([
          loadConfigStatus(),
          performHealthCheck(),
          loadModelInfo()
        ]);
      } else {
        setMessage({ type: 'error', text: result.error || '切换失败' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，切换失败' });
    } finally {
      setSwitching(false);
    }
  };

  // 测试API连接
  const testConnection = async (provider: 'cloud' | 'local') => {
    try {
      setTesting(provider);
      const response = await fetch('/api/deepseek-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'testConnection',
          provider 
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${provider === 'cloud' ? '云端' : '本地'}API连接测试成功！${result.message}` 
        });
        
        // 测试成功后，刷新对应提供商的健康状态
        setTimeout(() => {
          performHealthCheck();
        }, 500);
      } else {
        setMessage({ 
          type: 'error', 
          text: `❌ ${provider === 'cloud' ? '云端' : '本地'}API连接测试失败: ${result.error || '连接测试失败'}` 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `❌ ${provider === 'cloud' ? '云端' : '本地'}API网络错误，连接测试失败: ${error instanceof Error ? error.message : '未知错误'}` 
      });
    } finally {
      setTesting(null);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadConfigStatus();
    performHealthCheck();
    loadModelInfo();
  }, []);

  // 自动清除消息
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🤖 DeepSeek API 配置管理
        </h2>
        <div className="flex gap-2">
          <button
            onClick={loadConfigStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新状态'}
          </button>
          <button
            onClick={performHealthCheck}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            健康检查
          </button>
          <button
            onClick={async () => {
              setLoading(true);
              await Promise.all([
                loadConfigStatus(),
                performHealthCheck(),
                loadModelInfo()
              ]);
              setLoading(false);
              setMessage({ type: 'success', text: '所有状态已刷新' });
            }}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            🔄 全部刷新
          </button>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 当前状态 */}
      {configStatus && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📊 当前状态</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">
                {configStatus.currentProvider === 'cloud' ? '🌐' : '🏠'}
              </div>
              <div className="font-medium">当前提供商</div>
              <div className="text-sm text-gray-600">
                {configStatus.currentProvider === 'cloud' ? '云端API' : '本地API'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${configStatus.cloudStatus.available ? '✅' : '❌'}`}>
                {configStatus.cloudStatus.available ? '✅' : '❌'}
              </div>
              <div className="font-medium">云端API</div>
              <div className="text-sm text-gray-600">
                {configStatus.cloudStatus.configured ? '已配置' : '未配置'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-2xl mb-2 ${configStatus.localStatus.available ? '✅' : '❌'}`}>
                {configStatus.localStatus.available ? '✅' : '❌'}
              </div>
              <div className="font-medium">本地API</div>
              <div className="text-sm text-gray-600">
                {configStatus.localStatus.configured ? '已配置' : '未配置'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API提供商控制 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">🔄 API提供商切换</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 云端API */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                🌐 云端API
                {healthStatus?.cloud.available && (
                  <span className="text-green-500 text-sm">●</span>
                )}
              </h4>
              {configStatus?.currentProvider === 'cloud' && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  当前使用
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <div>状态: {configStatus?.cloudStatus.available ? '可用' : '不可用'}</div>
              <div>配置: {configStatus?.cloudStatus.configured ? '已配置' : '未配置'}</div>
              {healthStatus?.cloud.error && (
                <div className="text-orange-600 mt-1">
                  <span className="text-xs font-medium">健康检查:</span> {healthStatus.cloud.error}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => switchProvider('cloud')}
                disabled={switching || configStatus?.currentProvider === 'cloud'}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
              >
                {switching ? '切换中...' : '切换到云端'}
              </button>
              <button
                onClick={() => testConnection('cloud')}
                disabled={testing === 'cloud'}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
              >
                {testing === 'cloud' ? '测试中...' : '测试'}
              </button>
            </div>
          </div>

          {/* 本地API */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                🏠 本地API
                {healthStatus?.local.available && (
                  <span className="text-green-500 text-sm">●</span>
                )}
              </h4>
              {configStatus?.currentProvider === 'local' && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                  当前使用
                </span>
              )}
            </div>
            
            <div className="text-sm text-gray-600 mb-3">
              <div>状态: {configStatus?.localStatus.available ? '可用' : '不可用'}</div>
              <div>地址: http://localhost:11434</div>
              {modelInfo && (
                <>
                  <div>当前模型: {modelInfo.currentModel}</div>
                  {modelInfo.localModels.length > 0 && (
                    <div>可用模型: {modelInfo.localModels.join(', ')}</div>
                  )}
                </>
              )}
              {healthStatus?.local.error && (
                <div className="text-orange-600 mt-1">
                  <span className="text-xs font-medium">健康检查:</span> {healthStatus.local.error}
                </div>
              )}
              {modelInfo?.error && (
                <div className="text-orange-600 mt-1">
                  <span className="text-xs font-medium">模型检查:</span> {modelInfo.error}
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => switchProvider('local')}
                disabled={switching || configStatus?.currentProvider === 'local'}
                className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
              >
                {switching ? '切换中...' : '切换到本地'}
              </button>
              <button
                onClick={() => testConnection('local')}
                disabled={testing === 'local'}
                className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 text-sm"
              >
                {testing === 'local' ? '测试中...' : '测试'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 本地模型详细信息 */}
      {modelInfo && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">🤖 本地模型信息</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">当前配置模型</div>
                <div className="text-lg font-mono bg-white px-3 py-2 rounded border">
                  {modelInfo.currentModel}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">可用状态</div>
                <div className={`text-lg px-3 py-2 rounded border ${
                  modelInfo.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {modelInfo.isAvailable ? '✅ 可用' : '❌ 不可用'}
                </div>
              </div>
            </div>
            
            {modelInfo.localModels.length > 0 && (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  可用模型列表 ({modelInfo.localModels.length}个)
                </div>
                <div className="flex flex-wrap gap-2">
                  {modelInfo.localModels.map((model, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm font-mono ${
                        model === modelInfo.currentModel
                          ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {model}
                      {model === modelInfo.currentModel && (
                        <span className="ml-1 text-blue-600">●</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={loadModelInfo}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                🔄 刷新模型信息
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 配置建议 */}
      {configStatus?.recommendations && configStatus.recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">💡 配置建议</h3>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
              {configStatus.recommendations.map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-3">📖 使用说明</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <div><strong>云端API:</strong> 使用DeepSeek官方API服务，需要配置API密钥，响应速度快，功能完整。</div>
          <div><strong>本地API:</strong> 使用本地部署的模型服务，无需API密钥，数据更安全，但需要本地运行模型。</div>
          <div><strong>自动切换:</strong> 系统会自动检测可用的API并智能切换，确保服务稳定性。</div>
          <div><strong>配置环境变量:</strong></div>
          <div className="ml-4 font-mono text-xs bg-gray-100 p-2 rounded">
            DEEPSEEK_API_KEY=your-api-key<br/>
            DEEPSEEK_PROVIDER=cloud|local<br/>
            DEEPSEEK_LOCAL_BASE_URL=http://localhost:11434/api
          </div>
        </div>
      </div>
    </div>
  );
} 