import React from 'react';
import Link from 'next/link';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  setActiveSubMenu: (subMenu: string) => void;
}

export default function Sidebar({ activeMenu, setActiveMenu, setActiveSubMenu }: SidebarProps) {
  const menuItems = [
    {
      id: 'ai-editor',
      name: 'AI编辑加工',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      defaultSubMenu: 'upload'
    },
    {
      id: 'cloud-knowledge',
      name: '云知识库',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      defaultSubMenu: 'search'
    },
    {
      id: 'local-knowledge',
      name: '本地知识库',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      defaultSubMenu: 'manage'
    },
    {
      id: 'profile',
      name: '个人登录',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      defaultSubMenu: 'login'
    }
  ];

  const handleMenuClick = (menuId: string, defaultSubMenu: string) => {
    setActiveMenu(menuId);
    setActiveSubMenu(defaultSubMenu);
  };

  return (
    <div className="w-16 bg-gray-900 text-white flex flex-col items-center py-4 space-y-4">
      {/* Logo */}
      <Link href="/" className="mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">AI</span>
        </div>
      </Link>

      {/* Menu Items */}
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleMenuClick(item.id, item.defaultSubMenu)}
          className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
            activeMenu === item.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700'
          }`}
          title={item.name}
        >
          {item.icon}
          
          {/* Tooltip */}
          <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {item.name}
          </div>
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Settings */}
      <button className="w-12 h-12 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-all duration-200 group relative">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        
        <div className="absolute left-16 bg-gray-800 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
          设置
        </div>
      </button>
    </div>
  );
} 