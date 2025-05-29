import Link from "next/link";
import FeatureCard from "./components/FeatureCard";
import AnimatedCounter from "./components/AnimatedCounter";
import MobileMenu from "./components/MobileMenu";
import PricingCard from "./components/PricingCard";

export default function Home() {
  const features = [
    {
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "智能校对系统",
      description: "自动检测政治性错误、文字错误、专业术语，支持79个专业领域词库，8000万条专业词汇。",
      features: ["政治敏感内容检测", "错别字智能识别", "专业术语校验", "标点符号规范"],
      gradient: "bg-gradient-to-br from-blue-50 to-indigo-50"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      title: "内容优化服务",
      description: "提供多种写作风格润色，智能分析可读性，确保期刊文章风格统一和学术规范。",
      features: ["学术风格润色", "可读性分析", "语言风格统一", "引用格式规范"],
      gradient: "bg-gradient-to-br from-purple-50 to-pink-50"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: "质量管控",
      description: "支持三审三校流程，批量处理稿件，提供详细质量报告和版本对比功能。",
      features: ["三审三校流程", "批量处理能力", "质量分析报告", "版本差异对比"],
      gradient: "bg-gradient-to-br from-green-50 to-emerald-50"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
      ),
      title: "多语言支持",
      description: "专业的中英文校对服务，高质量学术翻译，建立专业术语对照库。",
      features: ["中英文语法检查", "学术文献翻译", "术语对照库", "多语言拼写检查"],
      gradient: "bg-gradient-to-br from-orange-50 to-red-50"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "高效处理",
      description: "10万字稿件3分钟完成校对，大幅提升编辑效率，节省人力成本。",
      features: ["超快处理速度", "批量文档处理", "实时协作编辑", "云端同步保存"],
      gradient: "bg-gradient-to-br from-teal-50 to-cyan-50"
    },
    {
      icon: (
        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "安全可靠",
      description: "企业级安全保障，数据加密传输，严格的隐私保护机制，确保文档安全。",
      features: ["端到端加密", "权限精细控制", "隐私保护机制", "安全审计日志"],
      gradient: "bg-gradient-to-br from-indigo-50 to-blue-50"
    }
  ];

  const pricingPlans = [
    {
      title: "基础版",
      price: "¥299",
      period: "/月",
      description: "适合小型期刊编辑部和个人用户",
      features: [
        "每月处理10万字",
        "基础智能校对",
        "标准格式检查",
        "邮件技术支持",
        "基础数据报告",
        "单用户授权"
      ],
      buttonText: "开始免费试用",
      buttonVariant: "secondary" as const
    },
    {
      title: "专业版",
      price: "¥899",
      period: "/月",
      description: "适合中型出版社和学术机构",
      features: [
        "每月处理50万字",
        "高级AI校对系统",
        "专业术语库",
        "多语言翻译",
        "实时协作编辑",
        "优先技术支持",
        "详细质量报告",
        "5用户授权"
      ],
      isPopular: true,
      buttonText: "立即订阅",
      buttonVariant: "primary" as const
    },
    {
      title: "企业版",
      price: "¥2999",
      period: "/月",
      description: "适合大型出版集团和科研院所",
      features: [
        "无限字数处理",
        "全功能AI编辑套件",
        "自定义专业词库",
        "API接口集成",
        "私有化部署选项",
        "专属客户经理",
        "7×24小时支持",
        "无限用户授权",
        "定制化开发"
      ],
      buttonText: "联系销售",
      buttonVariant: "secondary" as const
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Editor Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">功能特色</Link>
              <Link href="#solutions" className="text-gray-600 hover:text-gray-900 transition-colors">解决方案</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">价格方案</Link>
              <Link href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">联系我们</Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 transition-colors">登录</button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors btn-primary">
                免费试用
              </button>
            </div>
            <MobileMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              智能AI编辑
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                重新定义
              </span>
              期刊出版
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              专为期刊出版社打造的AI编辑加工平台，集成智能校对、内容优化、质量管控于一体，
              让学术出版更智能、更高效、更专业。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/editor" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg btn-primary">
                立即开始免费试用
              </Link>
              <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-50 transition-colors group">
                <span className="flex items-center">
                  观看产品演示
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-10V7a3 3 0 11-6 0V4a3 3 0 016 0v3zm-6 0V7a3 3 0 11-6 0V4a3 3 0 016 0v3z" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
          
          {/* Hero Image/Demo */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-500 ml-4">AI Editor Pro - 智能编辑界面</span>
                </div>
                <div className="bg-white rounded-lg p-6 min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">智能校对演示</h3>
                    <p className="text-gray-600">AI正在分析您的文档...</p>
                    <div className="mt-4 bg-gray-100 rounded-lg p-4 text-left">
                      <div className="text-sm text-gray-700 mb-2">检测到以下问题：</div>
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span className="text-red-600">错别字：3处</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                          <span className="text-yellow-600">语法问题：1处</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span className="text-green-600">格式规范：已优化</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              强大的AI编辑能力
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              基于先进的自然语言处理技术，为期刊出版社提供全方位的智能编辑解决方案
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                features={feature.features}
                gradient={feature.gradient}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              值得信赖的数据表现
            </h2>
            <p className="text-xl text-blue-100">
              已为众多期刊出版社提供专业的AI编辑服务
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <AnimatedCounter end={98} suffix="%" />
              <div className="text-blue-100">出版社选择</div>
            </div>
            <div className="text-center">
              <AnimatedCounter end={100000} suffix="+" />
              <div className="text-blue-100">处理文档数</div>
            </div>
            <div className="text-center">
              <AnimatedCounter end={99.9} suffix="%" />
              <div className="text-blue-100">准确率</div>
            </div>
            <div className="text-center">
              <AnimatedCounter end={3} suffix="分钟" />
              <div className="text-blue-100">10万字处理</div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              针对性解决方案
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              为不同类型的期刊出版机构提供定制化的AI编辑解决方案
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">学术期刊编辑部</h3>
              <p className="text-gray-600 mb-4">
                专为学术期刊编辑部设计的全流程编辑解决方案，支持从稿件初审到终审的完整工作流程。
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• 稿件智能初审</li>
                <li>• 专业术语校验</li>
                <li>• 学术格式规范</li>
                <li>• 同行评议辅助</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">大型出版社</h3>
              <p className="text-gray-600 mb-4">
                为大型出版社提供企业级的AI编辑平台，支持多品牌、多期刊的统一管理和批量处理。
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• 多期刊统一管理</li>
                <li>• 批量文档处理</li>
                <li>• 质量标准统一</li>
                <li>• 数据分析报告</li>
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">高校科研机构</h3>
              <p className="text-gray-600 mb-4">
                为高校和科研机构提供专业的学术出版支持，助力科研成果的高质量发表。
              </p>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>• 科研论文润色</li>
                <li>• 国际期刊投稿</li>
                <li>• 多语言翻译</li>
                <li>• 学术写作指导</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              灵活的价格方案
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              根据您的需求选择合适的方案，所有方案都包含30天免费试用
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <PricingCard
                key={index}
                title={plan.title}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                features={plan.features}
                isPopular={plan.isPopular}
                buttonText={plan.buttonText}
                buttonVariant={plan.buttonVariant}
              />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              需要更多定制化功能？
            </p>
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              联系我们获取企业定制方案 →
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            准备开始您的智能编辑之旅？
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            立即体验AI Editor Pro，让您的期刊出版工作更加高效专业
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/editor" className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg btn-primary">
              免费试用30天
            </Link>
            <button className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-50 transition-colors">
              联系销售团队
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-xl font-semibold">Editor Pro</span>
              </div>
              <p className="text-gray-400 mb-4">
                专为期刊出版社打造的智能AI编辑加工平台
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">产品功能</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">智能校对</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">内容优化</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">质量管控</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">多语言支持</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">解决方案</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">期刊编辑部</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">出版社</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">学术机构</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">企业定制</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">联系我们</h3>
              <ul className="space-y-2 text-gray-400">
                <li>技术支持: support@aieditorpro.com</li>
                <li>商务合作: business@aieditorpro.com</li>
                <li>客服热线: 400-888-0000</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AI Editor Pro. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
