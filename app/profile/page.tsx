'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  nickname: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role_display_name: string;
  publisher_name?: string;
  publisher_website?: string;
  journal_domain?: string;
  created_at?: string;
  last_login?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // 检查登录状态
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userInfo = localStorage.getItem('user_info');
        
        if (token && userInfo) {
          const userData = JSON.parse(userInfo);
          setUser(userData);
          setIsLoggedIn(true);
        } else {
          // 尝试从API获取用户信息
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsLoggedIn(true);
            localStorage.setItem('user_info', JSON.stringify(userData));
          }
        }
      } catch (error) {
        console.error('检查登录状态失败:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  // 登出功能
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      setUser(null);
      setIsLoggedIn(false);
    }
  };

  // 模拟用户数据（用于演示）
  const demoUser = {
    id: '1',
    username: '赵编辑',
    nickname: 'AI智能小编',
    email: 'lxxc521@163.com',
    phone: '023-68852703',
    role_display_name: '编辑',
    publisher_name: '兵器装备工程学报',
    publisher_website: 'https://bzxb.cqut.edu.cn/default.aspx',
    journal_domain: '兵器科学与技术',
    created_at: '2025/7/20 10:38:41',
    last_login: '首次登录'
  };

  // 用户权限列表
  const userPermissions = [
    { name: '创建文档', color: 'bg-green-100 text-green-800' },
    { name: '查看文档', color: 'bg-blue-100 text-blue-800' },
    { name: '编辑文档', color: 'bg-purple-100 text-purple-800' },
    { name: '删除文档', color: 'bg-red-100 text-red-800' },
    { name: '查看知识库', color: 'bg-yellow-100 text-yellow-800' },
    { name: '创建知识库', color: 'bg-indigo-100 text-indigo-800' },
    { name: '创建审核', color: 'bg-pink-100 text-pink-800' },
    { name: '更新审核', color: 'bg-teal-100 text-teal-800' }
  ];

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // 显示用户（使用演示数据或实际数据）
  const displayUser = user || demoUser;
  const showDemoData = !user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">AI Editor Pro</span>
              </Link>
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-gray-600">欢迎回来，AI智能小编</span>
              <Link href="/editor" className="text-gray-600 hover:text-gray-900 transition-colors">
                编辑器
              </Link>
              <Link href="/knowledge-admin" className="text-gray-600 hover:text-gray-900 transition-colors">
                知识库
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <div className="max-w-[1700px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {showDemoData && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800 text-sm">演示模式 - 显示的是示例用户数据，实际使用时将显示您的真实信息</span>
            </div>
          </div>
        )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 左侧用户信息卡片 */}
          <div className="lg:col-span-1">
             <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center mb-6">
                {/* 用户头像 */}
                <div className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-white">
                    {displayUser.nickname?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                
                {/* 用户基本信息 */}
                <h2 className="text-xl font-bold text-gray-900 mb-1">{displayUser.nickname}</h2>
                <p className="text-gray-600 text-sm mb-3">@{displayUser.username}</p>
                
                {/* 角色标签 */}
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {displayUser.role_display_name}
                </span>
              </div>

              {/* 联系信息 */}
              <div className="space-y-4 mb-6">
                {displayUser.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{displayUser.email}</span>
                  </div>
                )}
                
                {displayUser.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{displayUser.phone}</span>
                  </div>
                )}
                
                {displayUser.journal_domain && (
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{displayUser.journal_domain}</span>
                  </div>
                )}
              </div>

              {/* 退出登录按钮 */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                退出登录
              </button>
            </div>
          </div>

          {/* 右侧内容区域 */}
          <div className="lg:col-span-3 space-y-5">
                        {/* 出版社信息 */}
            {displayUser.publisher_name && (
              <div className="w-3/4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">出版社信息</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">出版社名称</label>
                      <p className="text-gray-900">{displayUser.publisher_name}</p>
                    </div>
                    {displayUser.publisher_website && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">官方网站</label>
                        <a 
                          href={displayUser.publisher_website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {displayUser.publisher_website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 权限信息 */}
            <div className="w-3/4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">权限信息</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">当前角色</label>
                    <p className="text-gray-900">{displayUser.role_display_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-3">拥有权限</label>
                    <div className="flex flex-wrap gap-2">
                      {userPermissions.map((permission, index) => (
                        <span 
                          key={index}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${permission.color}`}
                        >
                          {permission.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 账户统计区域 */}
            <div className="w-3/4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">账户统计</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600 mb-2">注册时间</label>
                    <p className="text-lg font-semibold text-gray-900">{displayUser.created_at || '2025/7/20 10:38:41'}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600 mb-2">最后登录</label>
                    <p className="text-lg font-semibold text-gray-900">{displayUser.last_login || '首次登录'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 快捷操作区域 */}
            <div className="w-3/4">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">快捷操作</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link 
                    href="/editor" 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group flex items-center justify-center"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">文档编辑器</span>
                    </div>
                  </Link>

                  <Link 
                    href="/knowledge-admin" 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group flex items-center justify-center"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">知识库管理</span>
                    </div>
                  </Link>

                  <Link 
                    href="/deepseek-config" 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group flex items-center justify-center"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">系统配置</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 