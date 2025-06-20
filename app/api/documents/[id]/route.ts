import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '@/lib/database/models';
import fs from 'fs';
import path from 'path';

/**
 * 文档访问API
 */

// GET: 获取文档信息或下载文档
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15 要求 await params
    const resolvedParams = await params;
    const documentId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'info'; // 'info' | 'download' | 'open'
    
    const dbModels = new DatabaseModels();
    
    // 获取文档元数据
    const fileMetadata = await dbModels.getFileByVectorId(documentId);
    
    if (!fileMetadata) {
      return NextResponse.json({
        success: false,
        error: '文档不存在'
      }, { status: 404 });
    }

    if (action === 'info') {
      // 返回文档信息
      return NextResponse.json({
        success: true,
        data: fileMetadata
      });
    }

    if (action === 'download' || action === 'open') {
      // 检查文件是否存在
      const filePath = fileMetadata.file_path;
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({
          success: false,
          error: '文档文件不存在'
        }, { status: 404 });
      }

      try {
        // 根据文件类型选择合适的读取方式
        const fileExtension = fileMetadata.file_type.toLowerCase();
        let fileBuffer: Buffer;
        let contentType: string;
        
        if (fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'html') {
          // 文本文件使用UTF-8编码读取
          const textContent = fs.readFileSync(filePath, 'utf8');
          fileBuffer = Buffer.from(textContent, 'utf8');
          contentType = getTextMimeType(fileExtension);
        } else {
          // 二进制文件直接读取
          fileBuffer = fs.readFileSync(filePath);
          contentType = getMimeType(fileExtension);
        }
        
        // 设置响应头
        const headers = new Headers();
        headers.set('Content-Type', `${contentType}; charset=utf-8`);
        headers.set('Content-Length', fileBuffer.length.toString());
        
        if (action === 'download') {
          headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileMetadata.filename)}`);
        } else {
          headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(fileMetadata.filename)}`);
        }
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers
        });
      } catch (error) {
        console.error('读取文件失败:', error);
        return NextResponse.json({
          success: false,
          error: '读取文件失败'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: '无效的操作类型'
    }, { status: 400 });

  } catch (error) {
    console.error('文档访问失败:', error);
    return NextResponse.json({
      success: false,
      error: '文档访问失败'
    }, { status: 500 });
  }
}

/**
 * 根据文本文件类型获取MIME类型
 */
function getTextMimeType(fileType: string): string {
  const textMimeTypes: { [key: string]: string } = {
    'txt': 'text/plain',
    'md': 'text/markdown',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'text/javascript',
    'json': 'application/json',
    'xml': 'application/xml',
  };

  return textMimeTypes[fileType.toLowerCase()] || 'text/plain';
}

/**
 * 根据文件类型获取MIME类型
 */
function getMimeType(fileType: string): string {
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };

  return mimeTypes[fileType.toLowerCase()] || 'application/octet-stream';
} 