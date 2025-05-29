'use client';

import React from 'react';
import DocumentEditor from './DocumentEditor';
import UploadArea from './UploadArea';

interface WorkAreaProps {
  activeSubMenu: string;
  uploadedDocument: string | null;
  setUploadedDocument: (content: string | null) => void;
  setActiveSubMenu?: (subMenu: string) => void;
}

export default function WorkArea({ activeSubMenu, uploadedDocument, setUploadedDocument, setActiveSubMenu }: WorkAreaProps) {
  const handleFileUpload = (content: string) => {
    setUploadedDocument(content);
  };

  const handleSwitchToEditor = () => {
    if (setActiveSubMenu) {
      setActiveSubMenu('editor');
    }
  };

  const renderContent = () => {
    switch (activeSubMenu) {
      case 'upload':
        return (
          <UploadArea 
            onFileUpload={handleFileUpload}
            onSwitchToEditor={handleSwitchToEditor}
          />
        );
      
      case 'editor':
        return uploadedDocument ? (
          <DocumentEditor 
            content={uploadedDocument}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有文档</h3>
              <p className="text-gray-500">请先上传一个文档开始编辑</p>
            </div>
          </div>
        );
      
      case 'download':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">下载文档</h3>
              <p className="text-gray-500 mb-4">导出已编辑的文档</p>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                下载 DOCX 文件
              </button>
            </div>
          </div>
        );
      
      case 'history':
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">编辑历史</h3>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">学术论文.docx</h4>
                    <p className="text-sm text-gray-500">2024年1月15日 14:30</p>
                  </div>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">已完成</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">选择功能</h3>
              <p className="text-gray-500">请从左侧菜单选择要使用的功能</p>
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