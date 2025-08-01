#!/usr/bin/env node

console.log('🔧 HTML结构修复验证');
console.log('='.repeat(50));

console.log('\n🚨 发现的根本问题:');
console.log('- 在span标签内嵌套p标签 (无效HTML结构)');
console.log('- 浏览器自动修正嵌套，导致样式失效');
console.log('- 错误标注span被浏览器重新排列');

console.log('\n🔧 HTML结构修复:');
console.log('1. 移除错误文本中的p标签嵌套');
console.log('2. 直接使用原始文本 + 换行符处理');
console.log('3. 确保span标签内只有文本和br标签');
console.log('4. 整体HTML结构: <p>文本<span>错误文本</span>文本</p>');

console.log('\n🎯 修复前的问题结构:');
console.log('<span style="..."><p>错误文字</p></span>  ❌ 无效');

console.log('\n🎯 修复后的正确结构:');
console.log('<p>正常文字<span style="...">错误文字</span>正常文字</p>  ✅ 有效');

console.log('\n🧪 测试步骤:');
console.log('1. 刷新浏览器页面');
console.log('2. 上传测试文档');
console.log('3. 等待AI分析完成');
console.log('4. 在控制台执行检查命令');

console.log('\n💡 控制台检查命令:');
console.log('// 1. 检查HTML结构');
console.log('const spans = document.querySelectorAll(".error-underline, .warning-underline, .suggestion-underline");');
console.log('console.log("错误标注数量:", spans.length);');
console.log('spans.forEach((span, i) => {');
console.log('  console.log(`错误${i+1} HTML:`, span.outerHTML.substring(0, 200));');
console.log('  console.log(`错误${i+1} 内联样式:`, span.style.cssText);');
console.log('  console.log(`错误${i+1} 背景:`, span.style.background);');
console.log('  console.log(`错误${i+1} 边框:`, span.style.borderBottom);');
console.log('});');

console.log('\n🎯 预期结果:');
console.log('- span标签内不应该有p标签');
console.log('- 每个span都有完整的内联样式');
console.log('- 背景和边框样式都存在');
console.log('- 下划线清晰可见');

console.log('\n🔍 如果仍然不可见:');
console.log('1. 检查span标签是否被正确渲染');
console.log('2. 检查内联样式是否完整');
console.log('3. 尝试手动添加更明显的样式测试');

console.log('\n💡 强制测试样式 (控制台执行):');
console.log('document.querySelectorAll(".error-underline").forEach(el => {');
console.log('  el.style.backgroundColor = "rgba(255, 0, 0, 0.3)";');
console.log('  el.style.borderBottom = "3px solid red";');
console.log('  el.style.color = "red";');
console.log('});');

console.log('\n🚀 HTML结构已修复，现在请测试！');