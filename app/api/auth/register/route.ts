import { NextRequest, NextResponse } from 'next/server';
import { DatabaseModels } from '../../../../lib/database/models';
import { withRateLimit } from '../../../../lib/auth/middleware';

/**
 * 注册请求接口
 */
interface RegisterRequest {
  username: string;
  nickname: string;
  email: string;
  password: string;
  phone?: string;
  role_id: string;
  publisher_name?: string;
  publisher_website?: string;
  publisher_submission_template?: string;
  journal_domain?: string;
}

/**
 * 验证注册数据
 */
function validateRegisterData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.username || data.username.length < 3) {
    errors.push('用户名至少需要3个字符');
  }
  
  if (!data.nickname || data.nickname.length < 2) {
    errors.push('昵称至少需要2个字符');
  }
  
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('邮箱格式无效');
  }
  
  if (!data.password || data.password.length < 8) {
    errors.push('密码至少需要8个字符');
  }
  
  if (!data.role_id) {
    errors.push('请选择用户角色');
  }
  
  // 验证密码强度
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (data.password && !passwordRegex.test(data.password)) {
    errors.push('密码必须包含大小写字母、数字和特殊字符');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 用户注册处理函数
 */
async function handleRegister(request: NextRequest): Promise<NextResponse> {
  try {
    const data: RegisterRequest = await request.json();
    
    // 验证输入数据
    const validation = validateRegisterData(data);
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
    
    // 检查用户名是否已存在
    const existingUserByUsername = await db.getUserByUsername(data.username);
    if (existingUserByUsername) {
      return NextResponse.json(
        { success: false, error: '用户名已存在' },
        { status: 409 }
      );
    }
    
    // 检查邮箱是否已存在
    const existingUserByEmail = await db.getUserByEmail(data.email);
    if (existingUserByEmail) {
      return NextResponse.json(
        { success: false, error: '邮箱已被注册' },
        { status: 409 }
      );
    }
    
    // 验证角色是否存在
    const roles = await db.getAllRoles();
    const selectedRole = roles.find(role => role.id === data.role_id);
    if (!selectedRole) {
      return NextResponse.json(
        { success: false, error: '选择的角色不存在' },
        { status: 400 }
      );
    }
    
    // 创建用户
    const newUser = await db.createUser({
      username: data.username,
      nickname: data.nickname,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role_id: data.role_id,
      publisher_name: data.publisher_name,
      publisher_website: data.publisher_website,
      publisher_submission_template: data.publisher_submission_template,
      journal_domain: data.journal_domain,
      is_active: true,
      email_verified: false,
      phone_verified: false
    });
    
    // 返回成功响应（不包含敏感信息）
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      nickname: newUser.nickname,
      email: newUser.email,
      phone: newUser.phone,
      role_id: newUser.role_id,
      role_name: selectedRole.display_name,
      publisher_name: newUser.publisher_name,
      journal_domain: newUser.journal_domain,
      created_at: newUser.created_at
    };
    
    return NextResponse.json({
      success: true,
      message: '用户注册成功',
      user: userResponse
    });
    
  } catch (error) {
    console.error('用户注册失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 应用速率限制中间件
export const POST = withRateLimit(5, 15)(handleRegister); 