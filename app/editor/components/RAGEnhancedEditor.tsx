'use client';

import React, { useState, useEffect, useRef } from 'react';

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

interface RAGEnhancedResult {
  errors: ErrorItem[];
  domain_info: {
    domain: string;
    confidence: number;
    keywords: string[];
  };
  knowledge_used: string[];
  rag_confidence: number;
  fallback_used: boolean;
}

interface CorrectionRecord {
  id: string;
  original: string;
  corrected: string;
  timestamp: Date;
}

interface EditingState {
  errorId: string;
  content: string;
}

export default function RAGEnhancedEditor({ content }: DocumentEditorProps) {
  const [documentContent, setDocumentContent] = useState(content);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [ragResults, setRagResults] = useState<RAGEnhancedResult | null>(null);
  const [correctionRecords, setCorrectionRecords] = useState<CorrectionRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [selectedErrorTypes, setSelectedErrorTypes] = useState({
    error: true,
    warning: true,
    suggestion: false
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUsingRAG, setIsUsingRAG] = useState(true);

  const editorRef = useRef<HTMLDivElement>(null);

  // RAG增强的文档分析
  const analyzeDocumentWithRAG = React.useCallback(async () => {
    // 内容检查
    if (!documentContent || documentContent.trim().length === 0) {
      console.warn('文档内容为空，跳过分析');
      return;
    }

    setIsAnalyzing(true);
    try {
      const endpoint = isUsingRAG ? '/api/analyze-document-rag' : '/api/analyze-document';
      
      console.log('发送分析请求:', { endpoint, contentLength: documentContent.length, isUsingRAG });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: documentContent }),
      });

      console.log('API响应状态:', response.status, response.statusText);

      if (response.ok) {
        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('API返回了非JSON响应:', contentType);
          const textResponse = await response.text();
          console.error('响应内容:', textResponse.substring(0, 200));
          throw new Error('API返回了非JSON响应');
        }

        const result = await response.json();
        console.log('分析结果:', result);
        
        if (isUsingRAG && result.domain_info) {
          setRagResults(result);
        }
        
        if (result.errors && Array.isArray(result.errors)) {
          const validatedErrors = result.errors.map((error: {
            id?: string;
            type?: string;
            position?: { start: number; end: number };
            original?: string;
            suggestion?: string;
            reason?: string;
            category?: string;
          }, index: number) => ({
            id: error.id || `error_${Date.now()}_${index}`,
            type: (error.type as 'error' | 'warning' | 'suggestion') || 'warning',
            position: error.position || { start: index * 10, end: index * 10 + 5 },
            original: error.original || '未知错误',
            suggestion: error.suggestion || '请检查此处',
            reason: error.reason || '需要进一步检查',
            category: error.category || '其他问题'
          }));
          
          setErrors(validatedErrors);
        } else {
          console.warn('分析结果格式异常:', result);
          setErrors([]);
        }
      } else {
        // 获取错误详情
        let errorText = '';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorResult = await response.json();
            errorText = errorResult.error || response.statusText;
          } else {
            errorText = await response.text();
          }
        } catch (e) {
          errorText = response.statusText;
        }
        
        console.error('分析失败:', response.status, errorText);
        throw new Error(`${response.status} "${errorText}"`);
      }
    } catch (error) {
      console.error('分析调用失败:', error);
      throw error; // 重新抛出错误，让调用者处理
    } finally {
      setIsAnalyzing(false);
    }
  }, [documentContent, isUsingRAG]);

  // 获取错误类型的样式
  const getErrorStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 border-b-2 border-red-400 text-red-900';
      case 'warning':
        return 'bg-yellow-100 border-b-2 border-yellow-400 text-yellow-900';
      case 'suggestion':
        return 'bg-green-100 border-b-2 border-green-400 text-green-900';
      default:
        return '';
    }
  };

  // 获取建议提示的样式
  const getSuggestionStyle = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border border-yellow-200 text-yellow-800';
      case 'suggestion':
        return 'bg-green-50 border border-green-200 text-green-800';
      default:
        return '';
    }
  };

  // 应用修改
  const applyCorrection = async (errorId: string, newSuggestion?: string) => {
    const error = errors.find(e => e.id === errorId);
    if (error) {
      const suggestion = newSuggestion || error.suggestion;
      const newContent = documentContent.replace(error.original, suggestion);
      setDocumentContent(newContent);
      
      // 添加纠错记录
      setCorrectionRecords(prev => [...prev, {
        id: `correction_${Date.now()}`,
        original: error.original,
        corrected: suggestion,
        timestamp: new Date()
      }]);

              // RAG用户反馈学习
        if (isUsingRAG && ragResults) {
          try {
            const response = await fetch('/api/knowledge-base', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                original: error.original,
                suggestion: suggestion,
                feedback: 'accept',
                domain: ragResults.domain_info.domain,
                finalVersion: suggestion
              })
            });

            if (response.ok) {
              const result = await response.json();
              console.log('用户反馈学习完成: 接受建议', result);
            } else {
              console.error('用户反馈学习失败: 响应状态', response.status);
            }
          } catch (error) {
            console.error('用户反馈学习失败:', error);
          }
        }

      // 移除已处理的错误
      setErrors(errors.filter(e => e.id !== errorId));
    }
  };

  // 忽略错误
  const ignoreError = async (errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    
    // RAG用户反馈学习
    if (isUsingRAG && ragResults && error) {
      try {
        const response = await fetch('/api/knowledge-base', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            original: error.original,
            suggestion: error.suggestion,
            feedback: 'reject',
            domain: ragResults.domain_info.domain
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('用户反馈学习完成: 拒绝建议', result);
        } else {
          console.error('用户反馈学习失败: 响应状态', response.status);
        }
      } catch (error) {
        console.error('用户反馈学习失败:', error);
      }
    }
    
    setErrors(errors.filter(e => e.id !== errorId));
  };

  // 开始编辑
  const startEditing = (errorId: string, currentContent: string) => {
    setEditingState({ errorId, content: currentContent });
  };

  // 保存编辑
  const saveEdit = async () => {
    if (editingState) {
      const error = errors.find(e => e.id === editingState.errorId);
      if (error) {
        const newContent = documentContent.replace(error.original, editingState.content);
        setDocumentContent(newContent);
        
        // 添加纠错记录
        setCorrectionRecords(prev => [...prev, {
          id: `correction_${Date.now()}`,
          original: error.original,
          corrected: editingState.content,
          timestamp: new Date()
        }]);

        // RAG用户反馈学习 - 自定义编辑
        if (isUsingRAG && ragResults) {
          try {
            const response = await fetch('/api/knowledge-base', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                original: error.original,
                suggestion: error.suggestion,
                feedback: 'modify',
                domain: ragResults.domain_info.domain,
                finalVersion: editingState.content
              })
            });

            if (response.ok) {
              const result = await response.json();
              console.log('用户反馈学习完成: 自定义修改', result);
            } else {
              console.error('用户反馈学习失败: 响应状态', response.status);
            }
          } catch (error) {
            console.error('用户反馈学习失败:', error);
          }
        }

        // 移除已处理的错误
        setErrors(errors.filter(e => e.id !== editingState.errorId));
      }
      setEditingState(null);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingState(null);
  };

  // 一键纠错
  const handleBatchCorrection = () => {
    const filteredErrors = errors.filter(error => selectedErrorTypes[error.type]);
    
    filteredErrors.forEach(error => {
      const newContent = documentContent.replace(error.original, error.suggestion);
      setDocumentContent(newContent);
      
      setCorrectionRecords(prev => [...prev, {
        id: `correction_${Date.now()}_${error.id}`,
        original: error.original,
        corrected: error.suggestion,
        timestamp: new Date()
      }]);
    });

    setErrors(errors.filter(error => !selectedErrorTypes[error.type]));
  };

  // 渲染带有内联纠错的文档内容
  const renderDocumentWithInlineCorrections = () => {
    if (errors.length === 0) {
      return <div className="whitespace-pre-wrap leading-relaxed">{documentContent}</div>;
    }

    const sortedErrors = [...errors].sort((a, b) => a.position.start - b.position.start);
    const parts = [];
    let lastIndex = 0;

    sortedErrors.forEach((error, index) => {
      // 添加错误前的正常文本
      if (error.position.start > lastIndex) {
        parts.push(
          <span key={`text_${index}`}>
            {documentContent.slice(lastIndex, error.position.start)}
          </span>
        );
      }

      // 添加错误标注和内联建议
      parts.push(
        <span key={error.id} className="relative inline-block">
          {/* 错误文本标注 */}
          {editingState?.errorId === error.id ? (
            // 编辑模式
            <span className="inline-flex items-center bg-blue-50 border-2 border-blue-300 rounded-lg px-2 py-1">
              <input
                type="text"
                value={editingState.content}
                onChange={(e) => setEditingState({ ...editingState, content: e.target.value })}
                className="bg-transparent border-none outline-none text-sm font-medium text-blue-900 min-w-0 flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                style={{ width: `${Math.max(editingState.content.length * 8, 60)}px` }}
              />
              <div className="flex items-center space-x-1 ml-2">
                <button
                  onClick={saveEdit}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors flex items-center space-x-1"
                  title="保存修改 (Enter)"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>保存</span>
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-2 py-1 bg-gray-400 text-white text-xs rounded-md hover:bg-gray-500 transition-colors flex items-center space-x-1"
                  title="取消编辑 (Escape)"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>取消</span>
                </button>
              </div>
            </span>
          ) : (
            // 标注模式
            <span
              className={`${getErrorStyle(error.type)} px-2 py-1 rounded-md cursor-pointer relative group transition-all duration-200 hover:shadow-md hover:scale-105 border-l-4 ${
                error.type === 'error' ? 'border-l-red-500' : 
                error.type === 'warning' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}
              onClick={() => startEditing(error.id, error.original)}
              title={`${error.category}: ${error.reason} (点击编辑)`}
            >
              <span className="relative">
                {error.original}
                {/* 错误类型指示器 */}
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  error.type === 'error' ? 'bg-red-500' : 
                  error.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                } opacity-75 animate-pulse`}></span>
              </span>
              
              {/* 内联建议提示 */}
              <span className={`absolute top-full left-0 mt-2 px-3 py-2 ${getSuggestionStyle(error.type)} rounded-lg shadow-xl text-xs z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 min-w-max max-w-sm`}>
                <div className="flex flex-col space-y-2">
                  {/* 建议内容 */}
                  <div className="flex items-center space-x-2">
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="font-medium">建议: {error.suggestion}</span>
                  </div>
                  
                  {/* 错误原因 */}
                  <div className="text-xs opacity-75 border-t pt-1">
                    {error.reason}
                  </div>
                  
                  {/* RAG增强信息 */}
                  {isUsingRAG && ragResults && (
                    <div className="text-xs opacity-60 border-t pt-1">
                      <span className="text-blue-600">RAG增强</span>
                      {ragResults.knowledge_used.length > 0 && (
                        <span className="ml-1">· 基于专业知识库</span>
                      )}
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        applyCorrection(error.id);
                      }}
                      className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs font-medium flex items-center justify-center space-x-1"
                      title="应用建议"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>应用</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        ignoreError(error.id);
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors text-xs font-medium flex items-center justify-center space-x-1"
                      title="忽略建议"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>忽略</span>
                    </button>
                  </div>
                </div>
                
                {/* 箭头指示器 */}
                <div className="absolute -top-2 left-3 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-current"></div>
              </span>
            </span>
          )}
        </span>
      );

      lastIndex = error.position.end;
    });

    // 添加最后的正常文本
    if (lastIndex < documentContent.length) {
      parts.push(
        <span key="text_final">
          {documentContent.slice(lastIndex)}
        </span>
      );
    }

    return <div className="whitespace-pre-wrap leading-relaxed">{parts}</div>;
  };

  // 获取错误统计
  const getErrorStats = () => {
    const stats = {
      total: errors.length,
      error: errors.filter(e => e.type === 'error').length,
      warning: errors.filter(e => e.type === 'warning').length,
      suggestion: errors.filter(e => e.type === 'suggestion').length
    };
    return stats;
  };

  // 获取分类列表
  const getCategories = () => {
    const categories = ['all', ...new Set(errors.map(e => e.category))];
    return categories;
  };

  // 过滤错误
  const getFilteredErrors = () => {
    return errors.filter(error => 
      selectedCategory === 'all' || error.category === selectedCategory
    );
  };

  // 自动分析文档
  const performAutoAnalysis = React.useCallback(async () => {
    try {
      await analyzeDocumentWithRAG();
    } catch (error) {
      console.error('自动分析失败:', error);
      setErrors([]);
    }
  }, [analyzeDocumentWithRAG]);

  useEffect(() => {
    if (content && content.trim().length > 0) {
      setDocumentContent(content);
      // 延迟1秒后自动分析，避免频繁调用
      const timer = setTimeout(() => {
        performAutoAnalysis();
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [content, performAutoAnalysis]);

  const stats = getErrorStats();
  const categories = getCategories();
  const filteredErrors = getFilteredErrors();

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
                {isAnalyzing ? (isUsingRAG ? 'RAG增强分析中...' : 'AI分析中...') : (isUsingRAG ? 'RAG增强分析完成' : 'AI分析完成')}
              </span>
            </div>
            
            {/* RAG功能开关 */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isUsingRAG}
                  onChange={(e) => setIsUsingRAG(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-blue-600 font-medium">RAG增强</span>
              </label>
              {ragResults && isUsingRAG && (
                <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  {ragResults.domain_info.domain} · {(ragResults.rag_confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  await analyzeDocumentWithRAG();
                } catch (error) {
                  console.error('手动分析失败:', error);
                  setErrors([]);
                }
              }}
              disabled={isAnalyzing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? '分析中...' : (isUsingRAG ? 'RAG增强分析' : '重新分析')}
            </button>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>确定错误: {stats.error}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>疑似错误: {stats.warning}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>优化建议: {stats.suggestion}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RAG增强信息面板 */}
        {isUsingRAG && ragResults && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 p-3">
            <div className="flex items-start space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-medium text-blue-800">RAG增强分析</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-blue-700">检测领域: </span>
                    <span className="font-medium text-blue-900">{ragResults.domain_info.domain}</span>
                    <span className="text-blue-600 ml-1">({(ragResults.domain_info.confidence * 100).toFixed(0)}%)</span>
                  </div>
                  
                  <div>
                    <span className="text-blue-700">知识库应用: </span>
                    <span className="font-medium text-blue-900">{ragResults.knowledge_used.length}条</span>
                  </div>
                  
                  <div>
                    <span className="text-blue-700">RAG置信度: </span>
                    <span className="font-medium text-blue-900">{(ragResults.rag_confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                {ragResults.domain_info.keywords.length > 0 && (
                  <div className="mt-1">
                    <span className="text-blue-700 text-xs">关键词: </span>
                    {ragResults.domain_info.keywords.slice(0, 6).map((keyword, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-1">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>使用说明:</strong> 
              {isUsingRAG ? 'RAG增强模式已启用，基于专业知识库提供更精确的纠错建议' : '使用基础AI分析模式'} → 
              悬停彩色标注查看建议 → 点击&quot;应用&quot;一键替换 → 点击&quot;忽略&quot;跳过建议 → 直接点击标注文字进行自定义编辑
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-4 text-xs text-blue-700">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border-l-2 border-red-500 rounded"></div>
              <span>确定错误</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 border-l-2 border-yellow-500 rounded"></div>
              <span>疑似错误</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border-l-2 border-green-500 rounded"></div>
              <span>优化建议</span>
            </div>
          </div>
        </div>

        {/* 文档内容区 */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="h-full p-6">
              <div className="max-w-4xl mx-auto h-full">
                <div 
                  ref={editorRef}
                  className="h-full min-h-[600px] p-6 border border-gray-300 rounded-lg bg-white text-gray-900 text-base leading-relaxed overflow-y-auto"
                  style={{ 
                    fontFamily: 'Georgia, serif',
                    maxHeight: 'calc(100vh - 250px)'
                  }}
                >
                  {renderDocumentWithInlineCorrections()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧边栏 */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
        {/* 错误统计和筛选 */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">错误统计</h4>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              共 {stats.total} 个问题
            </span>
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">错误类型筛选</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? '全部类型' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RAG知识库信息 */}
        {isUsingRAG && ragResults && ragResults.knowledge_used.length > 0 && (
          <div className="p-4 border-b border-gray-200 bg-white">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              应用的专业知识
            </h5>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {ragResults.knowledge_used.slice(0, 3).map((knowledge, index) => (
                <div key={index} className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                  <div className="font-medium">{knowledge.substring(0, 50)}...</div>
                </div>
              ))}
              {ragResults.knowledge_used.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  还有 {ragResults.knowledge_used.length - 3} 条知识应用
                </div>
              )}
            </div>
          </div>
        )}

        {/* 一键纠错 */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <h5 className="font-medium text-gray-900 mb-3">一键纠错</h5>
          
          <div className="space-y-2 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedErrorTypes.error}
                onChange={(e) => setSelectedErrorTypes(prev => ({
                  ...prev,
                  error: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">确定错误 ({stats.error})</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedErrorTypes.warning}
                onChange={(e) => setSelectedErrorTypes(prev => ({
                  ...prev,
                  warning: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">疑似错误 ({stats.warning})</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={selectedErrorTypes.suggestion}
                onChange={(e) => setSelectedErrorTypes(prev => ({
                  ...prev,
                  suggestion: e.target.checked
                }))}
                className="mr-2"
              />
              <span className="text-sm">优化建议 ({stats.suggestion})</span>
            </label>
          </div>

          <button
            onClick={handleBatchCorrection}
            disabled={!Object.values(selectedErrorTypes).some(Boolean) || errors.length === 0}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            一键纠错
          </button>
        </div>

        {/* 纠错记录和当前错误列表 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h5 className="font-medium text-gray-900 mb-3">纠错记录</h5>
            {correctionRecords.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                暂无纠错记录
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {correctionRecords.map((record) => (
                  <div key={record.id} className="bg-white p-3 rounded border text-sm">
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <div className="text-red-600 line-through">{record.original}</div>
                        <div className="text-blue-600 font-medium">{record.corrected}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {record.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 当前错误列表 */}
          <div className="p-4">
            <h5 className="font-medium text-gray-900 mb-3">待处理错误</h5>
            <div className="space-y-2">
              {filteredErrors.map((error) => (
                <div
                  key={error.id}
                  className={`p-2 rounded border cursor-pointer transition-all hover:shadow-md ${getErrorStyle(error.type)}`}
                >
                  <div className="text-xs font-medium uppercase tracking-wide mb-1">
                    {error.category}
                  </div>
                  <div className="text-sm font-medium mb-1">
                    &quot;{error.original}&quot; → &quot;{error.suggestion}&quot;
                  </div>
                  <div className="text-xs opacity-75">{error.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 