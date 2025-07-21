'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

interface User {
  id: string;
  username: string;
  nickname: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role_name: string;
  role_display_name: string;
  permissions: string[];
  publisher_name?: string;
  publisher_website?: string;
  journal_domain?: string;
  email_verified: boolean;
  phone_verified: boolean;
  last_login_at: string;
  created_at: string;
  profile?: {
    bio?: string;
    preferences: Record<string, any>;
    notification_settings: Record<string, boolean>;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'profile'>('login');
  const [error, setError] = useState('');

  // 检查登录状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const result = await response.json();
        if (result.success) {
          setUser(result.user);
          setActiveTab('profile');
        } else {
          // Token无效，清除本地存储
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_info');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setError('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (userData: User) => {
    setUser(userData);
    setActiveTab('profile');
  };

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
      // 清除本地存储
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      setUser(null);
      setActiveTab('login');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const getPermissionDisplayName = (permission: string) => {
    const permissionMap: Record<string, string> = {
      'document:create': '创建文档',
      'document:read': '查看文档',
      'document:update': '编辑文档',
      'document:delete': '删除文档',
      'document:read_own': '查看自己的文档',
      'document:update_own': '编辑自己的文档',
      'document:delete_own': '删除自己的文档',
      'knowledge:read': '查看知识库',
      'knowledge:create': '创建知识库',
      'review:create': '创建审核',
      'review:update': '更新审核',
      'user:read': '查看用户信息',
      'user:update': '更新用户信息',
      'analytics:read': '查看分析报告',
      'settings:update': '更新系统设置',
      'comment:create': '创建评论',
      '*': '所有权限',
      'document:*': '所有文档权限',
      'knowledge:*': '所有知识库权限',
      'review:*': '所有审核权限',
      'admin:*': '管理员权限'
    };
    return permissionMap[permission] || permission;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">个人中心</h1>
          <p className="mt-2 text-gray-600">
            {user ? `欢迎回来，${user.nickname}` : '请登录或注册您的账户'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* 未登录状态 - 显示登录/注册选项卡 */}
        {!user && (
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'login'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  登录
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'register'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  注册
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'login' && (
                <LoginForm 
                  onSuccess={handleLoginSuccess} 
                  className="max-w-md mx-auto"
                />
              )}
              {activeTab === 'register' && (
                <RegisterForm 
                  onSuccess={() => setActiveTab('login')}
                  className="max-w-2xl mx-auto"
                />
              )}
            </div>
          </div>
        )}

        {/* 已登录状态 - 显示用户信息 */}
        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 用户信息卡片 */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                  {user.avatar_url ? (
                    <img
                      className="mx-auto h-24 w-24 rounded-full"
                      src={user.avatar_url}
                      alt={user.nickname}
                    />
                  ) : (
                    <div className="mx-auto h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-600">
                        {user.nickname.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h3 className="mt-4 text-lg font-medium text-gray-900">{user.nickname}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user.role_display_name}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {user.email}
                    {user.email_verified && (
                      <span className="ml-2 text-green-500">✓</span>
                    )}
                  </div>
                  {user.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      {user.phone}
                      {user.phone_verified && (
                        <span className="ml-2 text-green-500">✓</span>
                      )}
                    </div>
                  )}
                  {user.journal_domain && (
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1zm-1 4a1 1 0 100-2H8a1 1 0 100 2h4z" clipRule="evenodd" />
                      </svg>
                      {user.journal_domain}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleLogout}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    退出登录
                  </button>
                </div>
              </div>
            </div>

            {/* 详细信息区域 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 出版社信息 */}
              {(user.publisher_name || user.publisher_website) && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">出版社信息</h3>
                  <div className="space-y-3">
                    {user.publisher_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">出版社名称</dt>
                        <dd className="text-sm text-gray-900">{user.publisher_name}</dd>
                      </div>
                    )}
                    {user.publisher_website && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">官方网站</dt>
                        <dd className="text-sm text-gray-900">
                          <a href={user.publisher_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500">
                            {user.publisher_website}
                          </a>
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 权限信息 */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">权限信息</h3>
                <div className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">当前角色</dt>
                    <dd className="text-sm text-gray-900">{user.role_display_name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">拥有权限</dt>
                    <dd className="text-sm text-gray-900">
                      <div className="flex flex-wrap gap-2 mt-1">
                        {user.permissions.map((permission, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                          >
                            {getPermissionDisplayName(permission)}
                          </span>
                        ))}
                      </div>
                    </dd>
                  </div>
                </div>
              </div>

              {/* 账户统计 */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">账户统计</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">注册时间</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {formatDate(user.created_at)}
                    </dd>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">最后登录</dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {user.last_login_at ? formatDate(user.last_login_at) : '首次登录'}
                    </dd>
                  </div>
                </div>
              </div>

              {/* 个人简介 */}
              {user.profile?.bio && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">个人简介</h3>
                  <p className="text-sm text-gray-600">{user.profile.bio}</p>
                </div>
              )}

              {/* 快速操作 */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">快速操作</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push('/editor')}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                    </svg>
                    文档编辑器
                  </button>
                  <button
                    onClick={() => router.push('/knowledge-admin')}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    知识库管理
                  </button>
                  <button
                    onClick={() => router.push('/deepseek-config')}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    系统配置
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 