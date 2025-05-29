'use client';

import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import SubMenu from './components/SubMenu';
import WorkArea from './components/WorkArea';

export default function EditorPage() {
  const [activeMenu, setActiveMenu] = useState('ai-editor');
  const [activeSubMenu, setActiveSubMenu] = useState('upload');
  const [uploadedDocument, setUploadedDocument] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 主菜单栏 */}
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu}
        setActiveSubMenu={setActiveSubMenu}
      />
      
      {/* 子菜单栏 */}
      <SubMenu 
        activeMenu={activeMenu}
        activeSubMenu={activeSubMenu}
        setActiveSubMenu={setActiveSubMenu}
        setUploadedDocument={setUploadedDocument}
      />
      
      {/* 工作区 */}
      <WorkArea 
        activeSubMenu={activeSubMenu}
        uploadedDocument={uploadedDocument}
        setUploadedDocument={setUploadedDocument}
        setActiveSubMenu={setActiveSubMenu}
      />
    </div>
  );
} 