/**
 * 用户认证系统数据库初始化脚本
 * 初始化用户认证相关的数据库表和默认角色数据
 */

// 由于 models.ts 是 TypeScript 文件，我们需要使用动态导入
const path = require('path');

// 简化的数据库初始化（直接使用 pg 和相关依赖）
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// 从环境变量读取PostgreSQL配置
const getPostgreSQLConfig = () => {
  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'postgres',
    user: process.env.POSTGRES_USER || 'myuser',
    password: process.env.POSTGRES_PASSWORD || '12345678',
    max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '2000'),
  };
};

// 默认角色数据
const defaultRoles = [
  {
    id: 'role_author',
    name: 'author',
    display_name: '作者',
    description: '文章作者，可以上传和编辑自己的文档',
    permissions: ['document:create', 'document:read_own', 'document:update_own', 'document:delete_own']
  },
  {
    id: 'role_editor',
    name: 'editor',
    display_name: '编辑',
    description: '期刊编辑，可以编辑和审核文档',
    permissions: [
      'document:create', 'document:read', 'document:update', 'document:delete',
      'knowledge:read', 'knowledge:create', 'review:create', 'review:update'
    ]
  },
  {
    id: 'role_chief_editor',
    name: 'chief_editor',
    display_name: '主编',
    description: '主编，拥有期刊管理权限',
    permissions: [
      'document:*', 'knowledge:*', 'review:*', 'user:read', 'user:update',
      'analytics:read', 'settings:update'
    ]
  },
  {
    id: 'role_reviewer',
    name: 'reviewer',
    display_name: '审稿专家',
    description: '审稿专家，可以审阅和评论文档',
    permissions: ['document:read', 'review:create', 'review:update', 'comment:create']
  },
  {
    id: 'role_admin',
    name: 'admin',
    display_name: '系统管理员',
    description: '系统管理员，拥有所有权限',
    permissions: ['*']
  }
];

async function initializeUserAuthDatabase() {
  console.log('🚀 开始初始化用户认证系统数据库...\n');

  let pool;
  
  try {
    // 创建数据库连接池
    pool = new Pool(getPostgreSQLConfig());
    
    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    try {
      // 1. 创建用户角色表
      console.log('📋 创建用户角色表...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS roles (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          display_name VARCHAR(200) NOT NULL,
          description TEXT,
          permissions TEXT[] DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. 创建用户表
      console.log('📋 创建用户表...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          nickname VARCHAR(200) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          avatar_url TEXT,
          password_hash VARCHAR(255) NOT NULL,
          role_id VARCHAR(255) REFERENCES roles(id),
          publisher_name VARCHAR(500),
          publisher_website TEXT,
          publisher_submission_template TEXT,
          journal_domain VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          email_verified BOOLEAN DEFAULT false,
          phone_verified BOOLEAN DEFAULT false,
          last_login_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 3. 创建会话表
      console.log('📋 创建会话表...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          access_token TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 4. 创建用户配置表
      console.log('📋 创建用户配置表...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
          bio TEXT,
          preferences JSONB DEFAULT '{}',
          notification_settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 5. 更新现有表，添加用户关联（如果表存在）
      console.log('📋 更新现有表结构...');
      try {
        await client.query(`
          ALTER TABLE file_metadata 
          ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) REFERENCES users(id),
          ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) REFERENCES users(id)
        `);
      } catch (error) {
        console.log('   ℹ️  file_metadata 表可能不存在，跳过');
      }

      try {
        await client.query(`
          ALTER TABLE knowledge_items 
          ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) REFERENCES users(id),
          ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255) REFERENCES users(id)
        `);
      } catch (error) {
        console.log('   ℹ️  knowledge_items 表可能不存在，跳过');
      }

      // 6. 创建索引
      console.log('📋 创建索引...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_access_token ON sessions(access_token);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
      `);

      // 7. 插入默认角色数据
      console.log('👥 初始化默认角色...');
      for (const role of defaultRoles) {
        await client.query(`
          INSERT INTO roles (id, name, display_name, description, permissions, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            description = EXCLUDED.description,
            permissions = EXCLUDED.permissions,
            updated_at = CURRENT_TIMESTAMP
        `, [
          role.id, role.name, role.display_name,
          role.description, role.permissions
        ]);
      }

      console.log('✅ 数据库表创建完成\n');

      // 8. 验证角色数据
      console.log('📊 验证默认角色数据...');
      const rolesResult = await client.query('SELECT * FROM roles ORDER BY name');
      console.log(`✅ 成功创建/更新 ${rolesResult.rows.length} 个角色\n`);

      // 9. 显示角色详情
      console.log('📋 当前系统角色：');
      for (const role of rolesResult.rows) {
        console.log(`   • ${role.display_name} (${role.name})`);
        console.log(`     描述: ${role.description}`);
        console.log(`     权限数: ${role.permissions.length}`);
        console.log('');
      }

      // 10. 测试现有知识库兼容性
      console.log('🧪 测试与现有系统的兼容性...');
      try {
        const fileStats = await client.query('SELECT COUNT(*) as count FROM file_metadata');
        console.log(`✅ 现有知识库文档: ${fileStats.rows[0].count} 个`);
      } catch (error) {
        console.log('   ℹ️  知识库表尚未创建');
      }

      try {
        const knowledgeStats = await client.query('SELECT COUNT(*) as count FROM knowledge_items');
        console.log(`✅ 现有知识项目: ${knowledgeStats.rows[0].count} 个`);
      } catch (error) {
        console.log('   ℹ️  知识项目表尚未创建');
      }

      console.log('\n🎉 用户认证系统数据库初始化完成！');
      console.log('\n📝 使用说明：');
      console.log('   1. 用户可以通过以下地址访问：');
      console.log('      - 首页登录: http://localhost:3000 (右上角登录按钮)');
      console.log('      - 编辑器登录: http://localhost:3000/editor (个人中心菜单)');
      console.log('      - 独立页面: http://localhost:3000/profile');
      console.log('   2. 支持的用户角色：');
      console.log('      - 作者: 可以上传和编辑自己的文档');
      console.log('      - 编辑: 可以编辑和审核文档');
      console.log('      - 主编: 拥有期刊管理权限');
      console.log('      - 审稿专家: 可以审阅和评论文档');
      console.log('   3. API 端点：');
      console.log('      - POST /api/auth/register - 用户注册');
      console.log('      - POST /api/auth/login - 用户登录');
      console.log('      - POST /api/auth/logout - 用户登出');
      console.log('      - GET /api/auth/me - 获取当前用户信息');
      console.log('      - GET /api/auth/roles - 获取可用角色列表');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    console.error('\n🔧 可能的解决方案：');
    console.error('   1. 确保 PostgreSQL 服务正在运行');
    console.error('   2. 检查 .env.local 文件中的数据库配置');
    console.error('   3. 确保数据库用户有创建表的权限');
    console.error('   4. 检查数据库连接参数是否正确');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  无法连接到数据库，请确保 PostgreSQL 服务正在运行');
    } else if (error.code === '3D000') {
      console.error('   ⚠️  数据库不存在，请先创建数据库');
    } else if (error.code === '28P01') {
      console.error('   ⚠️  认证失败，请检查用户名和密码');
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// 运行初始化
if (require.main === module) {
  initializeUserAuthDatabase()
    .then(() => {
      console.log('\n✨ 初始化完成，可以开始使用用户认证功能了！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 初始化过程发生错误:', error);
      process.exit(1);
    });
}

module.exports = { initializeUserAuthDatabase }; 