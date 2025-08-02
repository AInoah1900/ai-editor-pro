'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import QingCiStyleEditor from './QingCiStyleEditor';

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
  knowledge_sources?: {
    private_count: number;
    shared_count: number;
    total_count: number;
  };
  document_sources?: {
    private_documents: any[];
    shared_documents: any[];
  };
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

// 新增：替换后内容的状态接口
interface ReplacedContent {
  id: string;
  position: { start: number; end: number };
  original: string;
  replaced: string;
  timestamp: Date;
}

// 新增：浮动菜单状态接口
interface FloatingMenuState {
  errorId: string | null;
  position: { x: number; y: number };
  isVisible: boolean;
}

export default function RAGEnhancedEditor({ content }: DocumentEditorProps) {
  const [documentContent, setDocumentContent] = useState(content || '');
  
  // 添加调试日志
  console.log('🔍 RAGEnhancedEditor 初始化/重新渲染:', {
    timestamp: new Date().toISOString(),
    propContent: content?.length || 0,
    propContentPreview: content?.substring(0, 100) || 'empty',
    documentContentLength: documentContent?.length || 0,
    documentContentPreview: documentContent?.substring(0, 100) || 'empty',
    isContentEmpty: !content || content.trim().length === 0,
    isDocumentContentEmpty: !documentContent || documentContent.trim().length === 0,
    contentEqualsDocumentContent: content === documentContent
  });
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
  // 统一使用RAG增强版API，移除选择开关

  // 新增状态：替换后内容记录
  const [replacedContents, setReplacedContents] = useState<ReplacedContent[]>([]);
  
  // 新增状态：浮动菜单
  const [floatingMenu, setFloatingMenu] = useState<FloatingMenuState>({
    errorId: null,
    position: { x: 0, y: 0 },
    isVisible: false
  });

  // 新增状态：文档统计信息
  const [documentStats, setDocumentStats] = useState({
    originalLength: 0,
    currentLength: 0,
    charactersProcessed: 0
  });

  // 新增状态：AI分析状态管理
  const [analysisState, setAnalysisState] = useState({
    hasInitialAnalysis: false,  // 是否已完成初始分析
    lastAnalyzedContent: '',    // 上次分析的内容
    isUserOperation: false      // 当前是否为用户操作（替换/编辑/忽略）
  });

  const editorRef = useRef<HTMLDivElement>(null);

  // 新增：数据清理和验证函数
  const cleanAndValidateErrorData = (rawErrors: any[]): ErrorItem[] => {
    console.log('🧹 开始清理和验证错误数据...');
    
    return rawErrors.map((error, index) => {
      // 清理original字段 - 移除HTML标签和多余信息
      let cleanOriginal = error.original || '';
      if (typeof cleanOriginal === 'string') {
        // 移除HTML标签
        cleanOriginal = cleanOriginal.replace(/<[^>]*>/g, '');
        // 移除"已替换:"等提示信息
        cleanOriginal = cleanOriginal.replace(/已替换:\s*[^→]*→\s*/g, '');
        // 移除多余的空格和换行
        cleanOriginal = cleanOriginal.trim();
      }

      // 清理suggestion字段
      let cleanSuggestion = error.suggestion || '';
      if (typeof cleanSuggestion === 'string') {
        cleanSuggestion = cleanSuggestion.replace(/<[^>]*>/g, '').trim();
      }

      // 清理reason字段
      let cleanReason = error.reason || '';
      if (typeof cleanReason === 'string') {
        cleanReason = cleanReason.replace(/<[^>]*>/g, '').trim();
      }

      // 验证position字段
      let validPosition = { start: 0, end: 0 };
      if (error.position && typeof error.position.start === 'number' && typeof error.position.end === 'number') {
        validPosition = {
          start: Math.max(0, error.position.start),
          end: Math.min(documentContent.length, error.position.end)
        };
      } else {
        // 如果没有有效位置，尝试从文档中查找
        if (cleanOriginal && documentContent) {
          const foundIndex = documentContent.indexOf(cleanOriginal);
          if (foundIndex !== -1) {
            validPosition = {
              start: foundIndex,
              end: foundIndex + cleanOriginal.length
            };
          }
        }
      }

      // 验证type字段
      let validType: 'error' | 'warning' | 'suggestion' = 'warning';
      if (error.type && ['error', 'warning', 'suggestion'].includes(error.type)) {
        validType = error.type;
      }

      const cleanedError: ErrorItem = {
        id: error.id || `cleaned_error_${Date.now()}_${index}`,
        type: validType,
        position: validPosition,
        original: cleanOriginal,
        suggestion: cleanSuggestion,
        reason: cleanReason,
        category: error.category || '其他问题'
      };

      console.log(`✅ 清理错误 ${index + 1}:`, {
        original: cleanOriginal,
        position: validPosition,
        type: validType
      });

      return cleanedError;
    });
  };

  // 底部功能栏处理函数
  const handleClearText = () => {
    if (confirm('确定要清空所有文档内容吗？')) {
      setDocumentContent('');
      // 清空时重置分析状态
      setAnalysisState({
        hasInitialAnalysis: false,
        lastAnalyzedContent: '',
        isUserOperation: false
      });
      setErrors([]);
      setRagResults(null);
      setCorrectionRecords([]);
    }
  };

  const handleClearFormat = () => {
    // 清除格式功能暂时简化处理
    alert('清除格式功能已触发');
  };

  const handleImportDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.docx,.doc';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newContent = e.target?.result as string;
          setDocumentContent(newContent);
          // 导入新文档时重置分析状态，标记需要初始分析
          setAnalysisState({
            hasInitialAnalysis: false,
            lastAnalyzedContent: '',
            isUserOperation: false
          });
          setErrors([]);
          setRagResults(null);
          setCorrectionRecords([]);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDownloadDocument = () => {
    const blob = new Blob([documentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // RAG增强的文档分析
  const analyzeDocumentWithRAG = React.useCallback(async () => {
    // 内容检查
    if (!documentContent || documentContent.trim().length === 0) {
      console.warn('文档内容为空，跳过分析');
      return;
    }

    setIsAnalyzing(true);
    try {
      // 统一使用RAG增强版API，提供最佳分析体验
      const endpoint = '/api/analyze-document-rag';
      
      console.log('发送分析请求:', { endpoint, contentLength: documentContent.length });
      
      const requestBody = { content: documentContent, ownerId: 'default_user' }; // 传递用户ID，实际应用中应从认证系统获取
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API请求失败:', response.status, errorText);
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
      console.log('API响应数据:', result);
        
      // API直接返回ragResult对象，不需要包装格式
      if (result && result.errors) {
        const { errors: analysisErrors, ...ragData } = result;
        
        // 使用数据清理函数处理错误数据
        console.log('🔍 原始错误数据:', analysisErrors);
        const cleanedErrors = cleanAndValidateErrorData(analysisErrors || []);
        console.log('✅ 清理后的错误数据:', cleanedErrors);
          
        setErrors(cleanedErrors);
        setRagResults(ragData);
        
        // 更新分析状态
        setAnalysisState(prev => ({
          ...prev,
          hasInitialAnalysis: true,
          lastAnalyzedContent: documentContent
        }));

        console.log(`✅ 分析完成，发现 ${cleanedErrors.length} 个问题`);
        } else {
        console.warn('API返回格式异常:', result);
          setErrors([]);
        setRagResults(null);
      }
    } catch (error) {
      console.error('文档分析失败:', error);
      setErrors([]);
      setRagResults(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [documentContent]);

  // 处理内容变化（来自编辑器的修改）
  const handleEditorContentChange = useCallback((newContent: string) => {
    console.log('📝 编辑器内容变化:', { 
      isUserOperation: analysisState.isUserOperation,
      contentLength: newContent.length,
      currentDocumentLength: documentContent.length
    });

    // 防止重复内容 - 只有当内容真正改变时才更新
    if (newContent !== documentContent) {
      setDocumentContent(newContent);
      
      // 更新文档统计
      setDocumentStats(prev => ({
        ...prev,
        currentLength: newContent.length,
        charactersProcessed: prev.originalLength > 0 ? newContent.length - prev.originalLength : 0
      }));

      // 如果是用户操作（替换/编辑/忽略），不触发自动分析
      if (analysisState.isUserOperation) {
        console.log('🔄 用户操作引起的内容变化，跳过自动分析');
        // 重置用户操作标记
        setAnalysisState(prev => ({
          ...prev,
          isUserOperation: false
        }));
        return;
      }
    }
  }, [analysisState.isUserOperation, documentContent]);

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

              // RAG用户反馈学习（统一使用RAG增强版）
        if (ragResults) {
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
    
    // RAG用户反馈学习（统一使用RAG增强版）
    if (ragResults && error) {
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
        if (ragResults) {
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

  // 新增：显示浮动菜单
  const showFloatingMenu = (errorId: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setFloatingMenu({
      errorId,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10 // 菜单显示在标注上方
      },
      isVisible: true
    });
  };

  // 新增：隐藏浮动菜单
  const hideFloatingMenu = () => {
    setFloatingMenu(prev => ({
      ...prev,
      isVisible: false
    }));
    // 延迟清除，允许点击菜单项
    setTimeout(() => {
      setFloatingMenu(prev => ({
        ...prev,
        errorId: null
      }));
    }, 300);
  };

  // 新增：替换错误内容（带蓝色标注）
  const replaceWithSuggestion = async (errorId: string, customSuggestion?: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    const suggestion = customSuggestion || error.suggestion;
    
    // 记录替换操作
    const replacedContent: ReplacedContent = {
      id: `replaced_${Date.now()}`,
      position: error.position,
      original: error.original,
      replaced: suggestion,
      timestamp: new Date()
    };
    
    setReplacedContents(prev => [...prev, replacedContent]);

    // 更新文档内容
    const newContent = 
      documentContent.slice(0, error.position.start) + 
      suggestion + 
      documentContent.slice(error.position.end);
    
    setDocumentContent(newContent);

    // 记录纠错历史
    const record: CorrectionRecord = {
      id: errorId,
      original: error.original,
      corrected: suggestion,
      timestamp: new Date()
    };
    setCorrectionRecords(prev => [...prev, record]);

    // 移除该错误
    setErrors(prev => prev.filter(e => e.id !== errorId));
    
    // 隐藏浮动菜单
    hideFloatingMenu();

    console.log(`✅ 替换完成: "${error.original}" -> "${suggestion}"`);
  };

  // 新增：验证文档完整性
  const validateDocumentIntegrity = () => {
    const stats = {
      originalLength: content.length,
      currentLength: documentContent.length,
      hasAllContent: documentContent.includes(content.substring(0, Math.min(100, content.length))),
      charactersLost: Math.max(0, content.length - documentContent.length),
      charactersAdded: Math.max(0, documentContent.length - content.length)
    };
    
    console.log('📊 文档完整性检查:', stats);
    return stats;
  };

  // 新增：编辑建议内容
  const editSuggestion = (errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;
    
    const newSuggestion = prompt('请编辑正确提示内容:', error.suggestion);
    if (newSuggestion && newSuggestion !== error.suggestion) {
      // 更新错误的建议内容
      setErrors(prev => prev.map(e => 
        e.id === errorId 
          ? { ...e, suggestion: newSuggestion }
          : e
      ));
      console.log(`✏️ 编辑建议: "${error.suggestion}" -> "${newSuggestion}"`);
    }
    hideFloatingMenu();
  };

  // 新增：显示错误详细原因
  const showErrorDetails = (errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;
    
    alert(`错误详情：\n\n类型：${error.type === 'error' ? '确定错误' : error.type === 'warning' ? '疑似错误' : '优化建议'}\n分类：${error.category}\n原因：${error.reason}\n建议：${error.suggestion}`);
    hideFloatingMenu();
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
    console.log('🎯 开始渲染文档，完整状态:', { 
      timestamp: new Date().toISOString(),
      isAnalyzing, 
      documentLength: documentContent?.length || 0, 
      errorsCount: errors.length,
      hasContent: !!documentContent,
      documentContentPreview: documentContent?.substring(0, 50) || 'empty',
      renderingCondition: {
        isAnalyzing,
        isEmpty: !documentContent || documentContent.trim().length === 0,
        hasErrors: errors && errors.length > 0
      },
      renderingPath: isAnalyzing ? 'ANALYZING' : 
                    (!documentContent || documentContent.trim().length === 0) ? 'EMPTY' :
                    (!errors || errors.length === 0) ? 'NO_ERRORS' : 'HAS_ERRORS'
    });

    // 分析中状态
    if (isAnalyzing) {
      console.log('⏳ 显示分析中状态');
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <div>
                <h3 className="text-blue-800 font-semibold text-lg">🔍 AI正在分析文档...</h3>
                <p className="text-blue-700 text-sm mt-1">
                  ✨ 使用RAG知识库进行深度分析
                </p>
              </div>
            </div>
          </div>
          
          {/* 显示原始文档内容 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-gray-700 font-medium mb-4">📄 文档内容预览</h4>
            
            {/* 添加调试信息 */}
            <div className="mb-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              调试信息: 内容长度 {documentContent?.length || 0} 字符
              {documentContent ? ` | 前50字符: "${documentContent.substring(0, 50)}..."` : ' | 内容为空'}
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed min-h-[100px] border border-dashed border-gray-300 p-4 rounded">
                {documentContent || '⚠️ 文档内容为空'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 检查文档内容
    if (!documentContent || documentContent.trim().length === 0) {
      console.log('❌ 文档内容为空');
      return (
        <div className="text-center py-12 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">暂无文档内容</p>
          <p className="text-sm mt-2">请上传文档或输入文本进行分析</p>
        </div>
      );
    }

    // 无错误的情况
    if (!errors || errors.length === 0) {
      console.log('✅ 无错误，显示完整文档');
      
      return (
        <div className="space-y-6">
          {/* 无错误状态概览 */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-green-800 font-semibold text-lg">✨ 文档质量优秀</h3>
                <p className="text-green-700 text-sm mt-1">
                  ✨ RAG知识库深度分析未发现问题
                </p>
              </div>
            </div>
            
            {/* RAG信息显示 */}
            {ragResults && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex items-center space-x-6 text-sm">
                  {(() => {
                    // 直接计算错误统计，避免函数调用可能的循环依赖
                    const errorCount = errors.filter(e => e.type === 'error').length;
                    const warningCount = errors.filter(e => e.type === 'warning').length;
                    const suggestionCount = errors.filter(e => e.type === 'suggestion').length;
                    
                    return (
                      <>
                        {errorCount > 0 && <span className="text-red-600">❌ 错误: <strong>{errorCount}</strong></span>}
                        {warningCount > 0 && <span className="text-yellow-600">⚠️ 警告: <strong>{warningCount}</strong></span>}
                        {suggestionCount > 0 && <span className="text-green-600">💡 建议: <strong>{suggestionCount}</strong></span>}
                        
                        {/* RAG信息 */}
                        {ragResults && (
                          <>
                            <span className="text-blue-600">🎯 领域: <strong>{ragResults.domain_info?.domain || '通用'}</strong></span>
                            <span className="text-blue-700">RAG置信度: </span>
                            <span className="font-medium text-blue-900">{Math.round((ragResults.domain_info.confidence || 0) * 100)}%</span>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          
          {/* 文档内容 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            
            {/* 添加调试信息 */}
            <div className="mb-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              调试信息: 内容长度 {documentContent?.length || 0} 字符
              {documentContent ? ` | 前50字符: "${documentContent.substring(0, 50)}..."` : ' | 内容为空'}
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-base min-h-[100px] border border-dashed border-gray-300 p-4 rounded" style={{ lineHeight: '1.8' }}>
                {documentContent || '⚠️ 文档内容为空'}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 有错误的情况：重新构建带错误标注的文档内容
    console.log('🔍 有错误，构建带标注的文档内容，错误数量:', errors.length);
    console.log('📄 文档内容长度:', documentContent.length);
    console.log('📄 文档内容:', documentContent);
    
    // 验证文档完整性
    const integrityStats = validateDocumentIntegrity();
    
    // 修复错误位置验证逻辑 - 更宽松的验证
    const validErrors = errors.filter(error => {
      const isValid = error.position && 
                     typeof error.position.start === 'number' && 
                     typeof error.position.end === 'number' &&
                     error.position.start >= 0 && 
                     error.position.start < error.position.end;
      
      // 修复超出文档长度的错误
      if (isValid && error.position.end > documentContent.length) {
        console.warn(`⚠️ 修复错误位置: [${error.position.start}-${error.position.end}] -> [${error.position.start}-${documentContent.length}]`);
        error.position.end = documentContent.length;
        // 同时修复错误的original内容
        error.original = documentContent.slice(error.position.start, error.position.end);
      }
      
      if (!isValid) {
        console.warn('⚠️ 跳过无效错误:', error);
      }
      return isValid;
    });

    console.log(`✅ 有效错误数量: ${validErrors.length}/${errors.length}`);
    
    // 如果没有有效错误，直接显示完整文档
    if (validErrors.length === 0) {
      console.log('⚠️ 没有有效错误，显示完整文档内容');
      return (
        <div className="space-y-6 relative">
          {/* 错误位置异常提示 */}
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-orange-800 font-semibold">⚠️ 错误位置异常</h3>
                <p className="text-orange-700 text-sm">检测到错误但位置信息异常，显示原文内容</p>
              </div>
            </div>
          </div>

          {/* 文档内容 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-base" style={{ lineHeight: '1.8' }}>
                {documentContent}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // 按位置排序并处理重叠错误 - 改进的重叠处理
    const sortedErrors = validErrors
      .sort((a, b) => a.position.start - b.position.start)
      .filter((error, index, arr) => {
        if (index === 0) return true;
        const prevError = arr[index - 1];
        const isOverlapping = error.position.start < prevError.position.end;
        if (isOverlapping) {
          console.warn('⚠️ 跳过重叠错误:', error);
        }
        return !isOverlapping;
      });

    console.log(`🔧 去重后错误数量: ${sortedErrors.length}`);
    
    // 改进的parts数组构建逻辑
    const parts = [];
    let lastIndex = 0;

    console.log(`📍 开始构建parts，文档长度: ${documentContent.length}`);

    // 如果第一个错误不是从0开始，先添加开头的正常文本
    if (sortedErrors.length > 0 && sortedErrors[0].position.start > 0) {
      const initialText = documentContent.slice(0, sortedErrors[0].position.start);
      console.log(`📝 添加开头正常文本 [0-${sortedErrors[0].position.start}]: "${initialText}"`);
      parts.push(
        <span key="text_initial" className="text-gray-900">
          {initialText}
        </span>
      );
      lastIndex = sortedErrors[0].position.start;
    }

    sortedErrors.forEach((error, index) => {
      console.log(`\n处理错误 ${index + 1}/${sortedErrors.length}:`);
      console.log(`  位置: [${error.position.start}-${error.position.end}]`);
      console.log(`  内容: "${error.original}"`);
      console.log(`  当前lastIndex: ${lastIndex}`);

      // 添加错误前的正常文本（如果有间隙）
      if (error.position.start > lastIndex) {
        const normalText = documentContent.slice(lastIndex, error.position.start);
        console.log(`  正常文本 [${lastIndex}-${error.position.start}]: "${normalText}"`);
        
        if (normalText) {
          parts.push(
            <span key={`text_${index}_${lastIndex}`} className="text-gray-900">
              {normalText}
            </span>
          );
          console.log(`  ✅ 添加正常文本到parts`);
        }
      }

      // 添加错误标注 - 优化版本，确保只显示原始错误内容
      parts.push(
        <span key={error.id} className="relative inline-block">
          <span
            className={`relative inline-block px-2 py-1 rounded-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              error.type === 'error' 
                ? 'bg-red-100 text-red-800 border-b-2 border-red-500 hover:bg-red-200' 
                : error.type === 'warning' 
                ? 'bg-yellow-100 text-yellow-800 border-b-2 border-yellow-500 hover:bg-yellow-200' 
                : 'bg-green-100 text-green-800 border-b-2 border-green-500 hover:bg-green-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              showFloatingMenu(error.id, e);
            }}
            title={`${error.category}: ${error.reason} (点击查看菜单)`}
          >
            <span className="relative">
              {/* 确保只显示原始错误内容，不包含任何HTML标签或提示信息 */}
              {error.original}
              {/* 错误类型指示器 */}
              <span className={`absolute -top-2 -right-2 w-3 h-3 rounded-full border-2 border-white ${
                error.type === 'error' ? 'bg-red-500' : 
                error.type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
              } shadow-sm`}></span>
            </span>
          </span>
        </span>
      );

      lastIndex = error.position.end;
      console.log(`  更新lastIndex: ${lastIndex}`);
    });

    // 添加替换后的内容（蓝色标注）- 优化版本
    replacedContents.forEach((replaced, index) => {
      parts.push(
        <span key={`replaced_${replaced.id}`} className="relative inline-block">
          <span
            className="inline-block px-2 py-1 rounded-md bg-blue-100 text-blue-800 border-b-2 border-blue-500 cursor-help"
            title={`已替换: "${replaced.original}" → "${replaced.replaced}"`}
          >
            <span className="relative">
              {/* 确保只显示替换后的内容，不包含任何HTML标签 */}
              {replaced.replaced}
              {/* 替换成功指示器 */}
              <span className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm">
                <svg className="w-2 h-2 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </span>
          </span>
        </span>
      );
    });

    // 确保添加最后的正常文本
    console.log(`\n处理最后的正常文本:`);
    console.log(`  最终lastIndex: ${lastIndex}, 文档长度: ${documentContent.length}`);
    
    if (lastIndex < documentContent.length) {
      const finalText = documentContent.slice(lastIndex);
      console.log(`  最后文本 [${lastIndex}-${documentContent.length}]: "${finalText}"`);
      
      if (finalText) {
        parts.push(
          <span key="text_final" className="text-gray-900">
            {finalText}
          </span>
        );
        console.log(`  ✅ 添加最后文本到parts`);
      }
    }

    console.log(`🎯 最终Parts数组长度: ${parts.length}`);

    // 特殊情况：如果错误覆盖了整个或大部分文档，确保显示完整内容
    const hasFullDocumentError = sortedErrors.some(error => 
      error.position.start === 0 && error.position.end >= documentContent.length * 0.9
    );

    // 添加fallback逻辑：如果parts数组为空或内容不完整，显示原始文档
    const shouldShowFallback = parts.length === 0 || 
      (parts.length === 1 && sortedErrors.length > 0) ||
      hasFullDocumentError;

    if (shouldShowFallback) {
      console.log('🔄 使用fallback显示完整文档内容');
      return (
        <div className="space-y-6 relative">
          {/* 分析结果概览 */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-orange-800 font-semibold text-lg">📋 分析完成</h3>
                <p className="text-orange-700 text-sm mt-1">
                  {`✨ 基于RAG知识库分析，发现 ${sortedErrors.length} 个问题`}
                  {replacedContents.length > 0 && (
                    <span className="ml-2 text-blue-700">
                      · 已替换 <strong>{replacedContents.length}</strong> 处
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* 错误统计和RAG信息 */}
            <div className="mt-3 pt-3 border-t border-orange-200">
              <div className="flex items-center space-x-6 text-sm">
                {(() => {
                  // 直接计算错误统计，避免函数调用可能的循环依赖
                  const errorCount = errors.filter(e => e.type === 'error').length;
                  const warningCount = errors.filter(e => e.type === 'warning').length;
                  const suggestionCount = errors.filter(e => e.type === 'suggestion').length;
                  
                  return (
                    <>
                      {errorCount > 0 && <span className="text-red-600">❌ 错误: <strong>{errorCount}</strong></span>}
                      {warningCount > 0 && <span className="text-yellow-600">⚠️ 警告: <strong>{warningCount}</strong></span>}
                      {suggestionCount > 0 && <span className="text-green-600">💡 建议: <strong>{suggestionCount}</strong></span>}
                      
                      {/* RAG信息 */}
                      {ragResults && (
                        <>
                          <span className="text-blue-600">🎯 领域: <strong>{ragResults.domain_info?.domain || '通用'}</strong></span>
                          <span className="text-blue-700">RAG置信度: </span>
                          <span className="font-medium text-blue-900">{Math.round((ragResults.domain_info.confidence || 0) * 100)}%</span>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 文档内容（含标注） - Fallback版本 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-4 pb-3 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                文档内容（含标注）
              </h4>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                <span>字符数: <strong>{documentContent.length}</strong></span>
                {errors.length > 0 && (
                  <span>问题数: <strong className="text-red-600">{errors.length}</strong></span>
                )}
                {replacedContents.length > 0 && (
                  <span>已替换: <strong className="text-blue-600">{replacedContents.length}</strong></span>
                )}
                <span className="text-orange-600">显示模式: <strong>完整文档</strong></span>
              </div>
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-base" style={{ lineHeight: '1.8' }}>
                {documentContent}
              </div>
            </div>
            
            {/* 错误列表提示 */}
            {sortedErrors.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                      <h5 className="text-yellow-800 font-medium">检测到 {sortedErrors.length} 个问题</h5>
                      <p className="text-yellow-700 text-sm mt-1">
                        由于标注复杂度，当前显示完整文档。请查看右侧边栏查看具体错误详情。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 正常情况：显示带有标注的文档内容
    return (
      <div className="space-y-6 relative">
        {/* 分析结果概览 - 有错误状态 */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-orange-800 font-semibold text-lg">📋 分析完成</h3>
              <p className="text-orange-700 text-sm mt-1">
                {`✨ 基于RAG知识库分析，发现 ${sortedErrors.length} 个问题`}
                {replacedContents.length > 0 && (
                  <span className="ml-2 text-blue-700">
                    · 已替换 <strong>{replacedContents.length}</strong> 处
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* 错误统计和RAG信息 */}
          <div className="mt-3 pt-3 border-t border-orange-200">
            <div className="flex items-center space-x-6 text-sm">
              {(() => {
                // 直接计算错误统计，避免函数调用可能的循环依赖
                const errorCount = errors.filter(e => e.type === 'error').length;
                const warningCount = errors.filter(e => e.type === 'warning').length;
                const suggestionCount = errors.filter(e => e.type === 'suggestion').length;
                
                return (
                  <>
                    {errorCount > 0 && <span className="text-red-600">❌ 错误: <strong>{errorCount}</strong></span>}
                    {warningCount > 0 && <span className="text-yellow-600">⚠️ 警告: <strong>{warningCount}</strong></span>}
                    {suggestionCount > 0 && <span className="text-green-600">💡 建议: <strong>{suggestionCount}</strong></span>}
                    
                    {/* RAG信息 */}
                    {ragResults && (
                      <>
                        <span className="text-blue-600">🎯 领域: <strong>{ragResults.domain_info?.domain || '通用'}</strong></span>
                        <span className="text-blue-700">RAG置信度: </span>
                        <span className="font-medium text-blue-900">{Math.round((ragResults.domain_info.confidence || 0) * 100)}%</span>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* 文档内容（含标注） */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-base" style={{ lineHeight: '1.8' }}>
              {parts}
            </div>
          </div>
        </div>
      </div>
    );
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

  // 移除可能冲突的useEffect，逻辑合并到下面的useEffect中

  // 监听外部content prop变化（初始导入）
  useEffect(() => {
    console.log('📥 Content prop changed:', { 
      contentLength: content?.length || 0, 
      hasContent: !!content,
      currentDocumentContentLength: documentContent?.length || 0,
      hasInitialAnalysis: analysisState.hasInitialAnalysis,
      contentPreview: content?.substring(0, 50) || 'empty'
    });
    
    if (content && content.trim().length > 0) {
      // 🔑 关键修复：始终确保documentContent与content prop同步
      console.log('🔄 强制同步文档内容:', {
        fromLength: documentContent?.length || 0,
        toLength: content.length,
        contentChanged: documentContent !== content
      });
      setDocumentContent(content);
      
      // 检查是否为新内容
      const isNewContent = content !== analysisState.lastAnalyzedContent;
      
      if (isNewContent) {
        console.log('🆕 检测到新文档内容，准备进行初始分析');
        
        // 清除之前的错误和分析结果
        setErrors([]);
        setRagResults(null);
        setCorrectionRecords([]);
        
        // 重置分析状态
        setAnalysisState({
          hasInitialAnalysis: false,
          lastAnalyzedContent: '',
          isUserOperation: false
        });

        // 更新原始文档统计
        setDocumentStats(prev => ({
          ...prev,
          originalLength: content.length,
          currentLength: content.length,
          charactersProcessed: 0
        }));
      
      // 延迟1秒后自动分析，避免频繁调用
      const timer = setTimeout(() => {
          console.log('🚀 开始自动分析新文档');
        performAutoAnalysis();
      }, 1000);
      
      return () => {
        clearTimeout(timer);
      };
      } else {
        console.log('📄 内容未变化，跳过重复分析');
      }
    } else {
      // 如果content为空，清空所有状态
      setDocumentContent('');
      setErrors([]);
      setRagResults(null);
      setCorrectionRecords([]);
      setAnalysisState({
        hasInitialAnalysis: false,
        lastAnalyzedContent: '',
        isUserOperation: false
      });
    }
  }, [content]); // 简化依赖项，避免循环依赖

  // 监听documentContent变化，用于调试
  useEffect(() => {
    console.log('DocumentContent state updated:', {
      length: documentContent?.length || 0,
      preview: documentContent?.substring(0, 100) || 'empty',
      hasInitialAnalysis: analysisState.hasInitialAnalysis,
      isUserOperation: analysisState.isUserOperation
    });
  }, [documentContent, analysisState]);

  // 更新文档统计
  useEffect(() => {
    if (documentContent) {
      setDocumentStats(prev => ({
        ...prev,
        originalLength: content.length,
        currentLength: documentContent.length,
        charactersProcessed: documentContent.length
      }));
    }
  }, [documentContent, content]);

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
            <h3 className="text-lg font-semibold text-gray-900">AI编辑器</h3>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isAnalyzing ? 'AI分析中...' : 'AI分析完成'}
              </span>
            </div>
            
            {/* 统一使用RAG增强版，移除选择开关 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600 font-medium">RAG增强分析</span>
              {/* <span className="text-xs text-gray-500">(已启用)</span> */}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  console.log('🔍 用户手动触发AI分析');
                  // 重置分析状态，允许重新分析
                  setAnalysisState(prev => ({
                    ...prev,
                    hasInitialAnalysis: false,
                    isUserOperation: false
                  }));
                  await analyzeDocumentWithRAG();
                } catch (error) {
                  console.error('手动分析失败:', error);
                  setErrors([]);
                }
              }}
              disabled={isAnalyzing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? '分析中...' : 'AI分析'}
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
        {ragResults && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 p-3">
            <div className="flex items-start space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="font-medium text-blue-800">RAG智能分析</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <div>
                    <span className="text-blue-700">检测领域: </span>
                    <span className="font-medium text-blue-900">{ragResults.domain_info.domain}</span>
                  </div>
                  
                  <div>
                    <span className="text-blue-700">RAG置信度: </span>
                    <span className="font-medium text-blue-900">{Math.round((ragResults.domain_info.confidence || 0) * 100)}%</span>
                  </div>
                  
                  {ragResults.fallback_used && (
                    <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      本地分析
                    </div>
                  )}
                </div>
                
                {/* 多知识库统计信息 */}
                {ragResults.knowledge_sources && (
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-purple-700 text-xs">专属知识库: </span>
                      <span className="font-medium text-purple-900 text-xs">{ragResults.knowledge_sources.private_count || 0}条</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span className="text-green-700 text-xs">共享知识库: </span>
                      <span className="font-medium text-green-900 text-xs">{ragResults.knowledge_sources.shared_count || 0}条</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="text-blue-700 text-xs">总计应用: </span>
                      <span className="font-medium text-blue-900 text-xs">{ragResults.knowledge_sources.total_count || (ragResults.knowledge_used?.length || 0)}条</span>
                    </div>
                  </div>
                )}
                
                {/* 文档来源统计 */}
                {ragResults.document_sources && (ragResults.document_sources.private_documents?.length > 0 || ragResults.document_sources.shared_documents?.length > 0) && (
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center space-x-2">
                      <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-purple-700 text-xs">专属文档: </span>
                      <span className="font-medium text-purple-900 text-xs">{ragResults.document_sources.private_documents?.length || 0}个</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-green-700 text-xs">共享文档: </span>
                      <span className="font-medium text-green-900 text-xs">{ragResults.document_sources.shared_documents?.length || 0}个</span>
                    </div>
                  </div>
                )}
                
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
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          {/* 第一行：主要说明和文档统计 */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-2 text-sm text-blue-800 flex-1 pr-4">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium mb-1">使用说明:</div>
                <div className="text-xs leading-relaxed">
                  'RAG增强模式已启用，基于专业知识库提供更精确的纠错建议'
                  <br />点击彩色标注查看建议 → 浮动菜单操作 → 一键替换或编辑
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-700 mb-1">文档统计</div>
              <div className="flex flex-col space-y-1 text-xs text-blue-700">
                <span>原文: <strong>{content.length}</strong> 字符</span>
                <span>当前: <strong>{documentContent.length}</strong> 字符</span>
              </div>
            </div>
          </div>
          
          {/* 第二行：标注说明 */}
          <div className="flex items-center space-x-6 text-xs text-blue-700">
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
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border-l-2 border-blue-500 rounded"></div>
              <span>已替换内容</span>
            </div>
          </div>
        </div>

        {/* 底部功能栏 */}
        <div className="border-t border-gray-200 bg-gray-50 p-4" data-testid="bottom-toolbar">
          <div className="flex items-center justify-between">
            {/* 左侧功能按钮 */}
            <div className="flex items-center space-x-3">
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                title="加入词库"
              >
                加入词库
              </button>
              
              <button 
                onClick={() => handleClearText()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                title="清空文本"
              >
                清空文本
              </button>
              
              <button 
                onClick={() => handleClearFormat()}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                title="清除格式"
              >
                清除格式
              </button>
              
              <button 
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                title="链接校对"
              >
                链接校对
              </button>
              
              <button 
                onClick={() => handleImportDocument()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                title="导入文档"
              >
                导入
              </button>
              
              <button 
                onClick={() => handleDownloadDocument()}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
                title="下载文档"
              >
                下载
              </button>
            </div>

            {/* 右侧统计信息 */}
            <div className="text-sm text-gray-600">
              <span>共 {documentContent.length} 字</span>
            </div>
          </div>
        </div>

        {/* 清辞编校风格文档编辑区 */}
        <div className="flex-1 bg-white overflow-hidden">
          <QingCiStyleEditor
            content={documentContent}
            errors={errors}
            onContentChange={handleEditorContentChange}
            onUserOperation={() => {
              // 标记即将进行用户操作
              setAnalysisState(prev => ({
                ...prev,
                isUserOperation: true
              }));
            }}
            onAddCorrectionRecord={(record) => {
              // 添加纠错记录
              setCorrectionRecords(prev => [...prev, record]);
            }}
            onScrollToError={(errorId) => {
              // 滚动到错误位置
              const errorElement = document.querySelector(`[data-error-id="${errorId}"]`);
              if (errorElement) {
                errorElement.scrollIntoView({ 
                  behavior: 'smooth', 
                  block: 'center' 
                });
                // 高亮显示
                errorElement.classList.add('highlight-error');
                setTimeout(() => {
                  errorElement.classList.remove('highlight-error');
                }, 2000);
              }
            }}
          />
        </div>
      </div>

      {/* 右侧边栏 */}
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
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
        {ragResults && ragResults.knowledge_used.length > 0 && (
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
                  onClick={() => {
                    // 滚动到错误位置
                    const errorElement = document.querySelector(`[data-error-id="${error.id}"]`);
                    if (errorElement) {
                      errorElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                      });
                      // 高亮显示
                      errorElement.classList.add('highlight-error');
                      setTimeout(() => {
                        errorElement.classList.remove('highlight-error');
                      }, 2000);
                    }
                  }}
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

      {/* 浮动纠错菜单 */}
      {floatingMenu.isVisible && floatingMenu.errorId && (
        <div
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl py-2 min-w-48"
          style={{
            left: floatingMenu.position.x - 96, // 居中显示
            top: floatingMenu.position.y - 10,
            transform: 'translateY(-100%)'
          }}
          onMouseLeave={hideFloatingMenu}
        >
          {/* 菜单箭头 */}
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
            style={{ 
              width: 0, 
              height: 0, 
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white'
            }}
          ></div>
          
          {/* 菜单项 */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="text-xs text-gray-500 font-medium">纠错菜单</div>
          </div>
          
          <button
            onClick={() => editSuggestion(floatingMenu.errorId!)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>编辑正确提示内容</span>
          </button>
          
          <button
            onClick={() => replaceWithSuggestion(floatingMenu.errorId!)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 hover:text-green-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span>替换</span>
          </button>
          
          <button
            onClick={() => ignoreError(floatingMenu.errorId!)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 hover:text-yellow-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6.121-6.121A3 3 0 1015.121 9.879m0 0L21 3m-6.121 6.121L12 12" />
            </svg>
            <span>忽略</span>
          </button>
          
          <button
            onClick={() => showErrorDetails(floatingMenu.errorId!)}
            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 hover:text-gray-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>显示错误原因</span>
          </button>
        </div>
      )}
    </div>
  );
} 