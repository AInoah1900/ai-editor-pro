import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels, User } from '../database/models';

/**
 * 认证上下文接口
 */
export interface AuthContext {
  user: User;
  hasPermission: (permission: string) => Promise<boolean>;
}

/**
 * 从请求中提取访问令牌
 */
function extractAccessToken(request: NextRequest): string | null {
  // 1. 从 Authorization 头中提取
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 2. 从 Cookie 中提取
  const cookieToken = request.cookies.get('access_token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * 验证用户认证状态
 */
export async function validateAuth(request: NextRequest): Promise<AuthContext | null> {
  try {
    const accessToken = extractAccessToken(request);
    if (!accessToken) {
      return null;
    }

    const db = new DatabaseModels();
    const sessionData = await db.validateSession(accessToken);
    
    if (!sessionData) {
      return null;
    }

    const { user } = sessionData;
    
    return {
      user,
      hasPermission: (permission: string) => db.hasPermission(user.id, permission)
    };
  } catch (error) {
    console.error('认证验证失败:', error);
    return null;
  }
}

/**
 * 权限验证中间件
 */
export function withAuth(requiredPermissions: string[] = []) {
  return function(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
    return async function(request: NextRequest): Promise<NextResponse> {
      try {
        const authContext = await validateAuth(request);
        
        if (!authContext) {
          return NextResponse.json(
            { error: '未授权访问', code: 'UNAUTHORIZED' },
            { status: 401 }
          );
        }

        // 检查权限
        if (requiredPermissions.length > 0) {
          for (const permission of requiredPermissions) {
            const hasPermission = await authContext.hasPermission(permission);
            if (!hasPermission) {
              return NextResponse.json(
                { error: '权限不足', code: 'FORBIDDEN', required: permission },
                { status: 403 }
              );
            }
          }
        }

        return await handler(request, authContext);
      } catch (error) {
        console.error('中间件执行失败:', error);
        return NextResponse.json(
          { error: '服务器内部错误', code: 'INTERNAL_ERROR' },
          { status: 500 }
        );
      }
    };
  };
}

/**
 * 可选认证中间件（用户可能已登录也可能未登录）
 */
export function withOptionalAuth(handler: (request: NextRequest, context?: AuthContext) => Promise<NextResponse>) {
  return async function(request: NextRequest): Promise<NextResponse> {
    try {
      const authContext = await validateAuth(request);
      return await handler(request, authContext || undefined);
    } catch (error) {
      console.error('可选认证中间件执行失败:', error);
      return await handler(request, undefined);
    }
  };
}

/**
 * 角色验证中间件
 */
export function withRole(allowedRoles: string[]) {
  return function(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
    return withAuth()(async (request: NextRequest, context: AuthContext) => {
      const db = new DatabaseModels();
      const userWithRole = await db.getUserById(context.user.id);
      
      if (!userWithRole) {
        return NextResponse.json(
          { error: '用户不存在', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // 获取用户角色信息
      const roles = await db.getAllRoles();
      const userRole = roles.find(role => role.id === userWithRole.role_id);
      
      if (!userRole || !allowedRoles.includes(userRole.name)) {
        return NextResponse.json(
          { error: '角色权限不足', code: 'ROLE_FORBIDDEN', required: allowedRoles },
          { status: 403 }
        );
      }

      return await handler(request, context);
    });
  };
}

/**
 * 资源所有者验证中间件
 */
export function withResourceOwnership(getResourceOwnerId: (request: NextRequest) => Promise<string | null>) {
  return function(handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) {
    return withAuth()(async (request: NextRequest, context: AuthContext) => {
      const resourceOwnerId = await getResourceOwnerId(request);
      
      // 如果无法获取资源所有者ID，则拒绝访问
      if (!resourceOwnerId) {
        return NextResponse.json(
          { error: '资源不存在', code: 'RESOURCE_NOT_FOUND' },
          { status: 404 }
        );
      }

      // 检查用户是否是资源所有者或具有管理权限
      const isOwner = context.user.id === resourceOwnerId;
      const hasAdminPermission = await context.hasPermission('admin:*') || 
                                await context.hasPermission('document:*');

      if (!isOwner && !hasAdminPermission) {
        return NextResponse.json(
          { error: '无权访问此资源', code: 'RESOURCE_FORBIDDEN' },
          { status: 403 }
        );
      }

      return await handler(request, context);
    });
  };
}

/**
 * 速率限制中间件（简单版本）
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(maxRequests: number = 100, windowMinutes: number = 15) {
  return function(handler: (request: NextRequest, context?: AuthContext) => Promise<NextResponse>) {
    return async function(request: NextRequest): Promise<NextResponse> {
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;
      
      const rateLimitInfo = rateLimitStore.get(clientIp) || { count: 0, resetTime: now + windowMs };
      
      if (now > rateLimitInfo.resetTime) {
        rateLimitInfo.count = 1;
        rateLimitInfo.resetTime = now + windowMs;
      } else {
        rateLimitInfo.count++;
      }
      
      rateLimitStore.set(clientIp, rateLimitInfo);
      
      if (rateLimitInfo.count > maxRequests) {
        return NextResponse.json(
          { 
            error: '请求过于频繁', 
            code: 'RATE_LIMIT_EXCEEDED',
            resetTime: rateLimitInfo.resetTime 
          },
          { status: 429 }
        );
      }

      const authContext = await validateAuth(request);
      return await handler(request, authContext || undefined);
    };
  };
} 