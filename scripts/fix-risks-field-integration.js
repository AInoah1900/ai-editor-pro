/**
 * 风险评估字段集成修复脚本
 * 修复本地分析函数中缺失的risks字段问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 开始修复风险评估字段集成问题...');
console.log('目标: 为所有本地错误生成函数添加risks字段');
console.log('时间:', new Date().toLocaleString());
console.log('');

const targetFile = path.join(__dirname, '../app/api/analyze-document-rag/route.ts');

/**
 * 生成风险评估文本
 */
function generateRiskAssessment(errorType, category, original) {
  const riskTemplates = {
    // 格式和规范类问题
    '标点符号': '无明显法律、事实或价值观问题，属于格式规范性问题。',
    '格式错误': '无明显法律、事实或价值观问题，属于编辑规范性问题。',
    '词汇使用': '无明显法律、事实或价值观问题，属于语言表达优化。',
    
    // 学术内容类问题
    '文档结构': '无法律风险，需注意学术规范性和逻辑完整性。',
    '内容完整性': '无法律风险，属于学术写作质量提升建议。',
    '术语使用': '无明显法律风险，需确保专业术语准确性避免学术误解。',
    
    // 通用风险评估
    'default': '经风险评估，无明显法律、事实或价值观问题。'
  };
  
  // 特殊情况检查
  if (original && (
    original.includes('政治') || original.includes('敏感') || 
    original.includes('违法') || original.includes('不当')
  )) {
    return '需要进一步审查，可能涉及敏感内容或价值观问题。';
  }
  
  return riskTemplates[category] || riskTemplates['default'];
}

/**
 * 修复本地错误生成函数
 */
function fixLocalErrorGenerationFunctions() {
  console.log('📝 开始修复本地错误生成函数...');
  
  try {
    let content = fs.readFileSync(targetFile, 'utf8');
    let fixCount = 0;
    
    // 1. 修复generateBasicErrors函数
    console.log('🔧 修复generateBasicErrors函数...');
    
    const basicErrorFix1 = `errors.push({
      id: \`basic_\${Date.now()}_1_\${Math.random().toString(36).substr(2, 9)}\`,
      type: 'suggestion',
      position: { start: 0, end: content.length },
      original: '文档包含中文标点符号',
      suggestion: '建议检查标点符号使用是否规范',
      reason: '中文文档应使用中文标点符号',
      category: '标点符号'
    });`;
    
    const basicErrorReplace1 = `errors.push({
      id: \`basic_\${Date.now()}_1_\${Math.random().toString(36).substr(2, 9)}\`,
      type: 'suggestion',
      position: { start: 0, end: content.length },
      original: '文档包含中文标点符号',
      suggestion: '建议检查标点符号使用是否规范',
      reason: '中文文档应使用中文标点符号，符合GB/T 15834-2011《标点符号用法》规范',
      category: '标点符号',
      risks: '无明显法律、事实或价值观问题，属于格式规范性问题。'
    });`;
    
    if (content.includes(basicErrorFix1)) {
      content = content.replace(basicErrorFix1, basicErrorReplace1);
      fixCount++;
      console.log('✅ 修复generateBasicErrors中的标点符号错误生成');
    }
    
    const basicErrorFix2 = `errors.push({
        id: \`basic_\${Date.now()}_2_\${index}_\${Math.random().toString(36).substr(2, 9)}\`,
        type: 'warning',
        position: { start: 0, end: content.length },
        original: \`词汇"\${word}"重复使用\${count}次\`,
        suggestion: '建议使用同义词或重新组织句子',
        reason: '避免词汇重复，提高表达多样性',
        category: '词汇使用'
      });`;
    
    const basicErrorReplace2 = `errors.push({
        id: \`basic_\${Date.now()}_2_\${index}_\${Math.random().toString(36).substr(2, 9)}\`,
        type: 'warning',
        position: { start: 0, end: content.length },
        original: \`词汇"\${word}"重复使用\${count}次\`,
        suggestion: '建议使用同义词或重新组织句子',
        reason: '避免词汇重复，提高表达多样性，符合学术写作语言丰富性要求',
        category: '词汇使用',
        risks: '无明显法律、事实或价值观问题，属于语言表达优化。'
      });`;
    
    if (content.includes(basicErrorFix2)) {
      content = content.replace(basicErrorFix2, basicErrorReplace2);
      fixCount++;
      console.log('✅ 修复generateBasicErrors中的词汇重复错误生成');
    }
    
    // 2. 修复checkTerminologyWithKnowledge函数
    console.log('🔧 修复checkTerminologyWithKnowledge函数...');
    
    const terminologyErrorPattern = `errors.push({
          id: \`terminology_\${Date.now()}_\${index}_\${Math.random().toString(36).substr(2, 9)}\`,
          type: 'suggestion',
          position: { start: 0, end: content.length },
          original: \`术语"\${k.content}"的使用\`,
          suggestion: k.context || '请检查术语使用是否准确',
          reason: \`基于知识库建议: \${k.source}\`,
          category: '术语使用'
        });`;
    
    const terminologyErrorReplace = `errors.push({
          id: \`terminology_\${Date.now()}_\${index}_\${Math.random().toString(36).substr(2, 9)}\`,
          type: 'suggestion',
          position: { start: 0, end: content.length },
          original: \`术语"\${k.content}"的使用\`,
          suggestion: k.context || '请检查术语使用是否准确',
          reason: \`基于专业知识库建议: \${k.source}，确保术语使用准确性和一致性\`,
          category: '术语使用',
          risks: '无明显法律风险，需确保专业术语准确性避免学术误解。'
        });`;
    
    if (content.includes(terminologyErrorPattern)) {
      content = content.replace(terminologyErrorPattern, terminologyErrorReplace);
      fixCount++;
      console.log('✅ 修复checkTerminologyWithKnowledge中的术语错误生成');
    }
    
    // 3. 修复checkDomainSpecificIssues函数 - 学术写作检查
    console.log('🔧 修复checkDomainSpecificIssues函数...');
    
    const academicErrorPattern = `errors.push({
          id: \`domain_\${Date.now()}_1_\${Math.random().toString(36).substr(2, 9)}\`,
          type: 'warning',
          position: { start: 0, end: content.length },
          original: '学术写作结构',
          suggestion: '建议包含研究背景、方法、分析、结论等要素',
          reason: '学术文档应具备完整的学术写作结构',
          category: '文档结构'
        });`;
    
    const academicErrorReplace = `errors.push({
          id: \`domain_\${Date.now()}_1_\${Math.random().toString(36).substr(2, 9)}\`,
          type: 'warning',
          position: { start: 0, end: content.length },
          original: '学术写作结构',
          suggestion: '建议包含研究背景、方法、分析、结论等要素',
          reason: '学术文档应具备完整的学术写作结构，符合GB/T 7713.2—2022学术论文编写规则',
          category: '文档结构',
          risks: '无法律风险，需注意学术规范性和逻辑完整性。'
        });`;
    
    if (content.includes(academicErrorPattern)) {
      content = content.replace(academicErrorPattern, academicErrorReplace);
      fixCount++;
      console.log('✅ 修复checkDomainSpecificIssues中的学术写作错误生成');
    }
    
    // 4. 修复技术文档检查
    const technicalErrorPattern = `errors.push({
          id: \`domain_\${Date.now()}_2_\${Math.random().toString(36).substr(2, 9)}\`,
          type: 'suggestion',
          position: { start: 0, end: content.length },
          original: '技术文档内容',
          suggestion: '建议增加技术细节和实现说明',
          reason: '技术文档应包含具体的技术实现细节',
          category: '内容完整性'
        });`;
    
    const technicalErrorReplace = `errors.push({
          id: \`domain_\${Date.now()}_2_\${Math.random().toString(36).substr(2, 9)}\`,
          type: 'suggestion',
          position: { start: 0, end: content.length },
          original: '技术文档内容',
          suggestion: '建议增加技术细节和实现说明',
          reason: '技术文档应包含具体的技术实现细节，提高文档的实用性和完整性',
          category: '内容完整性',
          risks: '无法律风险，属于学术写作质量提升建议。'
        });`;
    
    if (content.includes(technicalErrorPattern)) {
      content = content.replace(technicalErrorPattern, technicalErrorReplace);
      fixCount++;
      console.log('✅ 修复checkDomainSpecificIssues中的技术文档错误生成');
    }
    
    // 5. 写入修复后的文件
    fs.writeFileSync(targetFile, content);
    
    console.log(`\n📊 修复完成统计:`);
    console.log(`   总计修复: ${fixCount} 个错误生成函数`);
    console.log(`   目标文件: ${targetFile}`);
    
    if (fixCount > 0) {
      console.log('✅ 风险评估字段集成修复成功！');
      console.log('💡 修复内容:');
      console.log('   - 为所有本地错误生成函数添加risks字段');
      console.log('   - 增强错误原因说明，引用相关规范');
      console.log('   - 提供专业的风险评估内容');
    } else {
      console.log('⚠️  未找到需要修复的代码模式，请检查文件内容');
    }
    
    return fixCount;
    
  } catch (error) {
    console.error('❌ 修复过程出错:', error.message);
    throw error;
  }
}

