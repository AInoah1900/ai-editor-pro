import React, { useRef, useState } from 'react';
import mammoth from 'mammoth';

interface SubMenuProps {
  activeMenu: string;
  activeSubMenu: string;
  setActiveSubMenu: (subMenu: string) => void;
  setUploadedDocument: (content: string | null) => void;
}

export default function SubMenu({ activeMenu, activeSubMenu, setActiveSubMenu, setUploadedDocument }: SubMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const menuConfig = {
    'ai-editor': [
      {
        id: 'upload',
        name: '上传WORD文档',
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
      },
      {
        id: 'personal',
        name: '专属知识库',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      },
      {
        id: 'shared',
        name: '共享知识库',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      
      try {
        const fileExtension = file.name.toLowerCase().split('.').pop();
        let content = '';

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
            alert('暂不支持 .doc 格式，请将文档另存为 .docx 格式后重新上传');
            setIsProcessing(false);
            return;

          case 'txt':
            // 处理纯文本文件
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

        // 成功处理文档
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

  const handleKnowledgeUpload = (type: 'personal' | 'shared') => {
    // 这里可以添加知识库文档上传逻辑
    fileInputRef.current?.click();
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
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
      <div className="flex-1 p-4 space-y-1">
        {currentMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'upload') {
                handleUploadClick();
              } else if (item.id === 'personal' || item.id === 'shared') {
                setActiveSubMenu(item.id);
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

        {/* 知识库特殊功能 */}
        {activeMenu === 'knowledge-base' && (activeSubMenu === 'personal' || activeSubMenu === 'shared') && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">
                {activeSubMenu === 'personal' ? '专属文档' : '共享文档'}
              </h3>
              <button
                onClick={() => handleKnowledgeUpload(activeSubMenu as 'personal' | 'shared')}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>新增知识库</span>
              </button>
            </div>
            
            {/* 文档列表 */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">学术论文.docx</p>
                  <p className="text-xs text-gray-500">2024-01-15 14:30</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">已处理</span>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">技术报告.pdf</p>
                  <p className="text-xs text-gray-500">2024-01-14 09:15</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">处理中</span>
              </div>
            </div>
            
            {/* 分页 */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <span className="text-xs text-gray-500">共 2 个文档</span>
              <div className="flex space-x-1">
                <button className="w-6 h-6 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled>
                  ‹
                </button>
                <button className="w-6 h-6 text-xs bg-blue-600 text-white rounded">1</button>
                <button className="w-6 h-6 text-xs text-gray-400 hover:text-gray-600">
                  ›
                </button>
              </div>
            </div>
          </div>
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