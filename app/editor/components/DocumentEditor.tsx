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

export default function DocumentEditor({ content }: DocumentEditorProps) {
  const [documentContent, setDocumentContent] = useState(content);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [correctionRecords, setCorrectionRecords] = useState<CorrectionRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [selectedErrorTypes, setSelectedErrorTypes] = useState({
    error: true,
    warning: true,
    suggestion: false
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  const editorRef = useRef<HTMLDivElement>(null);

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
        console.log('API返回结果:', result);
        
        if (result.errors && Array.isArray(result.errors)) {
          const validatedErrors = result.errors.map((error: any, index: number) => ({
            id: error.id || `api_error_${Date.now()}_${index}`,
            type: error.type || 'warning',
            position: error.position || { start: index * 10, end: index * 10 + 5 },
            original: error.original || '未知错误',
            suggestion: error.suggestion || '请检查此处',
            reason: error.reason || '需要进一步检查',
            category: error.category || '其他问题'
          }));
          
          setErrors(validatedErrors);
        } else {
          console.warn('API返回数据格式异常:', result);
          setErrors(generateMockErrors());
        }
      } else {
        console.error('分析失败:', response.status, response.statusText);
        setErrors(generateMockErrors());
      }
    } catch (error) {
      console.error('API调用失败:', error);
      setErrors(generateMockErrors());
    } finally {
      setIsAnalyzing(false);
    }
  }, [documentContent]);

  // 生成模拟错误数据
  const generateMockErrors = (): ErrorItem[] => {
    const mockErrors: ErrorItem[] = [];
    
    if (!documentContent || documentContent.length === 0) {
      return [];
    }

    // 1. 检测重复词汇（精确定位）
    const duplicatePattern = /(\S{2,}?)\1+/g;
    let match;
    while ((match = duplicatePattern.exec(documentContent)) !== null && mockErrors.length < 10) {
      const duplicateText = match[0];
      const singleText = match[1];
      
      mockErrors.push({
        id: `mock_duplicate_${match.index}`,
        type: 'error',
        position: { start: match.index, end: match.index + duplicateText.length },
        original: duplicateText,
        suggestion: singleText,
        reason: `重复词汇"${singleText}"，建议删除多余部分`,
        category: '语法错误'
      });
    }

    // 2. 检测重复标点符号
    const punctuationPattern = /([？。！，；：])\1+/g;
    while ((match = punctuationPattern.exec(documentContent)) !== null && mockErrors.length < 10) {
      const duplicatePunct = match[0];
      const singlePunct = match[1];
      
      mockErrors.push({
        id: `mock_punctuation_${match.index}`,
        type: 'warning',
        position: { start: match.index, end: match.index + duplicatePunct.length },
        original: duplicatePunct,
        suggestion: singlePunct,
        reason: `重复标点符号"${singlePunct}"，建议删除多余部分`,
        category: '标点错误'
      });
    }

    // 3. 检测常见错误词汇
    const commonErrors = [
      { pattern: /的的/g, suggestion: '的', reason: '重复使用"的"字' },
      { pattern: /了了/g, suggestion: '了', reason: '重复使用"了"字' },
      { pattern: /在在/g, suggestion: '在', reason: '重复使用"在"字' },
      { pattern: /是是/g, suggestion: '是', reason: '重复使用"是"字' },
      { pattern: /和和/g, suggestion: '和', reason: '重复使用"和"字' },
      { pattern: /或或/g, suggestion: '或', reason: '重复使用"或"字' },
    ];

    commonErrors.forEach(({ pattern, suggestion, reason }) => {
      while ((match = pattern.exec(documentContent)) !== null && mockErrors.length < 10) {
        mockErrors.push({
          id: `mock_common_${match.index}`,
          type: 'error',
          position: { start: match.index, end: match.index + match[0].length },
          original: match[0],
          suggestion: suggestion,
          reason: reason,
          category: '语法错误'
        });
      }
    });

    // 4. 检测可能的错误表达
    const expressionErrors = [
      { pattern: /错误问题/g, suggestion: '错误', reason: '"错误问题"表达重复，建议简化' },
      { pattern: /问题错误/g, suggestion: '问题', reason: '"问题错误"表达重复，建议简化' },
      { pattern: /毛病问题/g, suggestion: '问题', reason: '"毛病问题"表达不当，建议使用"问题"' },
      { pattern: /研究研究/g, suggestion: '研究', reason: '重复使用"研究"，建议删除多余部分' },
      { pattern: /分析分析/g, suggestion: '分析', reason: '重复使用"分析"，建议删除多余部分' },
      { pattern: /方法方法/g, suggestion: '方法', reason: '重复使用"方法"，建议删除多余部分' },
    ];

    expressionErrors.forEach(({ pattern, suggestion, reason }) => {
      while ((match = pattern.exec(documentContent)) !== null && mockErrors.length < 10) {
        mockErrors.push({
          id: `mock_expression_${match.index}`,
          type: 'error',
          position: { start: match.index, end: match.index + match[0].length },
          original: match[0],
          suggestion: suggestion,
          reason: reason,
          category: '语法错误'
        });
      }
    });

    // 5. 检测标点符号错误
    const punctErrors = [
      { pattern: /？。/g, suggestion: '？', reason: '问号后不需要句号' },
      { pattern: /。？/g, suggestion: '？', reason: '句号后不需要问号' },
      { pattern: /！。/g, suggestion: '！', reason: '感叹号后不需要句号' },
      { pattern: /。！/g, suggestion: '！', reason: '句号后不需要感叹号' },
    ];

    punctErrors.forEach(({ pattern, suggestion, reason }) => {
      while ((match = pattern.exec(documentContent)) !== null && mockErrors.length < 10) {
        mockErrors.push({
          id: `mock_punct_error_${match.index}`,
          type: 'warning',
          position: { start: match.index, end: match.index + match[0].length },
          original: match[0],
          suggestion: suggestion,
          reason: reason,
          category: '标点错误'
        });
      }
    });

    // 6. 检测过长句子（建议优化）
    const sentences = documentContent.split(/[。！？]/);
    let currentPos = 0;
    
    sentences.forEach((sentence, index) => {
      if (sentence.length > 60 && mockErrors.length < 10) {
        const sentenceStart = documentContent.indexOf(sentence, currentPos);
        if (sentenceStart !== -1) {
          mockErrors.push({
            id: `mock_long_sentence_${index}`,
            type: 'suggestion',
            position: { start: sentenceStart, end: sentenceStart + sentence.length },
            original: sentence,
            suggestion: `${sentence.substring(0, 30)}...（建议分句）`,
            reason: '句子过长，建议分解为多个短句以提高可读性',
            category: '表达优化'
          });
        }
      }
      currentPos += sentence.length + 1; // +1 for the punctuation
    });

    // 如果没有找到任何错误，添加一个示例
    if (mockErrors.length === 0) {
      const sampleText = documentContent.substring(0, Math.min(20, documentContent.length));
      mockErrors.push({
        id: 'mock_demo_1',
        type: 'suggestion',
        position: { start: 0, end: sampleText.length },
        original: sampleText,
        suggestion: '建议优化开头表达',
        reason: '文档开头可以更加吸引读者',
        category: '整体优化'
      });
    }

    return mockErrors;
  };

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
  const applyCorrection = (errorId: string, newSuggestion?: string) => {
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

      // 移除已处理的错误
      setErrors(errors.filter(e => e.id !== errorId));
    }
  };

  // 忽略错误
  const ignoreError = (errorId: string) => {
    setErrors(errors.filter(e => e.id !== errorId));
  };

  // 开始编辑
  const startEditing = (errorId: string, currentContent: string) => {
    setEditingState({ errorId, content: currentContent });
  };

  // 保存编辑
  const saveEdit = () => {
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

  useEffect(() => {
    if (content) {
      setDocumentContent(content);
      setTimeout(() => {
        analyzeDocument();
      }, 1000);
    }
  }, [content, analyzeDocument]);

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

        {/* 使用说明 */}
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>使用说明:</strong> 
              悬停彩色标注查看AI建议 → 点击"应用"一键替换 → 点击"忽略"跳过建议 → 直接点击标注文字进行自定义编辑
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
                    "{error.original}" → "{error.suggestion}"
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