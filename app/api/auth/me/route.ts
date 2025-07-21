import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '../../../../lib/database/models';
import { withAuth, AuthContext } from '../../../../lib/auth/middleware';

/**
 * 获取当前用户信息处理函数
 */
async function handleGetMe(request: NextRequest, context: AuthContext): Promise<NextResponse> {
  try {
    const db = new DatabaseModels();
    
    // 获取完整用户信息（包含角色）
    const userWithRole = await db.getUserById(context.user.id);
    if (!userWithRole) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }
    
    // 获取用户角色信息
    const roles = await db.getAllRoles();
    const userRole = roles.find(role => role.id === userWithRole.role_id);
    
    // 获取用户配置
    const userProfile = await db.getUserProfile(context.user.id);
    
    // 准备响应数据（排除敏感信息）
    const userResponse = {
      id: userWithRole.id,
      username: userWithRole.username,
      nickname: userWithRole.nickname,
      email: userWithRole.email,
      phone: userWithRole.phone,
      avatar_url: userWithRole.avatar_url,
      role_id: userWithRole.role_id,
      role_name: userRole?.name || 'unknown',
      role_display_name: userRole?.display_name || '未知角色',
      permissions: userRole?.permissions || [],
      publisher_name: userWithRole.publisher_name,
      publisher_website: userWithRole.publisher_website,
      publisher_submission_template: userWithRole.publisher_submission_template,
      journal_domain: userWithRole.journal_domain,
      is_active: userWithRole.is_active,
      email_verified: userWithRole.email_verified,
      phone_verified: userWithRole.phone_verified,
      last_login_at: userWithRole.last_login_at,
      created_at: userWithRole.created_at,
      updated_at: userWithRole.updated_at,
      profile: userProfile ? {
        bio: userProfile.bio,
        preferences: userProfile.preferences,
        notification_settings: userProfile.notification_settings
      } : null
    };
    
    return NextResponse.json({
      success: true,
      user: userResponse
    });
    
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 需要认证才能访问
export const GET = withAuth()(handleGetMe); 