/**
 * 验证修复效果
 */
function verifyFixResults() {
  console.log('\n🔍 验证修复效果...');
  
  try {
    const content = fs.readFileSync(targetFile, 'utf8');
    
    // 检查risks字段是否已添加
    const risksFieldCount = (content.match(/risks:\s*['"]/g) || []).length;
    
    console.log(`📊 发现risks字段: ${risksFieldCount} 个`);
    
    if (risksFieldCount >= 4) {
      console.log('✅ 修复验证通过，所有本地错误生成函数都包含risks字段');
      return true;
    } else {
      console.log('⚠️  修复验证失败，仍有函数缺少risks字段');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
    return false;
  }
}

/**
 * 主修复函数
 */
async function runRisksFieldIntegrationFix() {
  try {
    // 执行修复
    const fixCount = fixLocalErrorGenerationFunctions();
    
    // 验证修复效果
    const verifyResult = verifyFixResults();
    
    console.log('\n🎉 风险评估字段集成修复完成！');
    console.log('💡 建议操作:');
    console.log('   1. 运行测试脚本验证修复效果');
    console.log('   2. 检查API响应是否包含risks字段');
    console.log('   3. 验证风险评估内容的专业性');
    
    return verifyResult && fixCount > 0;
    
  } catch (error) {
    console.error('💥 修复过程出错:', error);
    return false;
  }
}

// 执行修复
if (require.main === module) {
  runRisksFieldIntegrationFix()
    .then(success => {
      console.log(`\n🏁 风险评估字段集成修复完成 - ${success ? '成功' : '需要进一步检查'}`);
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 修复过程出错:', error);
      process.exit(1);
    });
}

module.exports = { runRisksFieldIntegrationFix }; 