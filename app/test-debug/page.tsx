'use client';

import React, { useState } from 'react';

export default function TestDebugPage() {
  const [content, setContent] = useState('基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const testAPI = async () => {
    setIsLoading(true);
    setError('');
    setResult('');
    
    try {
      console.log('开始测试API调用');
      console.log('内容:', content);
      
      const response = await fetch('/api/analyze-document-rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      console.log('响应状态:', response.status, response.statusText);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('响应数据:', data);
        setResult(JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.error('错误响应:', errorText);
        setError(`${response.status} ${response.statusText}: ${errorText}`);
      }
    } catch (err) {
      console.error('请求异常:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`请求异常: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">RAG API 调试页面</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            测试内容:
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            rows={4}
          />
        </div>
        
        <button
          onClick={testAPI}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? '测试中...' : '测试 API'}
        </button>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-medium text-red-800">错误信息：</h3>
            <pre className="mt-2 text-sm text-red-700">{error}</pre>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800">成功响应：</h3>
            <pre className="mt-2 text-sm text-green-700 overflow-x-auto">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
} 