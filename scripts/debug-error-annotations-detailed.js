#!/usr/bin/env node

console.log('🔧 错误标注详细调试指南');
console.log('='.repeat(50));

console.log('\n❌ 当前问题:');
console.log('- 右侧显示多个错误（语言表达、格式规范等）');
console.log('- 文档内容中完全没有错误标注的下划线');
console.log('- 错误标注功能完全失效');

console.log('\n🔍 新增详细调试信息:');
console.log('现在已经添加了完整的调试日志链，包括:');
console.log('1. renderDocumentWithAnnotations 调用详情');
console.log('2. 错误数据结构验证');
console.log('3. 错误过滤结果');
console.log('4. 逐个错误处理过程');
console.log('5. 错误位置验证');
console.log('6. HTML标注生成过程');
console.log('7. 最终结果统计');

console.log('\n🧪 详细测试步骤:');
console.log('1. 刷新浏览器页面');
console.log('2. 打开浏览器开发者工具 (F12)');
console.log('3. 切换到 Console 标签页');
console.log('4. 上传测试文档');
console.log('5. 等待AI分析完成');
console.log('6. 仔细查看控制台日志');

console.log('\n🔍 关键调试日志序列:');
console.log('步骤1: 内容和错误数据加载');
console.log('- 🔄 检测到新内容从父组件传入');
console.log('- 🔄 检测到错误数据更新，触发重新渲染');
console.log('- 🔄 强制初始渲染 (如果需要)');

console.log('\n步骤2: 渲染过程开始');
console.log('- 🎯 QingCiStyleEditor 渲染内容');
console.log('- 🎯 QingCiStyleEditor renderDocumentWithAnnotations 调用');

console.log('\n步骤3: 错误数据验证');
console.log('- errorsCount: 应该 > 0');
console.log('- errorsDetails: 每个错误应该有:');
console.log('  * id: 错误唯一标识');
console.log('  * type: error/warning/suggestion');
console.log('  * original: 错误文字');
console.log('  * position: {start: number, end: number}');
console.log('  * hasValidPosition: 应该为 true');

console.log('\n步骤4: 错误过滤');
console.log('- 🎯 错误过滤结果');
console.log('- totalErrors: 总错误数');
console.log('- activeErrorsCount: 活跃错误数 (应该 > 0)');
console.log('- processedContentsCount: 已处理错误数');

console.log('\n步骤5: 错误标注生成');
console.log('- 🎯 开始处理错误标注');
console.log('- 🎯 处理错误 1/N: 逐个错误的详细信息');
console.log('- 🎯 生成错误标注HTML: 每个错误的HTML片段');

console.log('\n步骤6: 最终结果');
console.log('- 🎯 错误标注处理完成');
console.log('- containsErrorSpans: 应该为 true');
console.log('- spanCount: 应该 > 0');
console.log('- 🎯 设置编辑器innerHTML');

console.log('\n🚨 可能的问题点:');
console.log('1. 错误数据问题:');
console.log('   - errorsCount = 0 → 没有错误数据传递');
console.log('   - hasValidPosition = false → 错误位置无效');
console.log('   - activeErrorsCount = 0 → 所有错误被过滤掉');

console.log('\n2. 位置验证问题:');
console.log('   - 🚫 错误位置无效，跳过 → 位置超出文档范围');
console.log('   - position.start < 0 或 position.end > documentLength');

console.log('\n3. HTML生成问题:');
console.log('   - containsErrorSpans = false → 没有生成错误标注');
console.log('   - spanCount = 0 → 没有生成span元素');

console.log('\n4. 渲染问题:');
console.log('   - 没有看到渲染日志 → useEffect未触发');
console.log('   - shouldRender状态问题');

console.log('\n📝 请按照以上步骤测试，并提供:');
console.log('1. 控制台的完整日志输出');
console.log('2. 特别注意以下关键数据:');
console.log('   - errorsCount 的值');
console.log('   - activeErrorsCount 的值');
console.log('   - containsErrorSpans 的值');
console.log('   - spanCount 的值');
console.log('3. 任何警告或错误信息');

console.log('\n🚀 现在请开始详细调试！');