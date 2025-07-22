/**
 * 期刊领域管理API接口
 * 支持获取所有期刊领域、按类别筛选、搜索功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

// 期刊领域接口定义
export interface JournalDomain {
  id: number;
  code: string;
  name: string;
  category: string;
  category_name: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface JournalDomainCategory {
  category: string;
  category_name: string;
  domain_count: number;
  domains: JournalDomain[];
}

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

let pool: Pool;

// 获取数据库连接池
function getPool() {
  if (!pool) {
    pool = new Pool(getPostgreSQLConfig());
  }
  return pool;
}

// GET: 获取期刊领域
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const format = searchParams.get('format');
    const active_only = searchParams.get('active_only') !== 'false';

    const pool = getPool();
    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          id, code, name, category, category_name, 
          description, sort_order, is_active, 
          created_at, updated_at
        FROM journal_domains
      `;
      const queryParams: any[] = [];
      const conditions: string[] = [];

      // 筛选条件
      if (active_only) {
        conditions.push('is_active = true');
      }

      if (category) {
        conditions.push(`category = $${queryParams.length + 1}`);
        queryParams.push(category);
      }

      if (search) {
        conditions.push(`(name ILIKE $${queryParams.length + 1} OR description ILIKE $${queryParams.length + 1} OR code ILIKE $${queryParams.length + 1})`);
        queryParams.push(`%${search}%`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY sort_order, name';

      const result = await client.query(query, queryParams);
      const domains: JournalDomain[] = result.rows;

      // 根据format参数返回不同格式
      if (format === 'grouped') {
        // 按类别分组返回
        const grouped: { [key: string]: JournalDomainCategory } = {};
        
        for (const domain of domains) {
          if (!grouped[domain.category]) {
            grouped[domain.category] = {
              category: domain.category,
              category_name: domain.category_name,
              domain_count: 0,
              domains: []
            };
          }
          grouped[domain.category].domains.push(domain);
          grouped[domain.category].domain_count++;
        }

        const categories = Object.values(grouped).sort((a, b) => {
          const aMinOrder = Math.min(...a.domains.map(d => d.sort_order));
          const bMinOrder = Math.min(...b.domains.map(d => d.sort_order));
          return aMinOrder - bMinOrder;
        });

        return NextResponse.json({
          success: true,
          data: {
            categories,
            total_categories: categories.length,
            total_domains: domains.length
          }
        });
      }

      if (format === 'simple') {
        // 简化格式，只返回基本信息
        const simpleDomains = domains.map(domain => ({
          code: domain.code,
          name: domain.name,
          category_name: domain.category_name
        }));

        return NextResponse.json({
          success: true,
          data: {
            domains: simpleDomains,
            total: simpleDomains.length
          }
        });
      }

      // 默认格式：返回完整信息
      return NextResponse.json({
        success: true,
        data: {
          domains,
          total: domains.length
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('获取期刊领域失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取期刊领域失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// POST: 添加或更新期刊领域（管理员功能）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, domain } = body;

    if (!action || !domain) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      if (action === 'create') {
        // 添加新的期刊领域
        const result = await client.query(`
          INSERT INTO journal_domains (
            code, name, category, category_name, 
            description, sort_order, is_active, 
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING *
        `, [
          domain.code,
          domain.name,
          domain.category,
          domain.category_name,
          domain.description,
          domain.sort_order || 999,
          domain.is_active !== false
        ]);

        return NextResponse.json({
          success: true,
          message: '期刊领域添加成功',
          data: result.rows[0]
        });
      }

      if (action === 'update' && domain.id) {
        // 更新现有期刊领域
        const result = await client.query(`
          UPDATE journal_domains 
          SET 
            name = $1, 
            category = $2, 
            category_name = $3,
            description = $4, 
            sort_order = $5, 
            is_active = $6,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $7
          RETURNING *
        `, [
          domain.name,
          domain.category,
          domain.category_name,
          domain.description,
          domain.sort_order,
          domain.is_active,
          domain.id
        ]);

        if (result.rows.length === 0) {
          return NextResponse.json({
            success: false,
            error: '期刊领域不存在'
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          message: '期刊领域更新成功',
          data: result.rows[0]
        });
      }

      return NextResponse.json({
        success: false,
        error: '无效的操作类型'
      }, { status: 400 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('期刊领域操作失败:', error);
    return NextResponse.json({
      success: false,
      error: '期刊领域操作失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE: 删除期刊领域（管理员功能）
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const code = searchParams.get('code');

    if (!id && !code) {
      return NextResponse.json({
        success: false,
        error: '缺少期刊领域ID或代码'
      }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      let query = 'DELETE FROM journal_domains WHERE ';
      let param: string;

      if (id) {
        query += 'id = $1';
        param = id;
      } else {
        query += 'code = $1';
        param = code!;
      }

      query += ' RETURNING *';

      const result = await client.query(query, [param]);

      if (result.rows.length === 0) {
        return NextResponse.json({
          success: false,
          error: '期刊领域不存在'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: '期刊领域删除成功',
        data: result.rows[0]
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('删除期刊领域失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除期刊领域失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PUT: 批量更新期刊领域状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids, is_active } = body;

    if (action !== 'batch_update_status' || !Array.isArray(ids)) {
      return NextResponse.json({
        success: false,
        error: '无效的批量操作参数'
      }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      const result = await client.query(`
        UPDATE journal_domains 
        SET 
          is_active = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($2::int[])
        RETURNING *
      `, [is_active, ids]);

      return NextResponse.json({
        success: true,
        message: `批量${is_active ? '启用' : '禁用'}成功`,
        data: {
          updated_count: result.rows.length,
          domains: result.rows
        }
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('批量更新期刊领域失败:', error);
    return NextResponse.json({
      success: false,
      error: '批量更新期刊领域失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 