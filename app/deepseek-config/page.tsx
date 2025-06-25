import DeepSeekConfigPanel from '@/app/components/DeepSeekConfigPanel';

export default function DeepSeekConfigPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🤖 DeepSeek API 配置中心
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            管理您的DeepSeek API配置，在云端API和本地API之间灵活切换，
            确保AI编辑器始终以最佳状态为您提供服务。
          </p>
        </div>
        
        <DeepSeekConfigPanel />
        
        <div className="mt-8 text-center">
          <div className="inline-flex gap-4">
            <a
              href="/editor"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              返回编辑器
            </a>
            <a
              href="/knowledge-admin"
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              知识库管理
            </a>
            <a
              href="/"
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 