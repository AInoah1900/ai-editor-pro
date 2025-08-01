'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface QingCiStyleEditorProps {
  content: string;
  errors?: ErrorItem[];
  onContentChange: (content: string) => void;
  onUserOperation?: () => void;
  onAddCorrectionRecord?: (record: CorrectionRecord) => void;
  onScrollToError?: (errorId: string) => void;
  onClearText?: () => void;
  onClearFormat?: () => void;
  onImportDocument?: () => void;
  onDownloadDocument?: () => void;
  documentStats?: {
    originalLength: number;
    currentLength: number;
    charactersProcessed: number;
  };
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

// 新增：弹窗状态接口
interface ErrorPopupState {
  errorId: string | null;
  position: { x: number; y: number };
  isVisible: boolean;
  error: ErrorItem | null;
}

// 新增：处理后内容状态接口
interface ProcessedContent {
  id: string;
  position: { start: number; end: number };
  original: string;
  processed: string;
  action: 'replaced' | 'edited' | 'ignored';
  timestamp: Date;
}

interface CorrectionRecord {
  id: string;
  original: string;
  corrected: string;
  timestamp: Date;
}

export default function QingCiStyleEditor({ 
  content, 
  errors = [], 
  onContentChange,
  onUserOperation,
  onAddCorrectionRecord,
  onScrollToError,
  onClearText,
  onClearFormat,
  onImportDocument,
  onDownloadDocument,
  documentStats
}: QingCiStyleEditorProps) {
  const [documentContent, setDocumentContent] = useState(content);
  
  // 添加调试日志
  console.log('🔍 QingCiStyleEditor 初始化/重新渲染:', {
    timestamp: new Date().toISOString(),
    propContent: content?.length || 0,
    propContentPreview: content?.substring(0, 100) || 'empty',
    documentContentLength: documentContent?.length || 0,
    documentContentPreview: documentContent?.substring(0, 100) || 'empty',
    errorsCount: errors.length
  });
  const [formatState, setFormatState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    fontSize: '14px',
    fontFamily: 'Arial',
    alignment: 'left'
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  
  // 新增状态：错误弹窗
  const [errorPopup, setErrorPopup] = useState<ErrorPopupState>({
    errorId: null,
    position: { x: 0, y: 0 },
    isVisible: false,
    error: null
  });

  // 新增状态：处理后内容记录
  const [processedContents, setProcessedContents] = useState<ProcessedContent[]>([]);

  // 新增状态：编辑模式
  const [editingError, setEditingError] = useState<{
    errorId: string;
    content: string;
  } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const bgColorPickerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // 同步内容变化
  useEffect(() => {
    console.log('🔍 QingCiStyleEditor useEffect 触发:', {
      timestamp: new Date().toISOString(),
      propContent: content?.length || 0,
      documentContent: documentContent?.length || 0,
      contentChanged: content !== documentContent,
      hasEditorRef: !!editorRef.current
    });
    
    if (content !== documentContent) {
      setDocumentContent(content);
    }
  }, [content]);
  
  // 单独的useEffect处理内容渲染，确保documentContent已更新
  useEffect(() => {
    if (editorRef.current && documentContent) {
      console.log('🎯 QingCiStyleEditor 渲染内容:', {
        timestamp: new Date().toISOString(),
        documentContentLength: documentContent.length,
        documentContentPreview: documentContent.substring(0, 100),
        errorsCount: errors.length
      });
      
      const renderedContent = renderDocumentWithAnnotations();
      console.log('🎯 设置编辑器innerHTML:', {
        renderedContentLength: renderedContent.length,
        renderedContentPreview: renderedContent.substring(0, 100)
      });
      editorRef.current.innerHTML = renderedContent;
    }
  }, [documentContent, errors]);

  // 处理内容变化
  const handleContentChange = useCallback((newContent: string) => {
    console.log('🔍 QingCiStyleEditor handleContentChange:', {
      timestamp: new Date().toISOString(),
      newContentLength: newContent.length,
      newContentPreview: newContent.substring(0, 100)
    });
    
    // 保留HTML格式，不要移除标签
    // 只在必要时提取纯文本（比如传递给父组件时）
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // 更新本地状态时保留HTML格式
    setDocumentContent(plainText);
    
    // 传递给父组件时使用纯文本
    onContentChange(plainText);
    
    // 标记用户操作
    if (onUserOperation) {
      onUserOperation();
    }
  }, [onContentChange, onUserOperation]);

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setSelectedText(selection.toString());
    }
  };

  // 应用格式
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    
    // 更新格式状态
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const element = range.commonAncestorContainer.parentElement;
        
        if (element) {
          setFormatState(prev => ({
            ...prev,
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikethrough: document.queryCommandState('strikeThrough')
          }));
        }
      }
    }, 10);
  };

  // 文本转HTML（保持换行）
  const convertTextToHTML = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\n/g, '<br>');
  };

  // 新增：显示错误弹窗
  const showErrorPopup = useCallback((errorId: string, event: React.MouseEvent) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setErrorPopup({
      errorId,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      },
      isVisible: true,
      error
    });
  }, [errors]);

  // 新增：隐藏错误弹窗
  const hideErrorPopup = useCallback(() => {
    setErrorPopup({
      errorId: null,
      position: { x: 0, y: 0 },
      isVisible: false,
      error: null
    });
    setEditingError(null);
  }, []);

  // 设置全局错误点击处理函数
  useEffect(() => {
    (window as any).handleErrorClick = (errorId: string, event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      console.log('🎯 错误点击:', { errorId });
      
      const error = errors.find(e => e.id === errorId);
      if (error && event.target) {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        showErrorPopup(errorId, {
          target: event.target,
          clientX: rect.left + rect.width / 2,
          clientY: rect.top
        } as any);
      }
    };
    
    return () => {
      delete (window as any).handleErrorClick;
    };
  }, [errors, showErrorPopup]);

  // 错误操作：替换
  const replaceError = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    console.log('🔄 替换错误:', { errorId, original: error.original, suggestion: error.suggestion });

    // 更新文档内容
    const newContent = documentContent.replace(error.original, error.suggestion);
    setDocumentContent(newContent);
    onContentChange(newContent);

    // 添加纠错记录
    if (onAddCorrectionRecord) {
      onAddCorrectionRecord({
        id: errorId,
        type: 'replace',
        original: error.original,
        corrected: error.suggestion,
        timestamp: new Date()
      });
    }

    // 标记为已处理
    setProcessedContents(prev => [...prev, {
      id: errorId,
      original: error.original,
      processed: error.suggestion,
      action: 'replaced',
      position: error.position
    }]);

    hideErrorPopup();
  }, [errors, documentContent, onContentChange, onAddCorrectionRecord, hideErrorPopup]);

  // 错误操作：编辑
  const editError = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    console.log('✏️ 编辑错误:', { errorId });
    
    setEditingError({
      errorId,
      content: error.suggestion
    });
  }, [errors]);

  // 错误操作：忽略
  const ignoreError = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    console.log('🚫 忽略错误:', { errorId });

    // 添加纠错记录
    if (onAddCorrectionRecord) {
      onAddCorrectionRecord({
        id: errorId,
        type: 'ignore',
        original: error.original,
        corrected: error.original,
        timestamp: new Date()
      });
    }

    // 标记为已处理
    setProcessedContents(prev => [...prev, {
      id: errorId,
      original: error.original,
      processed: error.original,
      action: 'ignored',
      position: error.position
    }]);

    hideErrorPopup();
  }, [errors, onAddCorrectionRecord, hideErrorPopup]);

  // 确认编辑
  const confirmEdit = useCallback(() => {
    if (!editingError) return;

    const error = errors.find(e => e.id === editingError.errorId);
    if (!error) return;

    console.log('✅ 确认编辑:', { errorId: editingError.errorId, newContent: editingError.content });

    // 更新文档内容
    const newContent = documentContent.replace(error.original, editingError.content);
    setDocumentContent(newContent);
    onContentChange(newContent);

    // 添加纠错记录
    if (onAddCorrectionRecord) {
      onAddCorrectionRecord({
        id: editingError.errorId,
        type: 'edit',
        original: error.original,
        corrected: editingError.content,
        timestamp: new Date()
      });
    }

    // 标记为已处理
    setProcessedContents(prev => [...prev, {
      id: editingError.errorId,
      original: error.original,
      processed: editingError.content,
      action: 'edited',
      position: error.position
    }]);

    setEditingError(null);
    hideErrorPopup();
  }, [editingError, errors, documentContent, onContentChange, onAddCorrectionRecord, hideErrorPopup]);

  // 新增：替换功能
  const handleReplace = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    // 标记用户操作
    onUserOperation?.();

    const newContent = documentContent.substring(0, error.position.start) +
                      error.suggestion +
                      documentContent.substring(error.position.end);
    
    // 记录处理后的内容
    const processedContent: ProcessedContent = {
      id: errorId,
      position: error.position,
      original: error.original,
      processed: error.suggestion,
      action: 'replaced',
      timestamp: new Date()
    };

    // 添加纠错记录
    const correctionRecord: CorrectionRecord = {
      id: `correction_${Date.now()}`,
      original: error.original,
      corrected: error.suggestion,
      timestamp: new Date()
    };
    onAddCorrectionRecord?.(correctionRecord);

    setProcessedContents(prev => [...prev, processedContent]);
    handleContentChange(newContent);
    hideErrorPopup();
  }, [documentContent, errors, handleContentChange, hideErrorPopup, onUserOperation, onAddCorrectionRecord]);

  // 新增：编辑功能
  const handleEdit = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    setEditingError({
      errorId,
      content: error.original
    });
  }, [errors]);

  // 新增：保存编辑
  const handleSaveEdit = useCallback(() => {
    if (!editingError) return;

    const error = errors.find(e => e.id === editingError.errorId);
    if (!error) return;

    // 标记用户操作
    onUserOperation?.();

    const newContent = documentContent.substring(0, error.position.start) +
                      editingError.content +
                      documentContent.substring(error.position.end);
    
    // 记录处理后的内容
    const processedContent: ProcessedContent = {
      id: editingError.errorId,
      position: error.position,
      original: error.original,
      processed: editingError.content,
      action: 'edited',
      timestamp: new Date()
    };

    // 添加纠错记录
    const correctionRecord: CorrectionRecord = {
      id: `correction_${Date.now()}`,
      original: error.original,
      corrected: editingError.content,
      timestamp: new Date()
    };
    onAddCorrectionRecord?.(correctionRecord);

    setProcessedContents(prev => [...prev, processedContent]);
    handleContentChange(newContent);
    hideErrorPopup();
    setEditingError(null);
  }, [editingError, errors, documentContent, handleContentChange, hideErrorPopup, onUserOperation, onAddCorrectionRecord]);

  // 新增：忽略功能
  const handleIgnore = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    // 标记用户操作
    onUserOperation?.();

    // 记录处理后的内容
    const processedContent: ProcessedContent = {
      id: errorId,
      position: error.position,
      original: error.original,
      processed: error.original,
      action: 'ignored',
      timestamp: new Date()
    };

    // 添加纠错记录（忽略操作）
    const correctionRecord: CorrectionRecord = {
      id: `correction_${Date.now()}`,
      original: error.original,
      corrected: error.original, // 忽略时保持原内容
      timestamp: new Date()
    };
    onAddCorrectionRecord?.(correctionRecord);

    setProcessedContents(prev => [...prev, processedContent]);
    hideErrorPopup();
  }, [errors, hideErrorPopup, onUserOperation, onAddCorrectionRecord]);

  // 检查内容是否已被处理
  const isContentProcessed = useCallback((errorId: string) => {
    return processedContents.some(pc => pc.id === errorId);
  }, [processedContents]);

  // 获取处理后的内容
  const getProcessedContent = useCallback((errorId: string) => {
    return processedContents.find(pc => pc.id === errorId);
  }, [processedContents]);

  // 渲染带错误标注的文档内容
  const renderDocumentWithAnnotations = () => {
    console.log('🎯 QingCiStyleEditor renderDocumentWithAnnotations 调用:', {
      timestamp: new Date().toISOString(),
      documentContentLength: documentContent?.length || 0,
      documentContentPreview: documentContent?.substring(0, 100) || 'empty',
      errorsCount: errors.length,
      willReturnEmpty: !documentContent
    });
    
    if (!documentContent) return '';
    
    // 首先将整个文档转换为HTML格式
    let htmlContent = convertTextToHTML(documentContent);
    
    if (errors.length === 0) {
      return htmlContent;
    }

    // 过滤掉已处理的错误
    const activeErrors = errors.filter(error => !isContentProcessed(error.id));
    
    if (activeErrors.length === 0) {
      // 如果所有错误都已处理，添加处理后的标记
      let result = documentContent;
      const sortedProcessed = [...processedContents].sort((a, b) => b.position.start - a.position.start);
      
      sortedProcessed.forEach((processed) => {
        const beforeText = result.substring(0, processed.position.start);
        const afterText = result.substring(processed.position.end);
        
        // 根据处理动作选择颜色
        const colorClass = processed.action === 'replaced' ? 'text-red-600' :
                          processed.action === 'edited' ? 'text-yellow-600' :
                          'text-green-600';
        
        const processedText = `<span class="${colorClass} font-medium" title="已${processed.action === 'replaced' ? '替换' : processed.action === 'edited' ? '编辑' : '忽略'}: ${processed.original} → ${processed.processed}">${processed.processed}</span>`;
        
        result = beforeText + processedText + afterText;
      });
      
      return convertTextToHTML(result);
    }
    
    // 按位置排序错误
    const sortedErrors = [...activeErrors].sort((a, b) => a.position.start - b.position.start);
    
    let result = '';
    let lastIndex = 0;

    sortedErrors.forEach((error) => {
      // 添加错误前的正常文本
      const beforeText = documentContent.slice(lastIndex, error.position.start);
      result += convertTextToHTML(beforeText);
      
      // 添加带标注的错误文本 - 使用精确的下划线样式
      const underlineClass = error.type === 'error' ? 'error-underline' : 
                            error.type === 'warning' ? 'warning-underline' : 
                            'suggestion-underline';
      
      const errorText = convertTextToHTML(error.original);
      result += `<span class="${underlineClass}" data-error-id="${error.id}" style="cursor: pointer; position: relative;" onclick="window.handleErrorClick && window.handleErrorClick('${error.id}', event)">${errorText}</span>`;
      
      lastIndex = error.position.end;
    });
    
    // 添加最后的正常文本
    const afterText = documentContent.slice(lastIndex);
    result += convertTextToHTML(afterText);
    
    return result;
  };

  // 处理编辑器鼠标悬停事件
  const handleEditorMouseOver = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const errorSpan = target.closest('[data-error-id]');
    
    if (errorSpan) {
      const errorId = errorSpan.getAttribute('data-error-id');
      if (errorId && errorId !== errorPopup.errorId) {
        showErrorPopup(errorId, event);
      }
    }
  }, [showErrorPopup, errorPopup.errorId]);

  // 处理编辑器鼠标离开事件
  const handleEditorMouseLeave = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const errorSpan = target.closest('[data-error-id]');
    
    if (!errorSpan) {
      // 延迟隐藏，给用户时间移动到弹窗
      setTimeout(() => {
        if (!popupRef.current?.matches(':hover')) {
          hideErrorPopup();
        }
      }, 100);
    }
  }, [hideErrorPopup]);

  // 处理弹窗鼠标事件
  const handlePopupMouseEnter = useCallback(() => {
    // 鼠标进入弹窗时，确保弹窗保持显示
  }, []);

  const handlePopupMouseLeave = useCallback(() => {
    // 鼠标离开弹窗时，延迟隐藏
    setTimeout(() => {
      const editor = editorRef.current;
      const hoveredElement = document.querySelector(':hover');
      
      // 如果鼠标不在错误标记上，则隐藏弹窗
      if (!hoveredElement?.closest('[data-error-id]')) {
        hideErrorPopup();
      }
    }, 100);
  }, [hideErrorPopup]);

  // 颜色选择器
  const ColorPicker = ({ 
    colors, 
    onSelect, 
    isVisible, 
    onClose 
  }: { 
    colors: string[]; 
    onSelect: (color: string) => void; 
    isVisible: boolean; 
    onClose: () => void; 
  }) => {
    if (!isVisible) return null;

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10 grid grid-cols-6 gap-1">
        {colors.map((color) => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
            onClick={() => {
              onSelect(color);
              onClose();
            }}
            />
          ))}
      </div>
    );
  };

  const commonColors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF', '#FF0000', '#00FF00',
    '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#800000', '#008000', '#000080', '#808000',
    '#800080', '#008080', '#FFA500', '#FFC0CB', '#A52A2A', '#808080', '#ADD8E6', '#90EE90'
  ];

  return (
    <div className="h-full flex flex-col bg-white" data-testid="qingci-style-editor">
      <style jsx global>{`
        .error-underline {
          border-bottom: 2px solid #ef4444 !important;
          text-decoration: none !important;
        }
        .warning-underline {
          border-bottom: 2px solid #f59e0b !important;
          text-decoration: none !important;
        }
        .suggestion-underline {
          border-bottom: 2px solid #10b981 !important;
          text-decoration: none !important;
        }
        .error-underline:hover,
        .warning-underline:hover,
        .suggestion-underline:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
        }
        .highlight-error {
          background-color: #fef3c7 !important;
          box-shadow: 0 0 0 2px #f59e0b !important;
          transition: all 0.3s ease !important;
        }
      `}</style>

      {/* 清辞编校风格工具栏 */}
      <div className="border-b border-gray-200 bg-gray-50 p-3" data-testid="qingci-toolbar">
        <div className="flex items-center space-x-4 flex-wrap">
          {/* 段落样式下拉 */}
          <div className="relative">
            <select 
              className="px-3 py-1 border border-gray-300 rounded text-sm bg-white min-w-[80px]"
              onChange={(e) => applyFormat('fontName', e.target.value)}
              value={formatState.fontFamily}
              title="字体"
            >
              <option value="Arial">宋体</option>
              <option value="SimHei">黑体</option>
              <option value="KaiTi">楷体</option>
              <option value="FangSong">仿宋</option>
              <option value="Microsoft YaHei">微软雅黑</option>
            </select>
          </div>

          <div className="w-px h-6 bg-gray-300"></div>

          {/* 格式按钮组 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => applyFormat('bold')}
              className={`w-8 h-8 flex items-center justify-center rounded border font-bold text-sm ${
                formatState.bold ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
              } hover:bg-gray-100`}
              title="粗体 (Ctrl+B)"
            >
              B
            </button>
            
            <button
              onClick={() => applyFormat('italic')}
              className={`w-8 h-8 flex items-center justify-center rounded border italic text-sm ${
                formatState.italic ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
              } hover:bg-gray-100`}
              title="斜体 (Ctrl+I)"
            >
              I
            </button>
            
            <button
              onClick={() => applyFormat('underline')}
              className={`w-8 h-8 flex items-center justify-center rounded border underline text-sm ${
                formatState.underline ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
              } hover:bg-gray-100`}
              title="下划线 (Ctrl+U)"
            >
              U
            </button>
            
            <button
              onClick={() => applyFormat('strikeThrough')}
              className={`w-8 h-8 flex items-center justify-center rounded border line-through text-sm ${
                formatState.strikethrough ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
              } hover:bg-gray-100`}
              title="删除线"
            >
              S
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300"></div>

          {/* 字体颜色 */}
          <div className="relative" ref={colorPickerRef}>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100"
              title="字体颜色"
            >
              <div 
                className="w-4 h-4 border border-gray-300 rounded"
                style={{ backgroundColor: formatState.color }}
              />
              <span className="text-sm">A</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <ColorPicker 
              colors={commonColors} 
              onSelect={(color) => applyFormat('foreColor', color)} 
              isVisible={showColorPicker}
              onClose={() => setShowColorPicker(false)}
            />
          </div>

          {/* 背景颜色 */}
          <div className="relative" ref={bgColorPickerRef}>
            <button
              onClick={() => setShowBgColorPicker(!showBgColorPicker)}
              className="flex items-center space-x-1 px-3 py-1 border border-gray-300 rounded bg-white hover:bg-gray-100"
              title="背景颜色"
            >
              <div 
                className="w-4 h-4 border border-gray-300 rounded"
                style={{ backgroundColor: formatState.backgroundColor }}
              />
              <span className="text-sm">🎨</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <ColorPicker 
              colors={commonColors} 
              onSelect={(color) => applyFormat('backColor', color)} 
              isVisible={showBgColorPicker}
              onClose={() => setShowBgColorPicker(false)}
            />
          </div>

          {/* 字号选择 */}
          <select 
            className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
            onChange={(e) => applyFormat('fontSize', e.target.value)}
            value={formatState.fontSize}
            title="字号"
          >
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="28px">28</option>
          </select>

          <div className="w-px h-6 bg-gray-300"></div>

          {/* 对齐按钮 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => applyFormat('justifyLeft')}
              className={`w-8 h-8 flex items-center justify-center rounded border ${
                formatState.alignment === 'left' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
              } hover:bg-gray-100`}
              title="左对齐"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h8m-8 6h12m-12 6h8" />
              </svg>
            </button>
            
            <button
              onClick={() => applyFormat('justifyCenter')}
              className={`w-8 h-8 flex items-center justify-center rounded border ${
                formatState.alignment === 'center' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
              } hover:bg-gray-100`}
              title="居中对齐"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h8m-6 6h12m-6 6h8" />
              </svg>
            </button>
            
            <button
              onClick={() => applyFormat('justifyRight')}
              className={`w-8 h-8 flex items-center justify-center rounded border ${
                formatState.alignment === 'right' ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-300'
              } hover:bg-gray-100`}
              title="右对齐"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6h8m-8 6h12m-8 6h8" />
              </svg>
            </button>
          </div>

          {/* 列表按钮 */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => applyFormat('insertUnorderedList')}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100"
              title="无序列表"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13m-13 6h13M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>
            
            <button
              onClick={() => applyFormat('insertOrderedList')}
              className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-100"
              title="有序列表"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 文档编辑区域 */}
      <div className="flex-1 p-6 overflow-y-auto bg-white">
        <div
          ref={editorRef}
          className="min-h-96 p-4 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          contentEditable
          suppressContentEditableWarning={true}
          style={{
            fontSize: formatState.fontSize,
            fontFamily: formatState.fontFamily,
            lineHeight: '1.6',
            minHeight: '400px'
          }}
          onInput={(e) => {
            const content = e.currentTarget.innerHTML || '';
            handleContentChange(content);
          }}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          onMouseOver={handleEditorMouseOver}
          onMouseLeave={handleEditorMouseLeave}
        />
      </div>

      {/* 错误弹窗 */}
      {errorPopup.isVisible && errorPopup.error && (
        <div
          ref={popupRef}
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-80 max-w-96"
          style={{
            left: Math.max(10, Math.min(errorPopup.position.x - 160, window.innerWidth - 400)),
            top: Math.max(10, errorPopup.position.y - 10),
            transform: 'translateY(-100%)'
          }}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          {/* 弹窗箭头 */}
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
            style={{ 
              width: 0, 
              height: 0, 
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: '8px solid white'
            }}
          ></div>
          
          {/* 错误信息 */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                errorPopup.error.type === 'error' ? 'bg-red-500' :
                errorPopup.error.type === 'warning' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></span>
              <span className="font-medium text-gray-900">
                {errorPopup.error.type === 'error' ? '确定错误' :
                 errorPopup.error.type === 'warning' ? '疑似错误' :
                 '优化建议'}
              </span>
            </div>
            
            {editingError && editingError.errorId === errorPopup.error.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">编辑内容：</label>
                  <input
                    type="text"
                    value={editingError.content}
                    onChange={(e) => setEditingError(prev => prev ? {...prev, content: e.target.value} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={confirmEdit}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => setEditingError(null)}
                    className="flex-1 bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-400 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="text-sm">
                    <span className="text-red-600 line-through">{errorPopup.error.original}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600 font-medium">{errorPopup.error.suggestion}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => replaceError(errorPopup.error!.id)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>替换</span>
                  </button>
                  
                  <button
                    onClick={() => editError(errorPopup.error!.id)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>编辑</span>
                  </button>
                  
                  <button
                    onClick={() => ignoreError(errorPopup.error!.id)}
                    className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded-md text-sm hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m6.121-6.121A3 3 0 1015.121 9.879m0 0L21 3m-6.121 6.121L12 12" />
                    </svg>
                    <span>忽略</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* 错误详情 */}
          <div className="border-t border-gray-200 pt-3">
            <div className="text-xs text-gray-500 space-y-1">
              <div><span className="font-medium">错误类型：</span>{errorPopup.error.category}</div>
              <div><span className="font-medium">错误原因：</span>{errorPopup.error.reason}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 