import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '@/lib/database/models';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

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
        file: fileMetadata
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
        const fileExtension = fileMetadata.file_type.toLowerCase();
        
        if (action === 'download') {
          // 下载模式：直接返回文件
          const fileBuffer = fs.readFileSync(filePath);
          const contentType = getMimeType(fileExtension);
          
          const headers = new Headers();
          headers.set('Content-Type', contentType);
          headers.set('Content-Length', fileBuffer.length.toString());
          headers.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileMetadata.filename)}`);
          
          return new NextResponse(fileBuffer, {
            status: 200,
            headers
          });
        } else {
          // 打开模式：提取文本内容
          let textContent: string;
          
          if (fileExtension === 'txt' || fileExtension === 'md') {
            // 文本文件直接读取
            textContent = fs.readFileSync(filePath, 'utf8');
          } else if (fileExtension === 'docx') {
            // DOCX文件使用mammoth提取文本
            try {
              const buffer = fs.readFileSync(filePath);
              const result = await mammoth.extractRawText({ buffer });
              textContent = result.value;
              
              if (result.messages.length > 0) {
                console.warn('DOCX解析警告:', result.messages);
              }
              
              // 检查是否成功提取到内容
              if (!textContent || textContent.trim().length === 0) {
                textContent = `DOCX文档内容为空或无法解析。\n\n这可能是由于文档格式复杂或包含特殊元素。\n\n请点击下载按钮获取原始文件。`;
              }
            } catch (mammothError) {
              console.error('DOCX解析失败:', mammothError);
              textContent = `DOCX文档解析失败。\n\n错误信息: ${mammothError instanceof Error ? mammothError.message : '未知错误'}\n\n请点击下载按钮获取原始文件。`;
            }
          } else if (fileExtension === 'pdf') {
            // PDF文件暂时不支持在线预览，提供下载选项
            textContent = `PDF文档暂不支持在线预览。\n\n这是为了确保系统稳定性和兼容性。\n\n请点击下载按钮获取原始PDF文件进行查看。`;
          } else {
            // 其他格式暂不支持文本提取，返回提示信息
            textContent = `暂不支持 ${fileExtension.toUpperCase()} 格式的在线预览。\n\n请点击下载按钮获取原始文件。`;
          }
          
          // 返回提取的文本内容
          return new NextResponse(textContent, {
            status: 200,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8'
            }
          });
        }
      } catch (error) {
        console.error('处理文件失败:', error);
        return NextResponse.json({
          success: false,
          error: `处理文件失败: ${error instanceof Error ? error.message : '未知错误'}`
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