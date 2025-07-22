/**
 * 期刊领域数据库初始化脚本
 * 创建期刊领域表并导入62个中国国内期刊学科领域分类
 */

const { Pool } = require('pg');

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

// 62个期刊领域分类数据
const journalDomains = [
  // 自然科学与工程技术
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'mathematics', name: '数学', description: '纯数学、应用数学、统计数学等', sort_order: 1 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'physics', name: '物理学', description: '理论物理、应用物理、光学等', sort_order: 2 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'chemistry', name: '化学', description: '无机化学、有机化学、分析化学等', sort_order: 3 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'astronomy', name: '天文学', description: '天体物理、天体测量、宇宙学等', sort_order: 4 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'earth_science', name: '地球科学', description: '地质学、地理学、大气科学、海洋学等', sort_order: 5 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'biology', name: '生物学', description: '植物学、动物学、微生物学、生态学等', sort_order: 6 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'agriculture', name: '农业科学', description: '农学、林学、畜牧兽医、园艺学等', sort_order: 7 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'medicine', name: '医学', description: '基础医学、临床医学、药学、中医学等', sort_order: 8 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'engineering', name: '工程与技术', description: '机械工程、材料科学、电子工程等', sort_order: 9 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'energy_science', name: '能源科学与技术', description: '新能源、可再生能源、节能技术等', sort_order: 10 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'environmental_science', name: '环境科学与工程', description: '环境保护、环境治理、生态工程等', sort_order: 11 },

  // 社会科学与人文科学  
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'philosophy', name: '哲学', description: '马克思主义哲学、中外哲学、美学等', sort_order: 12 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'religion', name: '宗教', description: '宗教学、宗教史、比较宗教学等', sort_order: 13 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'linguistics', name: '语言学', description: '理论语言学、应用语言学、比较语言学等', sort_order: 14 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'literature', name: '文学', description: '中国文学、外国文学、文学理论等', sort_order: 15 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'arts', name: '艺术学', description: '音乐、美术、戏剧、电影等', sort_order: 16 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'history', name: '历史学', description: '中国史、世界史、史学理论等', sort_order: 17 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'archaeology', name: '考古学', description: '史前考古、历史考古、文物保护等', sort_order: 18 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'economics', name: '经济学', description: '理论经济学、应用经济学、金融学等', sort_order: 19 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'political_science', name: '政治学', description: '政治理论、国际政治、公共政策等', sort_order: 20 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'law', name: '法学', description: '民法、刑法、国际法、法理学等', sort_order: 21 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'sociology', name: '社会学', description: '社会理论、社会调查、社会工作等', sort_order: 22 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'ethnology', name: '民族学与文化学', description: '民族学、人类学、文化研究等', sort_order: 23 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'journalism', name: '新闻传播学', description: '新闻学、传播学、广告学、编辑出版学等', sort_order: 24 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'education', name: '教育学', description: '高等教育、职业教育、教育心理学等', sort_order: 25 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'psychology', name: '心理学', description: '发展心理学、认知心理学、应用心理学等', sort_order: 26 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'sports_science', name: '体育科学', description: '体育教育、运动训练、体育人文社会学等', sort_order: 27 },

  // 交叉与综合学科
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'management_science', name: '管理科学与工程', description: '管理理论、决策科学、信息管理等', sort_order: 28 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'business_management', name: '工商管理', description: '企业管理、市场营销、会计学等', sort_order: 29 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'public_administration', name: '公共管理', description: '行政管理、公共政策、社会保障等', sort_order: 30 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'library_information', name: '图书馆、情报与文献学', description: '图书馆学、情报学、文献学等', sort_order: 31 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'statistics', name: '统计学', description: '理论统计、应用统计、统计调查等', sort_order: 32 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'systems_science', name: '系统科学', description: '系统论、控制论、运筹学等', sort_order: 33 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'safety_science', name: '安全科学与技术', description: '安全工程、职业卫生、灾害防治等', sort_order: 34 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'military_science', name: '军事科学', description: '军事理论、军事技术、军事历史等', sort_order: 35 },

  // 应用与技术领域
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'computer_science', name: '计算机科学与技术', description: '计算机系统、软件工程、人工智能等', sort_order: 36 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'information_engineering', name: '信息与通信工程', description: '通信技术、信息系统、网络工程等', sort_order: 37 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'control_engineering', name: '控制科学与工程', description: '自动控制、智能控制、系统工程等', sort_order: 38 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'surveying_mapping', name: '测绘科学与技术', description: '大地测量、摄影测量、地图制图等', sort_order: 39 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'chemical_engineering', name: '化学工程', description: '化工工艺、化工设备、精细化工等', sort_order: 40 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'textile_engineering', name: '纺织科学与工程', description: '纺织工程、服装设计、纤维材料等', sort_order: 41 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'food_engineering', name: '食品科学与工程', description: '食品工程、食品安全、营养学等', sort_order: 42 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'architecture', name: '建筑学', description: '建筑设计、建筑历史、城乡规划等', sort_order: 43 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'civil_engineering', name: '土木工程', description: '结构工程、岩土工程、市政工程等', sort_order: 44 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'transportation', name: '交通运输工程', description: '交通规划、交通运输、物流工程等', sort_order: 45 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'aerospace', name: '航空航天工程', description: '飞行器设计、推进技术、航天工程等', sort_order: 46 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'nuclear_science', name: '核科学技术', description: '核物理、核工程、核安全等', sort_order: 47 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'weapon_science', name: '兵器科学与技术', description: '武器系统、弹药工程、探测制导等', sort_order: 48 },

  // 新兴与前沿领域
  { category: 'emerging_frontier', category_name: '新兴与前沿领域', code: 'data_science', name: '数据科学', description: '大数据、数据挖掘、数据分析等', sort_order: 49 },
  { category: 'emerging_frontier', category_name: '新兴与前沿领域', code: 'artificial_intelligence', name: '人工智能', description: '机器学习、深度学习、智能系统等', sort_order: 50 },
  { category: 'emerging_frontier', category_name: '新兴与前沿领域', code: 'biomedical_engineering', name: '生物医学工程', description: '医学影像、生物材料、医疗器械等', sort_order: 51 },
  { category: 'emerging_frontier', category_name: '新兴与前沿领域', code: 'nanotechnology', name: '纳米科学与技术', description: '纳米材料、纳米器件、纳米制造等', sort_order: 52 },
  { category: 'emerging_frontier', category_name: '新兴与前沿领域', code: 'quantum_science', name: '量子科学', description: '量子计算、量子通信、量子材料等', sort_order: 53 },
  { category: 'emerging_frontier', category_name: '新兴与前沿领域', code: 'marine_science', name: '海洋科学', description: '海洋物理、海洋生物、海洋工程等', sort_order: 54 },

  // 补充其他重要领域
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'materials_science', name: '材料科学与工程', description: '金属材料、无机材料、复合材料等', sort_order: 55 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'mechanical_engineering', name: '机械工程', description: '机械设计、制造工程、机电一体化等', sort_order: 56 },
  { category: 'applied_technology', category_name: '应用与技术领域', code: 'electrical_engineering', name: '电气工程', description: '电机与电器、电力系统、电子技术等', sort_order: 57 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'forestry', name: '林学', description: '森林培育、森林保护、木材科学等', sort_order: 58 },
  { category: 'natural_science', category_name: '自然科学与工程技术', code: 'veterinary', name: '兽医学', description: '基础兽医学、预防兽医学、临床兽医学等', sort_order: 59 },
  { category: 'social_humanities', category_name: '社会科学与人文科学', code: 'finance', name: '金融学', description: '货币银行学、证券投资、保险学等', sort_order: 60 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'tourism_management', name: '旅游管理', description: '旅游经济、旅游规划、酒店管理等', sort_order: 61 },
  { category: 'interdisciplinary', category_name: '交叉与综合学科', code: 'general', name: '通用', description: '跨学科、综合性、其他未分类领域', sort_order: 62 }
];

