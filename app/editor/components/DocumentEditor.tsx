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

interface FloatingMenu {
  show: boolean;
  x: number;
  y: number;
  errorId: string;
}

export default function DocumentEditor({ content }: DocumentEditorProps) {
  const [documentContent, setDocumentContent] = useState(content);
  const [errors, setErrors] = useState<ErrorItem[]>([]);
  const [correctionRecords, setCorrectionRecords] = useState<CorrectionRecord[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorItem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [floatingMenu, setFloatingMenu] = useState<FloatingMenu>({
    show: false,
    x: 0,
    y: 0,
    errorId: ''
  });
  const [editingErrorId, setEditingErrorId] = useState<string | null>(null);
  const [editingSuggestion, setEditingSuggestion] = useState('');
  const [selectedErrorTypes, setSelectedErrorTypes] = useState({
    error: true,
    warning: true,
    suggestion: false
  });
  const [selectedCategory, setSelectedCategory] = useState('all');

  const editorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
          // 确保每个错误都有正确的位置信息
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

  // 生成模拟错误数据（用于演示）
  const generateMockErrors = (): ErrorItem[] => {
    const mockErrors: ErrorItem[] = [];
    
    if (!documentContent || documentContent.length === 0) {
      return [];
    }

    const words = documentContent.split(/\s+/);
    let position = 0;

    words.forEach((word, index) => {
      if (mockErrors.length >= 8) return; // 限制错误数量

      const wordStart = documentContent.indexOf(word, position);
      const wordEnd = wordStart + word.length;
      position = wordEnd;

      // 检测实际的错误模式
      if (word.includes('的的') || word.includes('了了') || word.includes('在在') || word.includes('是是')) {
        mockErrors.push({
          id: `mock_duplicate_${index}`,
          type: 'error',
          position: { start: wordStart, end: wordEnd },
          original: word,
          suggestion: word.replace(/(.)\1/, '$1'),
          reason: '重复词汇，需要删除多余的字',
          category: '语法错误'
        });
      } else if (word.includes('？') && word.includes('。')) {
        mockErrors.push({
          id: `mock_punctuation_${index}`,
          type: 'warning',
          position: { start: wordStart, end: wordEnd },
          original: word,
          suggestion: word.replace('？。', '？').replace('。？', '？'),
          reason: '标点符号使用重复',
          category: '标点错误'
        });
      } else if (word.includes('错误') || word.includes('问题') || word.includes('毛病')) {
        mockErrors.push({
          id: `mock_negative_${index}`,
          type: 'warning',
          position: { start: wordStart, end: wordEnd },
          original: word,
          suggestion: word.replace('错误', '内容').replace('问题', '情况').replace('毛病', '特点'),
          reason: '建议使用更中性的表达',
          category: '表达优化'
        });
      } else if (word.length > 6 && Math.random() > 0.8) {
        mockErrors.push({
          id: `mock_suggestion_${index}`,
          type: 'suggestion',
          position: { start: wordStart, end: wordEnd },
          original: word,
          suggestion: `${word}（可简化）`,
          reason: '表达可以更加简洁明了',
          category: '表达优化'
        });
      }
    });

    // 如果没有找到错误，添加一些通用的演示错误
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
        return 'bg-red-50 border-b-2 border-red-400 text-red-900 hover:bg-red-100 transition-colors duration-200';
      case 'warning':
        return 'bg-yellow-50 border-b-2 border-yellow-400 text-yellow-900 hover:bg-yellow-100 transition-colors duration-200';
      case 'suggestion':
        return 'bg-green-50 border-b-2 border-green-400 text-green-900 hover:bg-green-100 transition-colors duration-200';
      default:
        return '';
    }
  };

  // 获取已纠正内容的样式
  const getCorrectedStyle = () => {
    return 'bg-blue-50 border-b-2 border-blue-400 text-blue-900 hover:bg-blue-100 transition-colors duration-200';
  };

  // 处理错误点击，显示浮动菜单
  const handleErrorClick = (event: React.MouseEvent, errorId: string) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const error = errors.find(e => e.id === errorId);
    
    if (error) {
      setSelectedError(error);
      
      // 计算菜单的最佳位置
      const menuHeight = 280; // 预估菜单高度
      const menuWidth = 320; // 菜单宽度
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      let x = rect.left + scrollX;
      let y = rect.top + scrollY - menuHeight - 10; // 默认显示在上方
      
      // 如果上方空间不够，显示在下方
      if (rect.top < menuHeight + 20) {
        y = rect.bottom + scrollY + 10;
      }
      
      // 如果右侧空间不够，调整到左侧
      if (rect.left + menuWidth > viewportWidth) {
        x = Math.max(10, rect.right + scrollX - menuWidth);
      }
      
      // 确保菜单不会超出左边界
      x = Math.max(10, x);
      
      // 确保菜单不会超出上边界
      y = Math.max(10, y);
      
      setFloatingMenu({
        show: true,
        x: x,
        y: y,
        errorId: errorId
      });
    }
  };

  // 关闭浮动菜单
  const closeFloatingMenu = () => {
    setFloatingMenu({ show: false, x: 0, y: 0, errorId: '' });
    setEditingErrorId(null);
    setEditingSuggestion('');
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
      closeFloatingMenu();
    }
  };

  // 忽略错误
  const ignoreError = (errorId: string) => {
    setErrors(errors.filter(e => e.id !== errorId));
    closeFloatingMenu();
  };

  // 开始编辑建议
  const startEditingSuggestion = (errorId: string, currentSuggestion: string) => {
    setEditingErrorId(errorId);
    setEditingSuggestion(currentSuggestion);
  };

  // 保存编辑的建议
  const saveEditedSuggestion = () => {
    if (editingErrorId && editingSuggestion.trim()) {
      applyCorrection(editingErrorId, editingSuggestion.trim());
    }
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

    // 移除已处理的错误
    setErrors(errors.filter(error => !selectedErrorTypes[error.type]));
  };

  // 渲染带有错误标注的文档内容
  const renderDocumentWithAnnotations = () => {
    if (errors.length === 0) {
      return <div className="whitespace-pre-wrap">{documentContent}</div>;
    }

    // 按位置排序错误
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

      // 添加错误标注
      parts.push(
        <span
          key={error.id}
          className={`cursor-pointer relative ${getErrorStyle(error.type)} px-1.5 py-0.5 rounded-md mx-0.5 inline-block`}
          onClick={(e) => handleErrorClick(e, error.id)}
          title={`${error.category}: ${error.reason}`}
          style={{
            textDecoration: 'none',
            position: 'relative'
          }}
        >
          {error.original}
          {/* 错误类型指示器 */}
          <span 
            className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
              error.type === 'error' ? 'bg-red-500' : 
              error.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
            } opacity-75`}
          ></span>
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

  // 点击外部关闭浮动菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeFloatingMenu();
      }
    };

    if (floatingMenu.show) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [floatingMenu.show]);

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

        {/* 文档内容区 */}
        <div className="flex-1 p-6 bg-white overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div 
              ref={editorRef}
              className="min-h-[600px] p-6 border border-gray-300 rounded-lg bg-white text-gray-900 text-base leading-relaxed"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {renderDocumentWithAnnotations()}
            </div>
          </div>
        </div>
      </div>

      {/* 浮动纠错菜单 */}
      {floatingMenu.show && selectedError && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-2xl w-80 max-w-sm"
          style={{
            left: floatingMenu.x,
            top: floatingMenu.y,
          }}
        >
          <div className="p-4 space-y-4">
            {/* 菜单标题 */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-semibold text-gray-900 text-sm">智能纠错建议</h4>
              <button
                onClick={closeFloatingMenu}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 错误内容 */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {selectedError.category}
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-xs text-red-600 font-medium mb-1">原文内容</div>
                <div className="text-sm text-red-800 font-mono break-words">
                  "{selectedError.original}"
                </div>
              </div>
            </div>

            {/* 建议修改 */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700">建议修改</div>
              {editingErrorId === selectedError.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editingSuggestion}
                    onChange={(e) => setEditingSuggestion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    autoFocus
                    placeholder="输入您的修改建议..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEditedSuggestion}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      保存修改
                    </button>
                    <button
                      onClick={() => setEditingErrorId(null)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition-colors group"
                  onClick={() => startEditingSuggestion(selectedError.id, selectedError.suggestion)}
                >
                  <div className="flex items-start justify-between">
                    <div className="text-sm text-green-800 font-mono break-words flex-1">
                      "{selectedError.suggestion}"
                    </div>
                    <svg className="w-4 h-4 text-green-600 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div className="text-xs text-green-600 mt-1 opacity-75">
                    点击编辑建议
                  </div>
                </div>
              )}
            </div>

            {/* 错误原因 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-xs font-medium text-gray-700 mb-1">错误原因</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                {selectedError.reason}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => applyCorrection(selectedError.id)}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 text-sm font-medium shadow-sm flex items-center justify-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>应用修改</span>
              </button>
              <button
                onClick={() => ignoreError(selectedError.id)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>忽略</span>
              </button>
            </div>
          </div>

          {/* 菜单箭头指示器 */}
          <div 
            className="absolute w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45"
            style={{
              left: '20px',
              top: floatingMenu.y < window.scrollY + 150 ? '-6px' : 'auto',
              bottom: floatingMenu.y < window.scrollY + 150 ? 'auto' : '-6px',
            }}
          ></div>
        </div>
      )}

      {/* 右侧边栏 */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
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

        {/* 纠错记录 */}
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
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredErrors.map((error) => (
                <div
                  key={error.id}
                  className={`p-2 rounded border cursor-pointer transition-all ${
                    selectedError?.id === error.id
                      ? 'ring-2 ring-blue-500'
                      : 'hover:shadow-md'
                  } ${getErrorStyle(error.type)}`}
                  onClick={() => setSelectedError(error)}
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

        {/* 一键纠错 */}
        <div className="p-4 border-t border-gray-200 bg-white">
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
      </div>
    </div>
  );
} 