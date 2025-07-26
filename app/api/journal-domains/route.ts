import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '@/lib/database/models';

/**
 * 获取期刊领域列表API
 * GET /api/journal-domains
 */
export async function GET(request: NextRequest) {
  console.log('📚 处理期刊领域API请求...');
  
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'full';
    
    console.log(`📋 请求格式: ${format}`);
    
    // 初始化数据库模型
    const dbModels = new DatabaseModels();
    
    // 获取所有期刊领域
    const domains = await dbModels.getAllJournalDomains();
    console.log(`✅ 成功获取 ${domains.length} 个期刊领域`);
    
    if (format === 'simple') {
      // 简化格式，仅返回必要字段
      const simpleDomains = domains.map(domain => ({
        code: domain.code,
        name: domain.name,
        category_name: domain.category_name
      }));
      
      return NextResponse.json({
        success: true,
        message: `成功获取 ${simpleDomains.length} 个期刊领域`,
        data: {
          domains: simpleDomains,
          total: simpleDomains.length
        }
      });
    }
    
    if (format === 'grouped') {
      // 按类别分组
      const grouped: Record<string, any[]> = {};
      domains.forEach(domain => {
        if (!grouped[domain.category]) {
          grouped[domain.category] = [];
        }
        grouped[domain.category].push(domain);
      });
      
      return NextResponse.json({
        success: true,
        message: `成功获取 ${domains.length} 个期刊领域，分为 ${Object.keys(grouped).length} 个类别`,
        data: {
          domains: grouped,
          total: domains.length,
          categories: Object.keys(grouped).length
        }
      });
    }
    
    // 完整格式，返回所有字段
    return NextResponse.json({
      success: true,
      message: `成功获取 ${domains.length} 个期刊领域`,
      data: {
        domains,
        total: domains.length,
        statistics: {
          categories: [...new Set(domains.map(d => d.category))].length,
          active_domains: domains.filter(d => d.is_active).length
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 获取期刊领域失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '获取期刊领域失败',
      details: error instanceof Error ? error.message : String(error),
      data: {
        domains: [],
        total: 0
      }
    }, { status: 500 });
  }
}

/**
 * 健康检查
 * HEAD /api/journal-domains
 */
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'application/json'
    }
  });
} 