/**
 * 初始化期刊领域数据库
 */
async function initializeJournalDomains() {
  console.log('🚀 开始初始化期刊领域数据库...\n');

  let pool;
  
  try {
    // 创建数据库连接池
    pool = new Pool(getPostgreSQLConfig());
    
    // 测试连接
    const client = await pool.connect();
    console.log('✅ 数据库连接成功');

    try {
      // 1. 创建期刊领域表
      console.log('📋 创建期刊领域表...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS journal_domains (
          id SERIAL PRIMARY KEY,
          code VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          category VARCHAR(100) NOT NULL,
          category_name VARCHAR(200) NOT NULL,
          description TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. 创建索引
      console.log('📋 创建索引...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_journal_domains_code ON journal_domains(code);
        CREATE INDEX IF NOT EXISTS idx_journal_domains_category ON journal_domains(category);
        CREATE INDEX IF NOT EXISTS idx_journal_domains_sort_order ON journal_domains(sort_order);
        CREATE INDEX IF NOT EXISTS idx_journal_domains_active ON journal_domains(is_active);
      `);

      // 3. 清空现有数据（如果需要重新初始化）
      console.log('🧹 清理现有数据...');
      await client.query('DELETE FROM journal_domains');

      // 4. 插入期刊领域数据
      console.log('📚 插入期刊领域数据...');
      let insertCount = 0;
      
      for (const domain of journalDomains) {
        await client.query(`
          INSERT INTO journal_domains (code, name, category, category_name, description, sort_order, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          domain.code, domain.name, domain.category, domain.category_name,
          domain.description, domain.sort_order, true
        ]);
        insertCount++;
      }

      console.log(`✅ 成功插入 ${insertCount} 个期刊领域\n`);

      // 5. 验证数据
      console.log('📊 验证期刊领域数据...');
      const totalResult = await client.query('SELECT COUNT(*) as total FROM journal_domains');
      const categoryResult = await client.query(`
        SELECT category, category_name, COUNT(*) as count 
        FROM journal_domains 
        GROUP BY category, category_name 
        ORDER BY MIN(sort_order)
      `);

      console.log(`✅ 总期刊领域数: ${totalResult.rows[0].total}`);
      console.log('✅ 按类别分布：');
      for (const row of categoryResult.rows) {
        console.log(`   • ${row.category_name}: ${row.count}个领域`);
      }

      // 6. 显示详细列表
      console.log('\n📋 期刊领域详细列表：');
      console.log('='.repeat(70));
      
      const allDomains = await client.query(`
        SELECT category_name, name, description 
        FROM journal_domains 
        ORDER BY sort_order
      `);

      let currentCategory = '';
      for (const domain of allDomains.rows) {
        if (domain.category_name !== currentCategory) {
          currentCategory = domain.category_name;
          console.log(`\n【${currentCategory}】`);
        }
        console.log(`  ${domain.name} - ${domain.description}`);
      }

      // 7. 创建期刊领域管理视图
      console.log('\n📊 创建期刊领域管理视图...');
      await client.query(`
        CREATE OR REPLACE VIEW journal_domains_stats AS
        SELECT 
          category,
          category_name,
          COUNT(*) as domain_count,
          MIN(sort_order) as min_order,
          MAX(sort_order) as max_order
        FROM journal_domains 
        WHERE is_active = true
        GROUP BY category, category_name
        ORDER BY MIN(sort_order)
      `);

      console.log('\n🎉 期刊领域数据库初始化完成！');
      
      console.log('\n📝 使用说明：');
      console.log('   1. API接口: GET /api/journal-domains - 获取所有期刊领域');
      console.log('   2. 按类别获取: GET /api/journal-domains?category=natural_science');
      console.log('   3. 搜索领域: GET /api/journal-domains?search=计算机');
      console.log('   4. 数据库表: journal_domains');
      console.log('   5. 统计视图: journal_domains_stats');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ 期刊领域数据库初始化失败:', error);
    console.error('\n🔧 可能的解决方案：');
    console.error('   1. 确保 PostgreSQL 服务正在运行');
    console.error('   2. 检查 .env.local 文件中的数据库配置');
    console.error('   3. 确保数据库用户有创建表的权限');
    console.error('   4. 检查网络连接');
    
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
  initializeJournalDomains()
    .then(() => {
      console.log('\n✨ 期刊领域数据库初始化完成，现在可以在系统中使用丰富的期刊领域选项了！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 初始化过程发生错误:', error);
      process.exit(1);
    });
}

module.exports = { initializeJournalDomains, journalDomains }; 