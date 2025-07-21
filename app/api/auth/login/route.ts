import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '../../../../lib/database/models';
import { withRateLimit } from '../../../../lib/auth/middleware';

/**
 * 登录请求接口
 */
interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

/**
 * 验证登录数据
 */
function validateLoginData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('邮箱格式无效');
  }
  
  if (!data.password) {
    errors.push('密码不能为空');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 用户登录处理函数
 */
async function handleLogin(request: NextRequest): Promise<NextResponse> {
  try {
    const data: LoginRequest = await request.json();
    
    // 验证输入数据
    const validation = validateLoginData(data);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: '输入数据验证失败', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }
    
    const db = new DatabaseModels();
    
    // 验证用户凭据
    const user = await db.validateUserPassword(data.email, data.password);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '邮箱或密码错误' },
        { status: 401 }
      );
    }
    
    // 获取用户角色信息
    const roles = await db.getAllRoles();
    const userRole = roles.find(role => role.id === user.role_id);
    
    // 创建会话
    const session = await db.createSession(user.id);
    
    // 准备用户响应数据
    const userResponse = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      role_id: user.role_id,
      role_name: userRole?.name || 'unknown',
      role_display_name: userRole?.display_name || '未知角色',
      permissions: userRole?.permissions || [],
      publisher_name: user.publisher_name,
      publisher_website: user.publisher_website,
      journal_domain: user.journal_domain,
      email_verified: user.email_verified,
      phone_verified: user.phone_verified,
      last_login_at: user.last_login_at,
      created_at: user.created_at
    };
    
    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      user: userResponse,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at
    });
    
    // 设置Cookie（可选，支持cookie-based认证）
    response.cookies.set('access_token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: data.remember_me ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30天 or 1天
    });
    
    response.cookies.set('refresh_token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 // 30天
    });
    
    return response;
    
  } catch (error) {
    console.error('用户登录失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 应用速率限制中间件（登录更严格的限制）
export const POST = withRateLimit(10, 15)(handleLogin); 