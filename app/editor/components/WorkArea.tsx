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
    if (activeSubMenu === 'personal') {
      loadLibraryFiles('private');
    } else if (activeSubMenu === 'shared') {
      loadLibraryFiles('shared');
    }
  }, [activeSubMenu]);

  // 渲染知识库文档列表
  const renderLibraryDocuments = (libraryType: 'private' | 'shared') => {
    const actualLibraryType = libraryType === 'personal' ? 'private' : 'shared';
    
    return (
      <div className="flex flex-col h-full">
        {/* 头部区域 */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                libraryType === 'personal' 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'bg-green-100 text-green-600'
              }`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {libraryType === 'personal' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  )}
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {libraryType === 'personal' ? '专属知识库' : '共享知识库'}
                </h3>
                <p className="text-sm text-gray-500">
                  {libraryType === 'personal' 
                    ? '管理您的个人专业文档资料' 
                    : '访问团队共享的知识资源'
                  }
                </p>
              </div>
            </div>
            
            {/* 新增知识库按钮 */}
            <button 
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                libraryType === 'personal'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>新增知识库</span>
            </button>
          </div>
          
          {/* 统计信息 */}
          {!isLoadingLibrary && !libraryError && (
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
                  libraryType === 'personal' ? 'border-purple-600' : 'border-green-600'
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
                  libraryType === 'personal' 
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
                libraryType === 'personal' ? 'text-purple-400' : 'text-green-400'
              }`}>
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {libraryType === 'personal' ? '专属知识库为空' : '共享知识库为空'}
              </h4>
              <p className="text-gray-500 mb-6">
                {libraryType === 'personal' 
                  ? '您还没有上传任何个人文档，点击上方"新增知识库"按钮开始添加' 
                  : '团队还没有共享任何文档，点击上方"新增知识库"按钮开始添加'
                }
              </p>
              <button 
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  libraryType === 'personal'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {libraryType === 'personal' ? '上传个人文档' : '添加共享文档'}
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
                      onClick={() => handleOpenDocument(doc)}
                      className={`flex-1 px-3 py-2 text-sm text-white rounded-lg transition-colors ${
                        libraryType === 'personal' 
                          ? 'bg-purple-600 hover:bg-purple-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
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

  // 打开文档
  const handleOpenDocument = (document: FileMetadata) => {
    const url = `/api/documents/${document.vector_id}?action=open`;
    window.open(url, '_blank');
  };

  // 下载文档
  const handleDownloadDocument = (document: FileMetadata) => {
    const url = `/api/documents/${document.vector_id}?action=download`;
    const link = document.createElement('a');
    link.href = url;
    link.download = document.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      
      case 'personal':
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
    <div className="flex-1 bg-gray-50 overflow-hidden">
      {renderContent()}
    </div>
  );
} 