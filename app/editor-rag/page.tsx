'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RAGEnhancedEditor from '../editor/components/RAGEnhancedEditor';

function RAGEditorContent() {
  const [content, setContent] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    // 从URL参数获取内容
    const urlContent = searchParams.get('content');
    if (urlContent) {
      setContent(decodeURIComponent(urlContent));
    } else {
      // 默认内容
      setContent(`基于超音速数值仿真下多脉冲约束弹体的修正策略研究研究综述

本文针对超音速环境下的多脉冲约束弹体控制问题进行了深入研究研究。通过数值仿真分析，我们发现现有的控制策略存在一些问题。

研究方法采用了计算流体力学（CFD）方法，建立了完整的数学模型。实验结果表明，新提出的修正策略能够有效改善弹体的稳定性？。同时也验证了方法的可行性？。

本研究的主要贡献包括：1）提出了创新的多脉冲控制算法；2）建立了精确的数值仿真平台；3）验证了方法在实际应用中的效果。

通过大量的的仿真试验，我们证明了该方法的优越性。未来的研究工作将进一步优化算法，提高控制精度。`);
    }
  }, [searchParams]);

  return (
    <div className="h-screen bg-gray-100">
      <RAGEnhancedEditor content={content} />
    </div>
  );
}

export default function RAGEditorPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载RAG增强编辑器...</p>
        </div>
      </div>
    }>
      <RAGEditorContent />
    </Suspense>
  );
} 