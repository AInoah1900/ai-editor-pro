import React, { useState } from 'react';
import RAGEnhancedEditor from './RAGEnhancedEditor';
import UploadArea from './UploadArea';

interface KnowledgeItem {
  id: string;
  type: string;
  domain: string;
  content: string;
  context: string;
  source: string;
  confidence: number;
  tags: string[];
  relevance_score?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface FileMetadata {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  file_type: string;
  upload_time: Date;
  vector_id: string;
  content_hash: string;
  domain?: string;
  tags?: string[];
  ownership_type: 'private' | 'shared';
  owner_id?: string;
  created_at: Date;
  updated_at: Date;
}

interface WorkAreaProps {
  activeSubMenu: string;
  uploadedDocument: string | null;
  setUploadedDocument: (content: string | null) => void;
  setActiveSubMenu: (subMenu: string) => void;
}

// Toast通知接口
interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function WorkArea({ 
  activeSubMenu, 
  uploadedDocument, 
  setUploadedDocument,
  setActiveSubMenu 
}: WorkAreaProps) {
  
  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeItem[]>([]);
  const [relatedDocuments, setRelatedDocuments] = useState<FileMetadata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [showDocuments, setShowDocuments] = useState(true);

  // 知识库文档列表状态
  const [libraryFiles, setLibraryFiles] = useState<FileMetadata[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  
  // 文件上传相关状态
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  
  // 文档查看器状态
  const [documentSource, setDocumentSource] = useState<'private' | 'shared'>('shared');
  const [currentDocument, setCurrentDocument] = useState<FileMetadata | null>(null);
  
  // Toast通知状态
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast通知函数
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, type, message };
    setToasts(prev => [...prev, newToast]);
    
    // 3秒后自动移除Toast
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  // 移除Toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 加载知识库文档列表
  const loadLibraryFiles = async (libraryType: 'private' | 'shared') => {
    setIsLoadingLibrary(true);
    setLibraryError(null);
    
    try {
      const params = new URLSearchParams({
        action: 'getLibraryFiles',
        libraryType,
        ownerId: 'default_user' // 实际应用中应该从用户会话获取
      });
      
      const response = await fetch(`/api/knowledge-base?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLibraryFiles(data.files || []);
      } else {
        setLibraryError(data.error || '加载文档列表失败');
        setLibraryFiles([]);
      }
    } catch (error) {
      console.error('加载知识库文档失败:', error);
      setLibraryError('网络错误，请检查连接');
      setLibraryFiles([]);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // 当切换到知识库子菜单时自动加载文档
  React.useEffect(() => {
    if (activeSubMenu === 'private') {
      loadLibraryFiles('private');
    } else if (activeSubMenu === 'shared') {
      loadLibraryFiles('shared');
    }
  }, [activeSubMenu]);

  // 处理文件上传到知识库
  const handleKnowledgeFileUpload = async (file: File, libraryType: 'private' | 'shared') => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('libraryType', libraryType);
      formData.append('ownerId', 'default_user');
      
      // 调用上传API
      const response = await fetch('/api/knowledge-base', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (result.success) {
        // 上传成功后重新加载文档列表
        await loadLibraryFiles(libraryType);
        showToast('success', '文档上传成功！');
      } else {
        throw new Error(result.error || '上传失败');
      }
      
    } catch (error) {
      console.error('文档上传失败:', error);
      showToast('error', '文档上传失败: ' + (error instanceof Error ? error.message : '请重试'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // 触发文件选择
  const triggerFileUpload = (libraryType: 'private' | 'shared') => {
    setIsSelectingFile(true);
    showToast('info', '请选择要上传的文档文件...');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.md';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      setIsSelectingFile(false);
      if (file) {
        showToast('info', `正在准备上传文件: ${file.name}`);
        handleKnowledgeFileUpload(file, libraryType);
      } else {
        showToast('info', '未选择文件，上传已取消');
      }
    };
    
    // 处理用户取消文件选择的情况
    input.oncancel = () => {
      setIsSelectingFile(false);
      showToast('info', '文件选择已取消');
    };
    
    // 添加焦点事件监听，处理对话框关闭但没有触发onchange的情况
    const handleFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          setIsSelectingFile(false);
        }
      }, 1000);
      window.removeEventListener('focus', handleFocus);
    };
    window.addEventListener('focus', handleFocus);
    
    input.click();
  };

  // 渲染知识库文档列表
  const renderLibraryDocuments = (libraryType: 'private' | 'shared') => {
    const actualLibraryType = libraryType;

  return (
      <div className="flex flex-col h-full">
        {/* 头部区域 */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                libraryType === 'private' 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'bg-green-100 text-green-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {libraryType === 'private' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {libraryType === 'private' ? '专属知识库' : '共享知识库'}
                </h3>
                <p className="text-sm text-gray-500">
                  {libraryType === 'private' 
                    ? '管理您的个人专业文档资料' 
                    : '访问团队共享的知识资源'
                  }
                </p>
              </div>
            </div>
            
            {/* 新增知识库按钮 */}
            <button 
              onClick={() => triggerFileUpload(actualLibraryType)}
              disabled={isUploading || isSelectingFile}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                libraryType === 'private'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-400'
                  : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400'
              }`}
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isSelectingFile ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
              <span>
                {isUploading ? '上传中...' : 
                 isSelectingFile ? '选择文件...' : 
                 '新增知识库'}
              </span>
            </button>
          </div>
          
          {/* 统计信息和上传进度 */}
          {isUploading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>正在上传文档...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    libraryType === 'private' ? 'bg-purple-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          ) : !isLoadingLibrary && !libraryError && (
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span>共 {libraryFiles.length} 个文档</span>
              <span>•</span>
              <span>
                总大小 {libraryFiles.reduce((total, file) => total + file.file_size, 0) > 0 
                  ? formatFileSize(libraryFiles.reduce((total, file) => total + file.file_size, 0))
                  : '0 Bytes'
                }
              </span>
              <button
                onClick={() => loadLibraryFiles(actualLibraryType)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                刷新
              </button>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoadingLibrary ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${
                  libraryType === 'private' ? 'border-purple-600' : 'border-green-600'
                }`}></div>
                <p className="text-gray-500">正在加载文档...</p>
              </div>
            </div>
          ) : libraryError ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">加载失败</h4>
              <p className="text-gray-500 mb-4">{libraryError}</p>
              <button
                onClick={() => loadLibraryFiles(actualLibraryType)}
                className={`px-4 py-2 text-white rounded-lg transition-colors ${
                  libraryType === 'private' 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                重试
              </button>
            </div>
          ) : libraryFiles.length === 0 ? (
            <div className="text-center py-12">
              <div className={`mb-4 ${
                libraryType === 'private' ? 'text-purple-400' : 'text-green-400'
              }`}>
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {libraryType === 'private' ? '专属知识库为空' : '共享知识库为空'}
              </h4>
              <p className="text-gray-500 mb-6">
                {libraryType === 'private' 
                  ? '您还没有上传任何个人文档，点击上方"新增知识库"按钮开始添加' 
                  : '团队还没有共享任何文档，点击上方"新增知识库"按钮开始添加'
                }
              </p>
              <button 
                onClick={() => triggerFileUpload(actualLibraryType)}
                disabled={isUploading || isSelectingFile}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  libraryType === 'private'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-purple-400'
                    : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-green-400'
                }`}
              >
                {isUploading ? '上传中...' : 
                 isSelectingFile ? '选择文件...' : 
                 (libraryType === 'private' ? '上传个人文档' : '添加共享文档')}
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {libraryFiles.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 truncate" title={doc.filename}>
                        {doc.filename}
                      </h5>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.file_size)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 uppercase">
                          {doc.file_type}
                        </span>
                      </div>
                    </div>
                    
                    {doc.domain && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        doc.domain === 'academic' ? 'bg-blue-100 text-blue-800' :
                        doc.domain === 'medical' ? 'bg-red-100 text-red-800' :
                        doc.domain === 'legal' ? 'bg-purple-100 text-purple-800' :
                        doc.domain === 'technical' ? 'bg-green-100 text-green-800' :
                        doc.domain === 'business' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {doc.domain === 'academic' ? '学术' :
                         doc.domain === 'medical' ? '医学' :
                         doc.domain === 'legal' ? '法律' :
                         doc.domain === 'technical' ? '技术' :
                         doc.domain === 'business' ? '商业' :
                         '通用'}
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">
                      上传时间: {formatDate(doc.upload_time)}
                    </p>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.slice(0, 2).map((tag, tagIndex) => (
                          <span key={tagIndex} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 2 && (
                          <span className="text-xs text-gray-400">+{doc.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
        <button
                      onClick={() => handleOpenDocument(doc, 'view')}
                      className={`flex-1 px-3 py-2 text-sm text-white rounded-lg transition-colors ${
                        libraryType === 'private' 
                          ? 'bg-purple-600 hover:bg-purple-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                      title={
                        doc.file_type.toLowerCase() === 'docx' ? '支持DOCX格式预览' :
                        doc.file_type.toLowerCase() === 'pdf' ? '支持PDF格式预览' :
                        ''
                      }
                    >
                      {doc.file_type.toLowerCase() === 'docx' && (
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                      {doc.file_type.toLowerCase() === 'pdf' && (
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                      查看文档
                    </button>
                    <button
                      onClick={() => handleDownloadDocument(doc)}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      下载
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 执行搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        limit: '10',
        includeDocuments: showDocuments.toString()
      });
      
      if (selectedDomain) params.append('domain', selectedDomain);
      if (selectedType) params.append('type', selectedType);
      
      const response = await fetch(`/api/knowledge-base?${params}`);
      const data = await response.json();
      
      if (data.success) {
        if (showDocuments && data.knowledge_items && data.related_documents) {
          // 综合搜索结果
          setSearchResults(data.knowledge_items || []);
          setRelatedDocuments(data.related_documents || []);
        } else {
          // 只有知识项
          setSearchResults(data.knowledge_items || []);
          setRelatedDocuments([]);
        }
      } else {
        setSearchError(data.error || '搜索失败');
        setSearchResults([]);
        setRelatedDocuments([]);
      }
    } catch (error) {
      console.error('搜索知识库失败:', error);
      setSearchError('搜索请求失败，请检查网络连接');
      setSearchResults([]);
      setRelatedDocuments([]);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理搜索框回车键
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 清空搜索
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setRelatedDocuments([]);
    setSearchError(null);
    setSelectedDomain('');
    setSelectedType('');
  };

  // 在工作区内打开文档
  const handleOpenDocument = async (document: FileMetadata, mode: 'edit' | 'view' = 'edit') => {
    // 显示加载提示
    showToast('info', `正在打开文档 "${document.filename}"...`);
    
    try {
      const response = await fetch(`/api/documents/${document.vector_id}?action=open`);
      
      if (response.ok) {
        const content = await response.text();
        setUploadedDocument(content);
        setCurrentDocument(document); // 保存当前文档信息
        
        // 记录文档来源，用于返回时跳转到正确的列表
        setDocumentSource(document.ownership_type === 'private' ? 'private' : 'shared');
        
        // 显示成功提示
        showToast('success', `文档 "${document.filename}" 打开成功`);
        
        // 根据模式决定跳转到哪个子菜单
        if (mode === 'edit') {
          setActiveSubMenu('rag-editor'); // 编辑模式，使用AI增强编辑器
        } else {
          setActiveSubMenu('document-viewer'); // 查看模式，简单文档查看器
        }
      } else {
        // 处理文档不存在的情况
        try {
          const errorData = await response.json();
          console.error('获取文档内容失败:', errorData);
          showToast('error', `无法打开文档 "${document.filename}": ${errorData.error || '文档不存在'}`);
          
          // 可选：从列表中移除不存在的文档
          if (confirm('是否从知识库中移除此无效文档？')) {
            await removeInvalidDocument(document);
          }
        } catch (parseError) {
          // 如果响应不是JSON格式，获取原始文本
          const errorText = await response.text();
          console.error('文档打开失败 - 非JSON响应:', errorText);
          showToast('error', `无法打开文档 "${document.filename}": 服务器返回了意外的响应格式`);
        }
      }
    } catch (error) {
      console.error('打开文档失败:', error);
      showToast('error', `打开文档失败: ${error instanceof Error ? error.message : '网络错误'}`);
    }
  };

  // 移除无效文档
  const removeInvalidDocument = async (document: FileMetadata) => {
    try {
      // 这里可以调用删除API，暂时只是重新加载列表
      const libraryType = document.ownership_type === 'private' ? 'private' : 'shared';
      await loadLibraryFiles(libraryType);
      showToast('success', '文档已从列表中移除');
    } catch (error) {
      console.error('移除文档失败:', error);
      showToast('error', '移除文档失败，请手动刷新页面');
    }
  };

  // 下载文档
  const handleDownloadDocument = (fileMetadata: FileMetadata) => {
    const url = `/api/documents/${fileMetadata.vector_id}?action=download`;
    const link = window.document.createElement('a');
    link.href = url;
    link.download = fileMetadata.filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN') + ' ' + d.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  const renderContent = () => {
    switch (activeSubMenu) {
      case 'upload':
        return (
          <UploadArea 
            onFileUpload={setUploadedDocument}
            onSwitchToEditor={() => setActiveSubMenu('rag-editor')}
          />
        );
      
      case 'rag-editor':
        return uploadedDocument ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <RAGEnhancedEditor content={uploadedDocument} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">请先上传文档以开始编辑</p>
              <button
                onClick={() => setActiveSubMenu('upload')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                上传文档
              </button>
            </div>
          </div>
        );

      case 'document-viewer':
        return uploadedDocument && currentDocument ? (
          <div className="flex flex-col h-full">
            {/* 文档查看器头部 */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    currentDocument.file_type === 'pdf' ? 'bg-red-100 text-red-600' :
                    currentDocument.file_type === 'docx' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {currentDocument.file_type === 'pdf' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : currentDocument.file_type === 'docx' ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 truncate max-w-xs" title={currentDocument.filename}>
                      {currentDocument.filename}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {currentDocument.file_type.toUpperCase()} • {formatFileSize(currentDocument.file_size)} • 只读模式
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownloadDocument(currentDocument)}
                    className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>下载</span>
                  </button>
                  <button
                    onClick={() => setActiveSubMenu(documentSource)}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    返回列表
                  </button>
                </div>
              </div>
            </div>
            
            {/* 文档内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="p-6">
                    {uploadedDocument.includes('暂不支持') ? (
                      // 不支持的格式显示提示信息
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">无法预览此格式</h4>
                        <p className="text-gray-500 mb-4 whitespace-pre-line">{uploadedDocument}</p>
                        <button
                          onClick={() => handleDownloadDocument(currentDocument)}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>下载原文件</span>
                        </button>
                      </div>
                    ) : (
                      // 支持的格式显示文档内容
                      <div>
                        <div className="mb-4 pb-4 border-b border-gray-200">
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-2">
                              <span>文档内容预览</span>
                              {currentDocument.file_type.toLowerCase() === 'pdf' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                  PDF
                                </span>
                              )}
                              {currentDocument.file_type.toLowerCase() === 'docx' && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  DOCX
                                </span>
                              )}
                            </div>
                            <span>上传时间: {formatDate(currentDocument.upload_time)}</span>
                          </div>
                        </div>
                        <div className={`${
                          currentDocument.file_type.toLowerCase() === 'pdf' 
                            ? 'bg-gray-50 border border-gray-200 rounded-lg p-4' 
                            : ''
                        }`}>
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed font-sans">
                            {uploadedDocument}
                          </pre>
                          {currentDocument.file_type.toLowerCase() === 'pdf' && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-center space-x-4">
                                <button
                                  onClick={() => handleDownloadDocument(currentDocument)}
                                  className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                                >
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  下载PDF文档
                                </button>
                                <div className="text-sm text-gray-500">
                                  建议使用专业PDF阅读器打开
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">请选择文档进行查看</p>
              <button
                onClick={() => setActiveSubMenu(documentSource)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                返回知识库
              </button>
            </div>
          </div>
        );
      
      case 'download':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">文档下载</h3>
              <p className="text-gray-500 mb-6">导出编辑完成的文档</p>
              {uploadedDocument ? (
                <div className="space-y-3">
                  <button className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    下载为 Word 文档 (.docx)
                  </button>
                  <button className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    下载为 PDF 文档 (.pdf)
                  </button>
                  <button className="block w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                    下载为文本文件 (.txt)
                  </button>
                </div>
              ) : (
                <p className="text-gray-400">请先上传并编辑文档</p>
              )}
            </div>
          </div>
        );
      
      case 'history':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">编辑历史</h3>
              <p className="text-gray-500 mb-6">查看文档编辑的历史记录</p>
              <div className="text-left max-w-md mx-auto space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">版本 1.0</span>
                    <span className="text-xs text-gray-500">2 分钟前</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">初始文档上传</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">版本 1.1</span>
                    <span className="text-xs text-blue-600">当前版本</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">AI智能编辑 - 修复了 8 处语法错误和专业术语</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'search':
        return (
          <div className="flex flex-col h-full">
            {/* 搜索头部 */}
            <div className="bg-white border-b border-gray-200 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center mb-4">
                  <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900">搜索知识库</h3>
                </div>
                
                {/* 搜索输入框 */}
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="输入关键词搜索专业知识..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-2 top-2 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {isSearching ? (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* 过滤器 */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">所有领域</option>
                    <option value="academic">学术</option>
                    <option value="medical">医学</option>
                    <option value="legal">法律</option>
                    <option value="technical">技术</option>
                    <option value="business">商业</option>
                    <option value="general">通用</option>
                  </select>
                  
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">所有类型</option>
                    <option value="terminology">术语</option>
                    <option value="rule">规则</option>
                    <option value="example">示例</option>
                    <option value="correction">纠错</option>
                  </select>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={showDocuments}
                      onChange={(e) => setShowDocuments(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">包含相关文档</span>
                  </label>
                  
                  {(searchQuery || selectedDomain || selectedType) && (
                    <button
                      onClick={clearSearch}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      清空
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* 搜索结果区域 */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6">
                {searchError ? (
                  <div className="text-center py-12">
                    <div className="text-red-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">搜索出错</h4>
                    <p className="text-gray-500 mb-4">{searchError}</p>
                    <button
                      onClick={handleSearch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      重试
                    </button>
                  </div>
                ) : (searchResults.length > 0 || relatedDocuments.length > 0) ? (
                  <div className="space-y-6">
                    {/* 知识项结果 */}
                    {searchResults.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900">
                            知识库结果 ({searchResults.length} 条)
                          </h4>
                        </div>
                        
                        {searchResults.map((item, index) => (
                          <div key={item.id || index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.type === 'terminology' ? 'bg-blue-100 text-blue-800' :
                                  item.type === 'rule' ? 'bg-green-100 text-green-800' :
                                  item.type === 'example' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.type === 'terminology' ? '术语' :
                                   item.type === 'rule' ? '规则' :
                                   item.type === 'example' ? '示例' :
                                   item.type === 'correction' ? '纠错' : item.type}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {item.domain === 'academic' ? '学术' :
                                   item.domain === 'medical' ? '医学' :
                                   item.domain === 'legal' ? '法律' :
                                   item.domain === 'technical' ? '技术' :
                                   item.domain === 'business' ? '商业' : item.domain}
                                </span>
                              </div>
                              
                              {item.relevance_score && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <span className="mr-1">相关度:</span>
                                  <span className="font-medium">
                                    {Math.round(item.relevance_score * 100)}%
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-gray-900 font-medium mb-2">{item.content}</p>
                              {item.context && (
                                <p className="text-gray-600 text-sm">{item.context}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <span>来源: {item.source}</span>
                                <span>置信度: {Math.round(item.confidence * 100)}%</span>
                              </div>
                              
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  {item.tags.slice(0, 3).map((tag, tagIndex) => (
                                    <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                      {tag}
                                    </span>
                                  ))}
                                  {item.tags.length > 3 && (
                                    <span className="text-xs text-gray-400">+{item.tags.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 相关文档结果 */}
                    {relatedDocuments.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900">
                            相关文档 ({relatedDocuments.length} 个)
                          </h4>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          {relatedDocuments.map((doc, index) => (
                            <div key={doc.id || index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="text-sm font-medium text-gray-900 truncate" title={doc.filename}>
                                      {doc.filename}
                                    </h5>
                                    <p className="text-xs text-gray-500">
                                      {formatFileSize(doc.file_size)} • {doc.file_type.toUpperCase()}
                                    </p>
                                  </div>
                                </div>
                                
                                {doc.domain && (
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                                    {doc.domain === 'academic' ? '学术' :
                                     doc.domain === 'medical' ? '医学' :
                                     doc.domain === 'legal' ? '法律' :
                                     doc.domain === 'technical' ? '技术' :
                                     doc.domain === 'business' ? '商业' : doc.domain}
                                  </span>
                                )}
                              </div>
                              
                              <div className="mb-3">
                                <p className="text-xs text-gray-500">
                                  上传时间: {formatDate(doc.upload_time)}
                                </p>
                                {doc.tags && doc.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {doc.tags.slice(0, 3).map((tag, tagIndex) => (
                                      <span key={tagIndex} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                        {tag}
                                      </span>
                                    ))}
                                    {doc.tags.length > 3 && (
                                      <span className="text-xs text-gray-400">+{doc.tags.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleOpenDocument(doc)}
                                  className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                  打开文档
                                </button>
                                <button
                                  onClick={() => handleDownloadDocument(doc)}
                                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                  下载
        </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : searchQuery && !isSearching ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">未找到相关结果</h4>
                    <p className="text-gray-500">尝试使用不同的关键词或调整过滤条件</p>
                  </div>
                ) : !searchQuery ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">开始搜索</h4>
                    <p className="text-gray-500">在上方输入关键词来搜索专业知识库</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      
      case 'private':
      case 'shared':
        return renderLibraryDocuments(activeSubMenu);
      
      case 'login':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">登录账户</h3>
                <p className="text-gray-500">登录以同步您的编辑历史和设置</p>
              </div>
              
              <form className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    邮箱地址
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入您的邮箱"
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    密码
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入您的密码"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  登录
                </button>
                
                <div className="text-center">
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                    忘记密码？
                  </a>
                </div>
              </form>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">个人设置</h3>
              <p className="text-gray-500 mb-6">配置您的账户和偏好设置</p>
              <div className="space-y-3">
                <button className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  编辑个人信息
                </button>
                <button className="block w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  修改密码
                </button>
                <button className="block w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  退出登录
                </button>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Editor Pro</h3>
              <p className="text-gray-500">智能文档编辑平台</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-hidden relative">
      {renderContent()}
      
      {/* Toast通知容器 */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 ${
                toast.type === 'success' ? 'bg-green-600 text-white' :
                toast.type === 'error' ? 'bg-red-600 text-white' :
                'bg-blue-600 text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : toast.type === 'error' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-3 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 