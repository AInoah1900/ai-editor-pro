import { NextRequest, NextResponse } from 'next/server';
import { NewKnowledgeRetriever } from '@/lib/rag/new-knowledge-retriever';

/**
 * 知识库管理API - 使用新的 Qdrant + PostgreSQL 方案
 */

// GET: 获取知识库统计信息或搜索知识库
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    const retriever = new NewKnowledgeRetriever();
    
    // 如果有查询参数，执行搜索
    if (query) {
      const domain = searchParams.get('domain') || undefined;
      const type = searchParams.get('type') || undefined;
      const limit = parseInt(searchParams.get('limit') || '10');
      const includeDocuments = searchParams.get('includeDocuments') === 'true';
      
      console.log('执行知识库搜索:', { query, domain, type, limit, includeDocuments });
      
      if (includeDocuments) {
        // 综合搜索：返回知识项和相关文档
        const searchResults = await retriever.comprehensiveSearch(
          query,
          domain,
          type,
          limit,
          limit
        );
        
        return NextResponse.json({
          success: true,
          data: {
            knowledge: searchResults.knowledge,
            documents: searchResults.documents
          },
          query: {
            text: query,
            domain,
            type,
            limit,
            includeDocuments
          }
        });
      } else {
        // 只返回知识项
        const searchResults = await retriever.retrieveRelevantKnowledge(
          query,
          domain,
          type,
          limit
        );
        
        return NextResponse.json({
          success: true,
          data: searchResults,
          query: {
            text: query,
            domain,
            type,
            limit
          }
        });
      }
    }
    
    // 否则返回统计信息
    const stats = await retriever.getKnowledgeStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('知识库操作失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '知识库操作失败'
    }, { status: 500 });
  }
}

// POST: 添加知识项或初始化知识库
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, knowledge } = body;
    
    const retriever = new NewKnowledgeRetriever();
    
    if (action === 'initialize') {
      // 初始化知识库
      await retriever.initializeKnowledgeBase();
      const stats = await retriever.getKnowledgeStats();
      
      return NextResponse.json({
        success: true,
        message: '知识库初始化完成',
        data: stats
      });
    }
    
    if (action === 'add' && knowledge) {
      // 添加单个知识项
      const knowledgeItem = {
        id: knowledge.id || `custom_${Date.now()}`,
        type: knowledge.type || 'terminology',
        domain: knowledge.domain || 'general',
        content: knowledge.content,
        context: knowledge.context || '',
        source: knowledge.source || '用户添加',
        confidence: knowledge.confidence || 0.8,
        tags: knowledge.tags || []
      };
      
      await retriever.addKnowledgeItem(knowledgeItem);
      
      return NextResponse.json({
        success: true,
        message: '知识项添加成功',
        data: knowledgeItem
      });
    }
    
    return NextResponse.json({
      success: false,
      error: '无效的操作类型'
    }, { status: 400 });
    
  } catch (error) {
    console.error('知识库操作失败:', error);
    return NextResponse.json({
      success: false,
      error: '知识库操作失败'
    }, { status: 500 });
  }
}

// PUT: 学习用户反馈
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { original, suggestion, feedback, domain } = body;
    
    if (!original || !suggestion || !feedback || !domain) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }
    
    const retriever = new NewKnowledgeRetriever();
    await retriever.learnFromFeedback(original, suggestion, feedback, domain);
    
    return NextResponse.json({
      success: true,
      message: '用户反馈学习完成'
    });
    
  } catch (error) {
    console.error('用户反馈学习失败:', error);
    return NextResponse.json({
      success: false,
      error: '用户反馈学习失败'
    }, { status: 500 });
  }
}

// DELETE: 删除知识项
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少知识项ID'
      }, { status: 400 });
    }
    
    const retriever = new NewKnowledgeRetriever();
    await retriever.deleteKnowledgeItem(id);
    
    return NextResponse.json({
      success: true,
      message: '知识项删除成功'
    });
    
  } catch (error) {
    console.error('删除知识项失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除知识项失败'
    }, { status: 500 });
  }
} 