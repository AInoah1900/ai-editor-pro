'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

interface RegisterFormProps {
  onSuccess?: (user: any) => void;
  redirectTo?: string;
  className?: string;
}

export default function RegisterForm({ onSuccess, redirectTo, className = '' }: RegisterFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role_id: '',
    publisher_name: '',
    publisher_website: '',
    publisher_submission_template: '',
    journal_domain: ''
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [showPublisherFields, setShowPublisherFields] = useState(false);

  // 获取角色列表
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch('/api/auth/roles');
        const result = await response.json();
        if (result.success) {
          setRoles(result.roles);
        }
      } catch (error) {
        console.error('获取角色列表失败:', error);
      }
    };

    fetchRoles();
  }, []);

  // 监听角色变化，决定是否显示出版社字段
  useEffect(() => {
    const selectedRole = roles.find(role => role.id === formData.role_id);
    setShowPublisherFields(
      selectedRole?.name === 'editor' || 
      selectedRole?.name === 'chief_editor'
    );
  }, [formData.role_id, roles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors([]);

    // 验证密码确认
    if (formData.password !== formData.confirmPassword) {
      setError('密码确认不匹配');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.user);
        } else {
          // 注册成功后跳转到登录页面或指定页面
          router.push('/auth/login?message=注册成功，请登录');
        }
      } else {
        if (result.details && Array.isArray(result.details)) {
          setErrors(result.details);
        } else {
          setError(result.error || '注册失败');
        }
      }
    } catch (error) {
      console.error('注册错误:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 这里应该实现文件上传逻辑，暂时只存储文件名
      setFormData(prev => ({
        ...prev,
        publisher_submission_template: file.name
      }));
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">用户注册</h2>
          <p className="text-gray-600 mt-2">创建您的AI编辑器账户</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <ul className="list-disc list-inside">
              {errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基础信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                用户名 *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="username"
                name="username"
                type="text"
                placeholder="请输入用户名"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nickname">
                昵称 *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="nickname"
                name="nickname"
                type="text"
                placeholder="请输入昵称"
                value={formData.nickname}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                邮箱地址 *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="email"
                name="email"
                type="email"
                placeholder="请输入邮箱地址"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                手机号码
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="phone"
                name="phone"
                type="tel"
                placeholder="请输入手机号码"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                密码 *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="password"
                name="password"
                type="password"
                placeholder="至少8位，包含大小写字母、数字和特殊字符"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                确认密码 *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role_id">
                用户角色 *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="role_id"
                name="role_id"
                value={formData.role_id}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">请选择角色</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="journal_domain">
                期刊领域
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="journal_domain"
                name="journal_domain"
                type="text"
                placeholder="如：医学、工程、文学等"
                value={formData.journal_domain}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* 出版社信息（仅编辑和主编显示） */}
          {showPublisherFields && (
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">出版社信息</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="publisher_name">
                    出版社名称
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="publisher_name"
                    name="publisher_name"
                    type="text"
                    placeholder="请输入出版社名称"
                    value={formData.publisher_name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="publisher_website">
                    出版社官网
                  </label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="publisher_website"
                    name="publisher_website"
                    type="url"
                    placeholder="https://..."
                    value={formData.publisher_website}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="submission_template">
                  投稿要求模板
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id="submission_template"
                  name="submission_template"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                <p className="text-sm text-gray-500 mt-1">
                  支持PDF、Word文档格式，用于AI编辑参考
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              className={`w-full font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-700 text-white'
              }`}
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  注册中...
                </span>
              ) : (
                '注册账户'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            已有账户？{' '}
            <a href="#login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </a>
          </p>
        </div>

        {/* 角色说明 */}
        {roles.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h4 className="font-semibold text-gray-900 mb-2">角色说明：</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {roles.map(role => (
                <li key={role.id}>
                  <strong>{role.display_name}：</strong>{role.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 