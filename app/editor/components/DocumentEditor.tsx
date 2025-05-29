'use client';

import React, { useState, useEffect } from 'react';

interface DocumentEditorProps {
  content: string;
}

interface ErrorItem {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  position: { start: number; end: number };
  original: string;
  suggestion: string;
  reason: string;
  category: string;
}

export default function DocumentEditor({ content }: DocumentEditorProps) {
  const [documentContent, setDocumentContent] = useState(content);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorItem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 调用DeepSeek API进行文档分析
  const analyzeDocument = React.useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: documentContent }),
      });

      if (response.ok) {
        const result = await response.json();
        setErrors(result.errors || []);
      } else {
        console.error('分析失败:', response.statusText);
        // 模拟错误数据用于演示
        setErrors(generateMockErrors());
      }
    } catch (error) {
      console.error('API调用失败:', error);
      // 模拟错误数据用于演示
      setErrors(generateMockErrors());
    } finally {
      setIsAnalyzing(false);
    }
  }, [documentContent]);

  // 生成模拟错误数据（用于演示）
  const generateMockErrors = (): ErrorItem[] => {
    return [
      {
        id: '1',
        type: 'error',
        position: { start: 10, end: 15 },
        original: '错误词',
        suggestion: '正确词',
        reason: '拼写错误',
        category: '语法错误'
      },
      {
        id: '2',
        type: 'warning',
        position: { start: 25, end: 30 },
        original: '可能错误',
        suggestion: '建议修改',
        reason: '语法不规范',
        category: '语法警告'
      },
      {
        id: '3',
        type: 'suggestion',
        position: { start: 45, end: 50 },
        original: '普通词',
        suggestion: '更好的词',
        reason: '可以优化表达',
        category: '优化建议'
      }
    ];
  };

  // 应用修改
  const applyCorrection = (errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (error) {
      const newContent = documentContent.replace(error.original, error.suggestion);
      setDocumentContent(newContent);
      setErrors(errors.filter(e => e.id !== errorId));
      setSelectedError(null);
    }
  };

  // 忽略错误
  const ignoreError = (errorId: string) => {
    setErrors(errors.filter(e => e.id !== errorId));
    setSelectedError(null);
  };

  // 获取错误类型的样式
  const getErrorStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'suggestion':
        return 'bg-green-100 border-green-300 text-green-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // 获取错误类型图标
  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'error':
        return (
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'suggestion':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (content) {
      setDocumentContent(content);
      // 自动开始分析
      setTimeout(() => {
        analyzeDocument();
      }, 1000);
    }
  }, [content, analyzeDocument]);

  return (
    <div className="h-full flex">
      {/* 文档编辑区 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">AI文档编辑器</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isAnalyzing ? 'AI分析中...' : 'AI分析完成'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={analyzeDocument}
              disabled={isAnalyzing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? '分析中...' : '重新分析'}
            </button>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>错误: {errors.filter(e => e.type === 'error').length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>警告: {errors.filter(e => e.type === 'warning').length}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>建议: {errors.filter(e => e.type === 'suggestion').length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 文档内容区 */}
        <div className="flex-1 p-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className="w-full h-full min-h-[600px] p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm leading-relaxed"
              placeholder="文档内容将在这里显示..."
            />
          </div>
        </div>
      </div>

      {/* 错误面板 */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h4 className="font-semibold text-gray-900">检测到的问题</h4>
          <p className="text-sm text-gray-600">点击问题查看详情和修改建议</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {errors.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500">暂无检测到问题</p>
            </div>
          ) : (
            errors.map((error) => (
              <div
                key={error.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedError?.id === error.id
                    ? 'ring-2 ring-blue-500'
                    : 'hover:shadow-md'
                } ${getErrorStyle(error.type)}`}
                onClick={() => setSelectedError(error)}
              >
                <div className="flex items-start space-x-2">
                  {getErrorIcon(error.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium uppercase tracking-wide">
                        {error.category}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">
                      &quot;{error.original}&quot; → &quot;{error.suggestion}&quot;
                    </p>
                    <p className="text-xs opacity-75">{error.reason}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 错误详情和操作 */}
        {selectedError && (
          <div className="border-t border-gray-200 bg-white p-4">
            <h5 className="font-medium text-gray-900 mb-2">修改建议</h5>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">原文:</p>
                <p className="font-mono text-sm">{selectedError.original}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">建议修改为:</p>
                <p className="font-mono text-sm">{selectedError.suggestion}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => applyCorrection(selectedError.id)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  应用修改
                </button>
                <button
                  onClick={() => ignoreError(selectedError.id)}
                  className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-400 transition-colors"
                >
                  忽略
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 