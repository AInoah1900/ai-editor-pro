import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '../../../../lib/database/models';
import { validateAuth } from '../../../../lib/auth/middleware';

/**
 * 用户登出处理函数
 */
async function handleLogout(request: NextRequest): Promise<NextResponse> {
  try {
    const authContext = await validateAuth(request);
    
    if (authContext) {
      // 如果用户已认证，删除会话
      const authHeader = request.headers.get('authorization');
      const cookieToken = request.cookies.get('access_token')?.value;
      
      const accessToken = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : cookieToken;
        
      if (accessToken) {
        const db = new DatabaseModels();
        await db.deleteSession(accessToken);
      }
    }
    
    // 创建响应并清除Cookie
    const response = NextResponse.json({
      success: true,
      message: '已成功登出'
    });
    
    // 清除认证Cookie
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    
    return response;
    
  } catch (error) {
    console.error('用户登出失败:', error);
    return NextResponse.json(
      { success: false, error: '登出过程中发生错误' },
      { status: 500 }
    );
  }
}

export const POST = handleLogout; 