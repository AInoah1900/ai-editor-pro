'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  onSuccess?: (user: any) => void;
  redirectTo?: string;
  className?: string;
}

export default function LoginForm({ onSuccess, redirectTo, className = '' }: LoginFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember_me: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors([]);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        // 存储用户信息到localStorage
        localStorage.setItem('access_token', result.access_token);
        localStorage.setItem('refresh_token', result.refresh_token);
        localStorage.setItem('user_info', JSON.stringify(result.user));

        if (onSuccess) {
          onSuccess(result.user);
        } else if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/editor');
        }
      } else {
        if (result.details && Array.isArray(result.details)) {
          setErrors(result.details);
        } else {
          setError(result.error || '登录失败');
        }
      }
    } catch (error) {
      console.error('登录错误:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">用户登录</h2>
          <p className="text-gray-600 mt-2">登录到您的AI编辑器账户</p>
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

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
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

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              密码 *
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="password"
              name="password"
              type="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="remember_me"
                checked={formData.remember_me}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <span className="text-sm text-gray-700">记住我（30天免登录）</span>
            </label>
          </div>

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
                登录中...
              </span>
            ) : (
              '登录'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            还没有账户？{' '}
            <a href="#register" className="font-medium text-blue-600 hover:text-blue-500">
              立即注册
            </a>
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <a href="#forgot" className="font-medium text-blue-600 hover:text-blue-500">
              忘记密码？
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 