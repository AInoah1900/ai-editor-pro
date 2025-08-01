import React, { useRef, useState, useEffect } from 'react';
import mammoth from 'mammoth';

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

interface SubMenuProps {
  activeMenu: string;
  activeSubMenu: string;
  setActiveSubMenu: (subMenu: string) => void;
  setUploadedDocument: (content: string | null) => void;
}

export default function SubMenu({ activeMenu, activeSubMenu, setActiveSubMenu, setUploadedDocument }: SubMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 知识库相关状态
  const [expandedLibrary, setExpandedLibrary] = useState<'personal' | 'shared' | null>('shared'); // 默认展开共享知识库
  const [libraryFiles, setLibraryFiles] = useState<{
    personal: FileMetadata[];
    shared: FileMetadata[];
  }>({
    personal: [],
    shared: []
  });
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const menuConfig = {
    'ai-editor': [
      {
        id: 'upload',
        name: '上传文档',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )
      },
      {
        id: 'download',
        name: '下载文档',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      {
        id: 'history',
        name: '编辑历史',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      }
    ],
    'knowledge-base': [
      {
        id: 'search',
        name: '搜索知识库',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
      }
    ],
    'profile': [
      {
        id: 'login',
        name: '登录/注册',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        )
      },
      {
        id: 'settings',
        name: '个人设置',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      }
    ]
  };

  const currentMenuItems = menuConfig[activeMenu as keyof typeof menuConfig] || [];

  // 加载知识库文档
  const loadLibraryFiles = async (libraryType: 'personal' | 'shared') => {
    setIsLoadingLibrary(true);
    setLibraryError(null);
    
    try {
      const params = new URLSearchParams({
        action: 'getLibraryFiles',
        libraryType: libraryType === 'personal' ? 'private' : 'shared',
        ownerId: 'default_user'
      });
      
      const response = await fetch(`/api/knowledge-base?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLibraryFiles(prev => ({
          ...prev,
          [libraryType]: data.files || []
        }));
      } else {
        setLibraryError(data.error || '加载失败');
      }
    } catch (error) {
      console.error('加载知识库文档失败:', error);
      setLibraryError('网络请求失败');
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // 初始化时加载共享知识库
  useEffect(() => {
    if (activeMenu === 'knowledge-base') {
      loadLibraryFiles('shared');
    }
  }, [activeMenu]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      
      try {
        const fileExtension = file.name.toLowerCase().split('.').pop();
        let content = '';

        switch (fileExtension) {
          case 'docx':
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            content = result.value;
            if (result.messages.length > 0) {
              console.warn('Word文档解析警告:', result.messages);
            }
            break;

          case 'doc':
            alert('暂不支持 .doc 格式，请将文档另存为 .docx 格式后重新上传');
            setIsProcessing(false);
            return;

          case 'txt':
            content = await file.text();
            break;

          default:
            alert('不支持的文件格式，请上传 .docx 或 .txt 文件');
            setIsProcessing(false);
            return;
        }

        if (content.trim().length === 0) {
          alert('文档内容为空，请检查文件是否正确');
          setIsProcessing(false);
          return;
        }

        // 添加调试日志
        console.log('🔍 SubMenu 文件上传成功:', {
          fileName: file.name,
          fileSize: file.size,
          contentLength: content.length,
          contentPreview: content.substring(0, 100)
        });

        setUploadedDocument(content);
        setActiveSubMenu('rag-editor');
        
      } catch (error) {
        console.error('文件处理错误:', error);
        alert('文件处理失败，请检查文件是否损坏或格式是否正确');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleUploadClick = () => {
    if (activeSubMenu === 'upload') {
      fileInputRef.current?.click();
    } else {
      setActiveSubMenu('upload');
    }
  };

  // 处理知识库按钮点击
  const handleLibraryClick = (libraryType: 'personal' | 'shared') => {
    if (expandedLibrary === libraryType) {
      // 如果已经展开，则收起
      setExpandedLibrary(null);
      setActiveSubMenu('search'); // 回到搜索页面
    } else {
      // 展开对应的知识库
      setExpandedLibrary(libraryType);
      setActiveSubMenu(libraryType);
      
      // 如果还没有加载过数据，则加载
      if (libraryFiles[libraryType].length === 0) {
        loadLibraryFiles(libraryType);
      }
    }
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
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 在工作区内打开文档
  const handleOpenDocument = async (document: FileMetadata) => {
    try {
      const response = await fetch(`/api/documents/${document.vector_id}?action=open`);
      if (response.ok) {
        const content = await response.text();
        setUploadedDocument(content);
        
        // 统一使用文档查看器，无论是专属还是共享知识库
        setActiveSubMenu('document-viewer');
      } else {
        // 处理文档不存在的情况
        try {
          const errorData = await response.json();
          console.error('获取文档内容失败:', errorData);
          alert(`无法打开文档 "${document.filename}"\n原因: ${errorData.error || '文档不存在'}\n\n请联系管理员或重新上传此文档。`);
        } catch (parseError) {
          // 如果响应不是JSON格式，获取原始文本
          const errorText = await response.text();
          console.error('文档打开失败 - 非JSON响应:', errorText);
          alert(`无法打开文档 "${document.filename}"\n服务器返回了意外的响应格式\n\n请联系管理员检查服务器状态。`);
        }
      }
    } catch (error) {
      console.error('打开文档失败:', error);
      alert(`打开文档失败: ${error instanceof Error ? error.message : '网络错误'}`);
    }
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          {activeMenu === 'ai-editor' && 'AI编辑加工'}
          {activeMenu === 'knowledge-base' && '知识库'}
          {activeMenu === 'profile' && '个人中心'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {activeMenu === 'ai-editor' && '智能文档编辑与优化'}
          {activeMenu === 'knowledge-base' && '专业知识管理与检索'}
          {activeMenu === 'profile' && '账户设置与个人信息'}
        </p>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* 非知识库菜单项 */}
        {activeMenu !== 'knowledge-base' && currentMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'upload') {
                handleUploadClick();
              } else {
                setActiveSubMenu(item.id);
              }
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
              activeSubMenu === item.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
            }`}
          >
            <span className={`${activeSubMenu === item.id ? 'text-blue-600' : 'text-gray-400'} transition-colors duration-200`}>
              {item.icon}
            </span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}

        {/* 知识库特殊菜单 */}
        {activeMenu === 'knowledge-base' && (
          <>
            {/* 搜索知识库按钮 */}
            <button
              onClick={() => {
                setActiveSubMenu('search');
                setExpandedLibrary(null);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                activeSubMenu === 'search'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
              }`}
            >
              <span className={`${activeSubMenu === 'search' ? 'text-blue-600' : 'text-gray-400'} transition-colors duration-200`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <span className="font-medium">搜索知识库</span>
            </button>

            {/* 专属知识库按钮 */}
            <div className="space-y-1">
              <button
                onClick={() => handleLibraryClick('personal')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  expandedLibrary === 'personal'
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`${expandedLibrary === 'personal' ? 'text-purple-600' : 'text-gray-400'} transition-colors duration-200`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <span className="font-medium">专属知识库</span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${expandedLibrary === 'personal' ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 专属知识库文档列表 */}
              {expandedLibrary === 'personal' && (
                <div className="ml-4 pl-4 border-l-2 border-purple-100 space-y-2">
                  {isLoadingLibrary ? (
                    <div className="flex items-center space-x-2 py-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>加载中...</span>
                    </div>
                  ) : libraryFiles.personal.length === 0 ? (
                    <div className="py-2 text-sm text-gray-500">暂无文档</div>
                  ) : (
                    libraryFiles.personal.slice(0, 3).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleOpenDocument(doc)}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 transition-colors text-left"
                      >
                        <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{doc.filename}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)} • {formatDate(doc.upload_time)}</p>
                        </div>
                      </button>
                    ))
                  )}
                  {libraryFiles.personal.length > 3 && (
                    <div className="text-xs text-gray-500 py-1">
                      还有 {libraryFiles.personal.length - 3} 个文档...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 共享知识库按钮 */}
            <div className="space-y-1">
              <button
                onClick={() => handleLibraryClick('shared')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  expandedLibrary === 'shared'
                    ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`${expandedLibrary === 'shared' ? 'text-green-600' : 'text-gray-400'} transition-colors duration-200`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </span>
                  <span className="font-medium">共享知识库</span>
                </div>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${expandedLibrary === 'shared' ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 共享知识库文档列表 */}
              {expandedLibrary === 'shared' && (
                <div className="ml-4 pl-4 border-l-2 border-green-100 space-y-2">
                  {isLoadingLibrary ? (
                    <div className="flex items-center space-x-2 py-2 text-sm text-gray-500">
                      <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>加载中...</span>
                    </div>
                  ) : libraryFiles.shared.length === 0 ? (
                    <div className="py-2 text-sm text-gray-500">暂无文档</div>
                  ) : (
                    libraryFiles.shared.slice(0, 3).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleOpenDocument(doc)}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50 transition-colors text-left"
                      >
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">{doc.filename}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(doc.file_size)} • {formatDate(doc.upload_time)}</p>
                        </div>
                      </button>
                    ))
                  )}
                  {libraryFiles.shared.length > 3 && (
                    <div className="text-xs text-gray-500 py-1">
                      还有 {libraryFiles.shared.length - 3} 个文档...
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,.txt,.pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Processing indicator */}
      {isProcessing && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">正在处理文档...</span>
          </div>
        </div>
      )}
    </div>
  );
} 