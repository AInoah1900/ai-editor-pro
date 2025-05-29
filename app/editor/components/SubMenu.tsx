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
    'cloud-knowledge': [
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
        id: 'browse',
        name: '浏览分类',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      }
    ],
    'local-knowledge': [
      {
        id: 'manage',
        name: '管理知识库',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      },
      {
        id: 'import',
        name: '导入文档',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
        setActiveSubMenu('editor');
        
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

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {activeMenu === 'ai-editor' && 'AI编辑加工'}
          {activeMenu === 'cloud-knowledge' && '云知识库'}
          {activeMenu === 'local-knowledge' && '本地知识库'}
          {activeMenu === 'profile' && '个人中心'}
        </h2>
      </div>

      {/* Menu Items */}
      <div className="flex-1 p-4 space-y-2">
        {currentMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => item.id === 'upload' ? handleUploadClick() : setActiveSubMenu(item.id)}
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
              activeSubMenu === item.id
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className={activeSubMenu === item.id ? 'text-blue-600' : 'text-gray-400'}>
              {item.icon}
            </span>
            <span className="font-medium">{item.name}</span>
          </button>
        ))}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span>{isProcessing ? '处理文档中...' : 'AI服务正常'}</span>
          </div>
          <div className="text-xs">
            DeepSeek API 已连接
          </div>
        </div>
      </div>
    </div>
  );
} 