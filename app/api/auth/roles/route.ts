import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '../../../../lib/database/models';

/**
 * 获取角色列表处理函数
 */
async function handleGetRoles(request: NextRequest): Promise<NextResponse> {
  try {
    const db = new DatabaseModels();
    
    // 获取所有角色
    const roles = await db.getAllRoles();
    
    // 过滤角色响应数据（排除系统管理员角色，普通注册不应该能选择）
    const publicRoles = roles
      .filter(role => role.name !== 'admin')
      .map(role => ({
        id: role.id,
        name: role.name,
        display_name: role.display_name,
        description: role.description
      }));
    
    return NextResponse.json({
      success: true,
      roles: publicRoles
    });
    
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export const GET = handleGetRoles; 