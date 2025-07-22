/**
 * JWT密钥生成工具
 * 生成安全的JWT_SECRET用于用户认证系统
 */

const crypto = require('crypto');

console.log('🔐 JWT密钥生成工具\n');

// 方法1: 使用Node.js crypto模块生成随机字节
console.log('📋 方法1: 随机字节密钥（推荐）');
const randomBytes32 = crypto.randomBytes(32).toString('hex');
const randomBytes64 = crypto.randomBytes(64).toString('hex');
console.log(`32字节密钥: ${randomBytes32}`);
console.log(`64字节密钥: ${randomBytes64}`);
console.log();

// 方法2: 使用base64编码
console.log('📋 方法2: Base64编码密钥');
const base64Key = crypto.randomBytes(48).toString('base64');
console.log(`Base64密钥: ${base64Key}`);
console.log();

// 方法3: 混合字符密钥
console.log('📋 方法3: 混合字符密钥');
function generateMixedKey(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
const mixedKey = generateMixedKey(64);
console.log(`混合字符密钥: ${mixedKey}`);
console.log();

// 方法4: UUID组合密钥
console.log('📋 方法4: UUID组合密钥');
function generateUUIDKey() {
  const uuid1 = crypto.randomUUID().replace(/-/g, '');
  const uuid2 = crypto.randomUUID().replace(/-/g, '');
  const uuid3 = crypto.randomUUID().replace(/-/g, '');
  return `${uuid1}${uuid2}${uuid3}`;
}
const uuidKey = generateUUIDKey();
console.log(`UUID组合密钥: ${uuidKey}`);
console.log();

// 生成完整的.env.local配置示例
console.log('📝 完整的.env.local配置示例：');
console.log('='.repeat(50));
console.log(`# JWT认证配置（必须设置）`);
console.log(`JWT_SECRET=${randomBytes64}`);
console.log();
console.log(`# 数据库配置`);
console.log(`POSTGRES_HOST=localhost`);
console.log(`POSTGRES_PORT=5432`);
console.log(`POSTGRES_DB=ai_editor_pro`);
console.log(`POSTGRES_USER=myuser`);
console.log(`POSTGRES_PASSWORD=12345678`);
console.log();
console.log(`# DeepSeek API配置`);
console.log(`DEEPSEEK_API_KEY=your-deepseek-api-key`);
console.log();
console.log(`# Qdrant配置`);
console.log(`QDRANT_URL=http://localhost:6333`);
console.log(`QDRANT_COLLECTION_NAME=ai_editor_knowledge`);
console.log('='.repeat(50));

console.log('\n🔒 安全提示：');
console.log('1. 密钥长度至少32个字符，推荐64个字符以上');
console.log('2. 包含大小写字母、数字和特殊符号');
console.log('3. 不要使用常见词汇或个人信息');
console.log('4. 生产环境和开发环境使用不同的密钥');
console.log('5. 定期轮换密钥（建议3-6个月）');
console.log('6. 妥善保管密钥，不要提交到版本控制');

console.log('\n💡 使用方法：');
console.log('1. 复制上面生成的任一密钥');
console.log('2. 在.env.local文件中设置JWT_SECRET=你的密钥');
console.log('3. 重启应用服务器以使配置生效');
console.log('4. 运行 node scripts/test-user-auth-system.js 验证配置'); 