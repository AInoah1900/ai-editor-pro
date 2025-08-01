'use client';

import React, { useState } from 'react';
import RAGEnhancedEditor from '../editor/components/RAGEnhancedEditor';

/**
 * 简化的测试页面
 * 用于直接测试RAGEnhancedEditor组件是否能正确显示内容
 */
export default function TestEditorPage() {
  const [testContent, setTestContent] = useState('');
  const [forceRerender, setForceRerender] = useState(0);

  const testTexts = [
    '',
    '这是一个简单的测试文本。',
    '这是一个更长的测试文本，包含多行内容。\n\n第二段：这里是第二段的内容。\n\n第三段：这里是第三段的内容，用于测试文档显示是否正常。',
    '这是一个包含特殊字符的测试：\n- 项目1\n- 项目2\n- 项目3\n\n数字：1234567890\n符号：!@#$%^&*()'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">RAGEnhancedEditor 测试页面</h1>
        
        {/* 测试控制面板 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">测试控制</h2>
          <div className="space-y-2">
            {testTexts.map((text, index) => (
              <button
                key={index}
                onClick={() => setTestContent(text)}
                className="mr-2 mb-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                测试文本 {index === 0 ? '(空)' : index}
              </button>
            ))}
            <button
              onClick={() => setForceRerender(prev => prev + 1)}
              className="mr-2 mb-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              强制重新渲染
            </button>
          </div>
          
          <div className="mt-4">
            <textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="或者输入自定义测试内容..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div className="mt-2 text-sm text-gray-600">
            当前内容长度: {testContent.length} 字符
          </div>
        </div>

        {/* RAGEnhancedEditor 组件测试 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-4">RAGEnhancedEditor 组件</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <RAGEnhancedEditor key={forceRerender} content={testContent} />
          </div>
        </div>

        {/* 调试信息 */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="text-md font-semibold mb-2">调试信息</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <div>传递给组件的 content prop: "{testContent}"</div>
            <div>content 长度: {testContent.length}</div>
            <div>content 是否为空: {testContent.length === 0 ? '是' : '否'}</div>
            <div>content 是否为纯空白: {testContent.trim().length === 0 ? '是' : '否'}</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>📋 测试说明:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>点击测试文本按钮来测试不同的内容</li>
            <li>观察RAGEnhancedEditor组件是否正确显示内容</li>
            <li>检查浏览器控制台的调试日志</li>
            <li>如果这个页面能正常显示内容，说明组件本身没问题</li>
          </ul>
        </div>
      </div>
    </div>
  );
}