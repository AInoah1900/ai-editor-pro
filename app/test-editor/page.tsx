'use client';

import React, { useState } from 'react';
import QingCiStyleEditor from '../editor/components/QingCiStyleEditor';

interface ErrorItem {
  id: string;
  type: 'error' | 'warning' | 'suggestion';
  position: { start: number; end: number };
  original: string;
  suggestion: string;
  reason: string;
  category: string;
}

export default function TestEditorPage() {
  const [content, setContent] = useState(`基于超音速数值仿真的某弹体的修正策略研究

引言

这是是关于"引言"部分的详细内容。这部分将介绍人工超音速数值仿真技术下多脉冲的某弹体的修正策略研究的应用前景。

根据最新的研究表明，基于超音速数值仿真技术下多脉冲的某弹体的修正策略研究在领域被有了"这的应用前景。

重要发现：基于超音速数值仿真技术下多脉冲的某弹体的修正策略研究的研究表明，这一领域具有巨大的潜力和应用价值。

值得注意的是，这些研究成果对未来发展具有重要意义。

研究中的主要问题包括：

如何提高基于超音速数值仿真技术下多脉冲的某弹体全个章节中多个章节（如引言、研究背景、相关研究与文献综述、研究方法、研究结果、讨论、结论）内容高度重复率

如何降低基于超音速数值仿真技术下多脉冲的某弹体的修正策略研究的成本`);

  const [errors] = useState<ErrorItem[]>([
    {
      id: 'error1',
      type: 'error',
      position: { start: 26, end: 29 },
      original: '这是是',
      suggestion: '这是',
      reason: '重复词语',
      category: '语法错误'
    },
    {
      id: 'error2', 
      type: 'warning',
      position: { start: 49, end: 51 },
      original: '人工',
      suggestion: '基于',
      reason: '词语使用不当',
      category: '用词不当'
    },
    {
      id: 'error3',
      type: 'error',
      position: { start: 119, end: 125 },
      original: '在领域被有了',
      suggestion: '在该领域具有',
      reason: '语法错误',
      category: '语法错误'
    },
    {
      id: 'error4',
      type: 'suggestion',
      position: { start: 125, end: 127 },
      original: '"这',
      suggestion: '广阔',
      reason: '表达更准确',
      category: '表达优化'
    },
    {
      id: 'error5',
      type: 'warning',
      position: { start: 254, end: 256 },
      original: '全个',
      suggestion: '各个',
      reason: '用词不规范',
      category: '用词规范'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h1 className="text-2xl font-bold">智能编辑加工功能测试</h1>
            <p className="text-blue-100 mt-2">
              测试精确到字的下划线标记和弹窗交互功能
            </p>
          </div>
          
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">功能说明</h2>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <span className="text-red-600 font-medium">红色下划线</span>：确定错误</li>
                <li>• <span className="text-yellow-600 font-medium">黄色下划线</span>：疑似错误</li>
                <li>• <span className="text-green-600 font-medium">绿色下划线</span>：优化建议</li>
                <li>• 鼠标悬停在下划线文字上会显示弹窗，提供替换、编辑、忽略功能</li>
              </ul>
            </div>
            
            <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: '600px' }}>
              <QingCiStyleEditor
                content={content}
                errors={errors}
                onContentChange={setContent}
              />
            </div>
          </div>
          
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>当前错误数量: {errors.length}</span>
              <span>文档字符数: {content.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 