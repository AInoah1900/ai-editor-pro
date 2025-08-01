import React, { useRef, useState } from 'react';
import mammoth from 'mammoth';

interface UploadAreaProps {
  onFileUpload: (content: string) => void;
  onSwitchToEditor?: () => void;
}

export default function UploadArea({ onFileUpload, onSwitchToEditor }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleFileUpload = async (file: File) => {
    console.log('🔍 UploadArea 开始处理文件:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });
    
    setIsProcessing(true);
    setUploadStatus({ type: 'info', message: '正在处理文档...' });

    try {
      const fileExtension = file.name.toLowerCase().split('.').pop();
      let content = '';
      
      console.log('🔍 文件扩展名:', fileExtension);

      switch (fileExtension) {
        case 'docx':
          // 处理 .docx 文件
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          content = result.value;
          if (result.messages.length > 0) {
            console.warn('Word文档解析警告:', result.messages);
          }
          break;

        case 'doc':
          // .doc 文件需要特殊处理，暂时提示用户转换为 .docx
          setUploadStatus({ 
            type: 'error', 
            message: '暂不支持 .doc 格式，请将文档另存为 .docx 格式后重新上传' 
          });
          setIsProcessing(false);
          return;

        case 'txt':
          // 处理纯文本文件
          content = await file.text();
          break;

        default:
          setUploadStatus({ 
            type: 'error', 
            message: '不支持的文件格式，请上传 .docx 或 .txt 文件' 
          });
          setIsProcessing(false);
          return;
      }

      console.log('🔍 UploadArea 文件解析完成:', {
        contentLength: content.length,
        contentTrimmedLength: content.trim().length,
        contentPreview: content.substring(0, 100)
      });

      if (content.trim().length === 0) {
        console.log('❌ UploadArea 文档内容为空');
        setUploadStatus({ 
          type: 'error', 
          message: '文档内容为空，请检查文件是否正确' 
        });
        setIsProcessing(false);
        return;
      }

      // 成功处理文档
      setUploadStatus({ 
        type: 'success', 
        message: `文档上传成功！共 ${content.length} 个字符` 
      });
      
      // 延迟一下让用户看到成功消息
      setTimeout(() => {
        console.log('🔍 UploadArea 延迟后处理:', {
          contentLength: content.length,
          contentPreview: content.substring(0, 50),
          hasOnFileUpload: !!onFileUpload,
          hasOnSwitchToEditor: !!onSwitchToEditor
        });
        
        onFileUpload(content);
        setIsProcessing(false);
        setUploadStatus({ type: null, message: '' });
        // 通知父组件切换到编辑器视图
        if (onSwitchToEditor) {
          console.log('🔄 UploadArea 切换到编辑器视图');
          onSwitchToEditor();
        }
      }, 1000);

    } catch (error) {
      console.error('文件处理错误:', error);
      setUploadStatus({ 
        type: 'error', 
        message: '文件处理失败，请检查文件是否损坏或格式是否正确' 
      });
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return '';
    }
  };

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div
        className={`w-full max-w-2xl border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 bg-white hover:border-gray-400'
        } ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isProcessing ? '正在处理文档...' : '上传文档开始AI编辑'}
            </h3>
            <p className="text-gray-600 mb-6">
              支持 Word 文档 (.docx) 和文本文件 (.txt)
            </p>
          </div>

          {/* 状态消息 */}
          {uploadStatus.type && (
            <div className={`p-3 rounded-lg border flex items-center justify-center space-x-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium">{uploadStatus.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? '处理中...' : '选择文件上传'}
            </button>
            
            <p className="text-sm text-gray-500">
              或将文件拖拽到此区域
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">AI编辑功能包括：</h4>
            <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>语法错误检测</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>标点符号校正</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>语句逻辑优化</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>文献引用格式</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>提示：</strong>目前支持 .docx 和 .txt 格式。如果您的文档是 .doc 格式，请先在Word中另存为 .docx 格式。
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.txt"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
} 