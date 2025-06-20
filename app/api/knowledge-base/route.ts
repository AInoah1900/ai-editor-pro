import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '@/lib/database/models';
import { NewKnowledgeRetriever } from '@/lib/rag/new-knowledge-retriever';

/**
 * 知识库管理API - 使用新的 Qdrant + PostgreSQL 方案
 */

// GET: 获取知识库统计信息或搜索知识库
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'search';
    const query = searchParams.get('query') || '';
    const domain = searchParams.get('domain') || '';
    const type = searchParams.get('type') || '';
    const includeDocuments = searchParams.get('includeDocuments') === 'true';
    const libraryType = searchParams.get('libraryType'); // 'private' | 'shared'
    const ownerId = searchParams.get('ownerId') || 'default_user'; // 默认用户ID

    const dbModels = new DatabaseModels();
    const retriever = new NewKnowledgeRetriever();

    // 获取知识库文档列表
    if (action === 'getLibraryFiles') {
      let files;
      
      if (libraryType === 'private') {
        files = await dbModels.getPrivateFiles(ownerId);
      } else if (libraryType === 'shared') {
        files = await dbModels.getSharedFiles();
      } else {
        return NextResponse.json({ 
          error: '请指定知识库类型 (private 或 shared)' 
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        files,
        total: files.length,
        libraryType,
      });
    }

    // 获取知识库统计信息
    if (action === 'getLibraryStats') {
      const stats = await dbModels.getKnowledgeLibraryStats();
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // 原有的搜索功能
    if (includeDocuments) {
      // 综合搜索：同时返回知识项和相关文档
      const result = await retriever.comprehensiveSearch(
        query,
        domain || undefined,
        type || undefined,
        10,
        10
      );

      return NextResponse.json({
        success: true,
        knowledge_items: result.knowledge,
        related_documents: result.documents,
        total_knowledge: result.knowledge.length,
        total_documents: result.documents.length,
      });
    } else {
      // 仅搜索知识项
      const knowledgeItems = await retriever.retrieveRelevantKnowledge(
        query,
        domain || undefined,
        type || undefined,
        10
      );

      return NextResponse.json({
        success: true,
        knowledge_items: knowledgeItems,
        total: knowledgeItems.length,
      });
    }
  } catch (error) {
    console.error('知识库API错误:', error);
    return NextResponse.json({ 
      error: '知识库操作失败',
      details: error instanceof Error ? error.message : '未知错误'
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