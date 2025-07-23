'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface ErrorItem {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  category: string;
  original: string;
  suggestion: string;
  reason: string;
  position: {
    start: number;
    end: number;
  };
}

interface QingCiStyleEditorProps {
  content: string;
  errors: ErrorItem[];
  onContentChange?: (content: string) => void;
  onClearText?: () => void;
  onClearFormat?: () => void;
  onImportDocument?: () => void;
  onDownloadDocument?: () => void;
  documentStats?: {
    characters: number;
    paragraphs: number;
    words: number;
  };
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color: string;
  backgroundColor: string;
  fontSize: string;
  fontFamily: string;
  alignment: string;
}

export default function QingCiStyleEditor({ 
  content, 
  errors = [], 
  onContentChange,
  onClearText,
  onClearFormat,
  onImportDocument,
  onDownloadDocument,
  documentStats
}: QingCiStyleEditorProps) {
  const [documentContent, setDocumentContent] = useState(content);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  
  const editorRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const bgColorPickerRef = useRef<HTMLDivElement>(null);

  const [formatState, setFormatState] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    color: '#000000',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    fontFamily: '宋体',
    alignment: 'left'
  });



  // 将纯文本转换为HTML格式，保持原始格式
  const convertTextToHTML = useCallback((text: string) => {
    if (!text) return '';
    
    // 1. 转义HTML特殊字符
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    
    // 2. 处理连续空格
    html = html.replace(/  +/g, (match) => {
      return '&nbsp;'.repeat(match.length);
    });
    
    // 3. 处理换行符：将 \n 转换为 <br> 标签
    html = html.replace(/\n/g, '<br>');
    
    return html;
  }, []);

  // 更新文档内容
  const handleContentChange = (newContent: string) => {
    setDocumentContent(newContent);
    onContentChange?.(newContent);
  };

  // 处理文本选择
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const text = selection.toString();
      setSelectedText(text);
      
      if (text.length > 0) {
        const editorText = editorRef.current?.textContent || '';
        const start = editorText.indexOf(text);
        const end = start + text.length;
        setSelectionRange({ start, end });
      } else {
        setSelectionRange(null);
      }
    }
  };

  // 应用格式化
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    
    // 更新格式状态
    switch (command) {
      case 'bold':
        setFormatState(prev => ({ ...prev, bold: !prev.bold }));
        break;
      case 'italic':
        setFormatState(prev => ({ ...prev, italic: !prev.italic }));
        break;
      case 'underline':
        setFormatState(prev => ({ ...prev, underline: !prev.underline }));
        break;
      case 'strikeThrough':
        setFormatState(prev => ({ ...prev, strikethrough: !prev.strikethrough }));
        break;
      case 'foreColor':
        setFormatState(prev => ({ ...prev, color: value || '#000000' }));
        setShowColorPicker(false);
        break;
      case 'backColor':
        setFormatState(prev => ({ ...prev, backgroundColor: value || '#ffffff' }));
        setShowBgColorPicker(false);
        break;
      case 'fontSize':
        setFormatState(prev => ({ ...prev, fontSize: value || '14px' }));
        break;
      case 'fontName':
        setFormatState(prev => ({ ...prev, fontFamily: value || '宋体' }));
        break;
      case 'justifyLeft':
      case 'justifyCenter':
      case 'justifyRight':
      case 'justifyFull':
        const alignment = command.replace('justify', '').toLowerCase();
        setFormatState(prev => ({ ...prev, alignment }));
        break;
    }
  };

  // 渲染带错误标注的文档内容
  const renderDocumentWithAnnotations = () => {
    if (!documentContent) return '';
    
    // 首先将整个文档转换为HTML格式
    let htmlContent = convertTextToHTML(documentContent);
    
    if (errors.length === 0) {
      return htmlContent;
    }

    // 如果有错误，需要在HTML内容中插入错误标注
    // 但这需要重新计算位置，因为HTML转换会改变字符位置
    // 为了简化，我们先使用原始文本进行错误标注，然后转换
    
    // 按位置排序错误
    const sortedErrors = [...errors].sort((a, b) => a.position.start - b.position.start);
    
    let result = '';
    let lastIndex = 0;

    sortedErrors.forEach((error) => {
      // 添加错误前的正常文本
      const beforeText = documentContent.slice(lastIndex, error.position.start);
      result += convertTextToHTML(beforeText);
      
      // 添加带标注的错误文本
      const errorClass = error.type === 'error' ? 'error-annotation' : 
                        error.type === 'warning' ? 'warning-annotation' : 
                        'suggestion-annotation';
      
      const errorText = convertTextToHTML(error.original);
      result += `<span class="${errorClass}" title="${error.reason}: ${error.suggestion}" data-error-id="${error.id}">${errorText}</span>`;
      
      lastIndex = error.position.end;
    });
    
    // 添加最后的正常文本
    const afterText = documentContent.slice(lastIndex);
    result += convertTextToHTML(afterText);
    
    return result;
  };

  // 颜色选择器
  const ColorPicker = ({ 
    colors, 
    onSelect, 
    isVisible, 
    onClose 
  }: { 
    colors: string[], 
    onSelect: (color: string) => void,
    isVisible: boolean,
    onClose: () => void
  }) => {
    if (!isVisible) return null;

    return (
      <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
        <div className="grid grid-cols-8 gap-1 mb-2">
          {colors.map(color => (
            <button
              key={color}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => onSelect(color)}
              title={color}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
        >
          关闭
        </button>
      </div>
    );
  };



  // 监听内容变化
  useEffect(() => {
    setDocumentContent(content);
    
    // 当文档内容变化时，更新编辑器的HTML内容
    if (editorRef.current && content) {
      const htmlContent = convertTextToHTML(content);
      editorRef.current.innerHTML = htmlContent;
    }
  }, [content, convertTextToHTML]);

  // 点击外部关闭颜色选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
      if (bgColorPickerRef.current && !bgColorPickerRef.current.contains(event.target as Node)) {
        setShowBgColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const commonColors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF', '#FF0000', '#00FF00',
    '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#800000', '#008000', '#000080', '#808000',
    '#800080', '#008080', '#FFA500', '#FFC0CB', '#A52A2A', '#808080', '#ADD8E6', '#90EE90'
  ];

  return (
    <div className="h-full flex flex-col bg-white" data-testid="qingci-style-editor">
      <style jsx>{`
        .error-annotation {
          background-color: #fef2f2;
          border-bottom: 2px solid #ef4444;
          cursor: pointer;
        }
        .warning-annotation {
          background-color: #fffbeb;
          border-bottom: 2px solid #f59e0b;
          cursor: pointer;
        }
        .suggestion-annotation {
          background-color: #f0fdf4;
          border-bottom: 2px solid #10b981;
          cursor: pointer;
        }
        .error-annotation:hover,
        .warning-annotation:hover,
        .suggestion-annotation:hover {
          opacity: 0.8;
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
              <option value="宋体">宋体</option>
              <option value="微软雅黑">微软雅黑</option>
              <option value="楷体">楷体</option>
              <option value="黑体">黑体</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
          </div>

          <div className="w-px h-6 bg-gray-300"></div>

          {/* 格式化按钮 */}
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
          dangerouslySetInnerHTML={{ __html: renderDocumentWithAnnotations() }}
        />
      </div>


    </div>
  );
} 