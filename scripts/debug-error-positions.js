console.log('🔍 调试错误位置准确性');

const content = `基于超音速数值仿真的某弹体的修正策略研究

引言

这是是关于"引言"部分的详细内容。这部分将介绍人工超音速数值仿真技术下多脉冲的某弹体的修正策略研究的应用前景。

根据最新的研究表明，基于超音速数值仿真技术下多脉冲的某弹体的修正策略研究在领域被有了"这的应用前景。

重要发现：基于超音速数值仿真技术下多脉冲的某弹体的修正策略研究的研究表明，这一领域具有巨大的潜力和应用价值。

值得注意的是，这些研究成果对未来发展具有重要意义。

研究中的主要问题包括：

如何提高基于超音速数值仿真技术下多脉冲的某弹体全个章节中多个章节（如引言、研究背景、相关研究与文献综述、研究方法、研究结果、讨论、结论）内容高度重复率

如何降低基于超音速数值仿真技术下多脉冲的某弹体的修正策略研究的成本`;

const errors = [
  {
    id: 'error1',
    type: 'error',
    position: { start: 26, end: 29 },
    original: '这是是',
    suggestion: '这是',
    reason: '重复词语',
    category: '语法错误'
  },
  {
    id: 'error2', 
    type: 'warning',
    position: { start: 49, end: 51 },
    original: '人工',
    suggestion: '基于',
    reason: '词语使用不当',
    category: '用词不当'
  },
  {
    id: 'error3',
    type: 'error',
    position: { start: 119, end: 125 },
    original: '在领域被有了',
    suggestion: '在该领域具有',
    reason: '语法错误',
    category: '语法错误'
  },
  {
    id: 'error4',
    type: 'suggestion',
    position: { start: 125, end: 127 },
    original: '"这',
    suggestion: '广阔',
    reason: '表达更准确',
    category: '表达优化'
  },
  {
    id: 'error5',
    type: 'warning',
    position: { start: 254, end: 256 },
    original: '全个',
    suggestion: '各个',
    reason: '用词不规范',
    category: '用词规范'
  }
];

console.log('📄 文档内容长度:', content.length);
console.log('📄 文档内容预览:', content.substring(0, 100) + '...');
console.log('');

errors.forEach((error, index) => {
  console.log(`🔍 错误 ${index + 1} (${error.id}):`);
  console.log(`   类型: ${error.type}`);
  console.log(`   位置: [${error.position.start}-${error.position.end}]`);
  console.log(`   期望文本: "${error.original}"`);
  
  const actualText = content.substring(error.position.start, error.position.end);
  console.log(`   实际文本: "${actualText}"`);
  
  const isMatch = actualText === error.original;
  console.log(`   匹配状态: ${isMatch ? '✅ 匹配' : '❌ 不匹配'}`);
  
  if (!isMatch) {
    // 尝试找到正确位置
    const correctStart = content.indexOf(error.original);
    if (correctStart !== -1) {
      const correctEnd = correctStart + error.original.length;
      console.log(`   建议位置: [${correctStart}-${correctEnd}]`);
      console.log(`   建议文本: "${content.substring(correctStart, correctEnd)}"`);
    } else {
      console.log(`   ⚠️ 在文档中未找到期望文本: "${error.original}"`);
    }
  }
  
  console.log('');
});

// 分析文档结构
console.log('📊 文档结构分析:');
const lines = content.split('\n');
let charCount = 0;
lines.forEach((line, index) => {
  const lineStart = charCount;
  const lineEnd = charCount + line.length;
  console.log(`   第${index + 1}行 [${lineStart}-${lineEnd}]: "${line}"`);
  charCount += line.length + 1; // +1 for newline character
}); 