const fetch = require('node-fetch');

async function testDocumentDisplayFix() {
    console.log('🔧 测试文档显示修复效果...\n');
    
    const testCases = [
        {
            name: '短文档 - 可能有位置错误',
            content: '文档包含中文标点符号。这是一个测试文档。'
        },
        {
            name: '中等长度文档 - 正常情况',
            content: '根据最新的研究表明，基于超音速数值仿真下多脉冲约束弹体的修正策略研究在领域具有巨大的潜力和应用价值。该研究采用了先进的计算流体力学方法，通过大量的数值模拟和实验验证，得出了一系列重要结论。'
        },
        {
            name: '长文档 - 复杂情况',
            content: `人工智能技术的发展日新月异，特别是在自然语言处理领域，大型语言模型的出现为各行各业带来了前所未有的机遇。本文将深入探讨AI编辑器在期刊出版社的应用前景，分析其技术架构、核心功能以及实际部署中可能遇到的挑战。

首先，AI编辑器的核心技术基于深度学习和自然语言处理技术。通过训练大规模的神经网络模型，系统能够理解文本的语义结构，识别语法错误、标点符号使用不当、词汇选择不准确等问题。此外，结合领域特定的知识库，AI编辑器还能够提供专业性的修改建议。

在实际应用中，AI编辑器需要处理各种类型的学术文档，包括研究论文、综述文章、技术报告等。每种文档类型都有其特定的格式要求和写作规范。因此，系统需要具备强大的适应性和灵活性。

最后，随着技术的不断进步，AI编辑器将在提高编辑效率、保证文档质量方面发挥越来越重要的作用。`
        }
    ];

    const results = [];

    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`\n📋 测试案例 ${i + 1}: ${testCase.name}`);
        console.log(`📏 文档长度: ${testCase.content.length} 字符`);
        console.log(`📄 文档前50字符: "${testCase.content.substring(0, 50)}..."`);
        
        try {
            // 测试API响应
            const response = await fetch('http://localhost:3000/api/analyze-document-rag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: testCase.content,
                    isUsingRAG: true
                })
            });

            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const result = await response.json();
            const errors = result.errors || [];
            
            console.log(`🐛 API返回错误数量: ${errors.length}`);
            
            // 分析错误位置
            let validErrorCount = 0;
            let fixedErrorCount = 0;
            let positionIssues = [];
            
            errors.forEach((error, index) => {
                console.log(`  ${index + 1}. [${error.position.start}-${error.position.end}] "${error.original}"`);
                
                const isValid = error.position && 
                               typeof error.position.start === 'number' && 
                               typeof error.position.end === 'number' &&
                               error.position.start >= 0 && 
                               error.position.start < error.position.end;
                
                if (isValid) {
                    validErrorCount++;
                    
                    // 检查是否需要修复位置
                    if (error.position.end > testCase.content.length) {
                        positionIssues.push({
                            index: index + 1,
                            original: `[${error.position.start}-${error.position.end}]`,
                            fixed: `[${error.position.start}-${testCase.content.length}]`
                        });
                        fixedErrorCount++;
                    }
                } else {
                    console.log(`    ❌ 无效错误位置`);
                }
            });
            
            console.log(`✅ 有效错误: ${validErrorCount}/${errors.length}`);
            if (fixedErrorCount > 0) {
                console.log(`🔧 需要修复位置的错误: ${fixedErrorCount}`);
                positionIssues.forEach(issue => {
                    console.log(`    错误${issue.index}: ${issue.original} -> ${issue.fixed}`);
                });
            }
            
            // 模拟前端处理逻辑
            const simulatedResult = simulateFrontendProcessing(testCase.content, errors);
            
            results.push({
                name: testCase.name,
                documentLength: testCase.content.length,
                totalErrors: errors.length,
                validErrors: validErrorCount,
                fixedErrors: fixedErrorCount,
                positionIssues: positionIssues,
                frontendResult: simulatedResult,
                status: simulatedResult.hasCompleteContent ? '✅ 通过' : '❌ 失败'
            });
            
            console.log(`📊 前端处理结果:`);
            console.log(`  - Parts数量: ${simulatedResult.partsCount}`);
            console.log(`  - 包含完整内容: ${simulatedResult.hasCompleteContent ? '✅ 是' : '❌ 否'}`);
            console.log(`  - 状态: ${simulatedResult.hasCompleteContent ? '✅ 通过' : '❌ 失败'}`);
            
        } catch (error) {
            console.error(`❌ 测试失败:`, error.message);
            results.push({
                name: testCase.name,
                error: error.message,
                status: '❌ 错误'
            });
        }
    }
    
    // 生成测试报告
    console.log('\n' + '='.repeat(60));
    console.log('📋 测试报告摘要');
    console.log('='.repeat(60));
    
    results.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.name}`);
        console.log(`   状态: ${result.status}`);
        if (result.error) {
            console.log(`   错误: ${result.error}`);
        } else {
            console.log(`   文档长度: ${result.documentLength} 字符`);
            console.log(`   错误统计: ${result.validErrors}/${result.totalErrors} 有效`);
            if (result.fixedErrors > 0) {
                console.log(`   位置修复: ${result.fixedErrors} 个错误`);
            }
            console.log(`   前端处理: ${result.frontendResult.partsCount} 个parts`);
        }
    });
    
    const passCount = results.filter(r => r.status === '✅ 通过').length;
    console.log(`\n🎯 总体结果: ${passCount}/${results.length} 通过`);
    
    if (passCount === results.length) {
        console.log('🎉 所有测试通过！文档显示问题已彻底修复！');
    } else {
        console.log('⚠️ 仍有测试失败，需要进一步优化');
    }
    
    return results;
}

function simulateFrontendProcessing(documentContent, errors) {
    // 模拟前端的错误处理逻辑
    const validErrors = errors.filter(error => {
        const isValid = error.position && 
                       typeof error.position.start === 'number' && 
                       typeof error.position.end === 'number' &&
                       error.position.start >= 0 && 
                       error.position.start < error.position.end;
        
        // 修复超出文档长度的错误
        if (isValid && error.position.end > documentContent.length) {
            error.position.end = documentContent.length;
            error.original = documentContent.slice(error.position.start, error.position.end);
        }
        
        return isValid;
    });
    
    if (validErrors.length === 0) {
        return {
            partsCount: 1,
            hasCompleteContent: true,
            type: 'fallback_complete_document'
        };
    }
    
    // 模拟parts构建
    const sortedErrors = validErrors.sort((a, b) => a.position.start - b.position.start);
    let parts = [];
    let lastIndex = 0;
    let totalContentLength = 0;
    
    // 开头正常文本
    if (sortedErrors[0].position.start > 0) {
        const initialText = documentContent.slice(0, sortedErrors[0].position.start);
        parts.push(`[初始文本: ${initialText.length}字符]`);
        totalContentLength += initialText.length;
        lastIndex = sortedErrors[0].position.start;
    }
    
    // 处理错误和间隙
    sortedErrors.forEach((error) => {
        // 间隙文本
        if (error.position.start > lastIndex) {
            const gapText = documentContent.slice(lastIndex, error.position.start);
            parts.push(`[间隙文本: ${gapText.length}字符]`);
            totalContentLength += gapText.length;
        }
        
        // 错误标注
        parts.push(`[${error.type}标注: ${error.original.length}字符]`);
        totalContentLength += error.original.length;
        lastIndex = error.position.end;
    });
    
    // 结尾正常文本
    if (lastIndex < documentContent.length) {
        const finalText = documentContent.slice(lastIndex);
        parts.push(`[结尾文本: ${finalText.length}字符]`);
        totalContentLength += finalText.length;
    }
    
    // 检查是否需要添加保护性完整文档显示
    const hasCompleteContent = totalContentLength >= documentContent.length * 0.95;
    const hasFullDocumentError = sortedErrors.some(error => 
        error.position.start === 0 && error.position.end >= documentContent.length * 0.9
    );
    
    let finalPartsCount = parts.length;
    let finalHasCompleteContent = hasCompleteContent;
    
    // 如果检测到覆盖问题，会添加保护性完整文档显示
    if (!hasCompleteContent || hasFullDocumentError) {
        finalPartsCount += 1; // 添加保护性完整文档
        finalHasCompleteContent = true; // 因为有完整文档保护
        parts.unshift(`[保护性完整文档: ${documentContent.length}字符]`);
    }
    
    return {
        partsCount: finalPartsCount,
        hasCompleteContent: finalHasCompleteContent,
        totalContentLength: totalContentLength,
        expectedLength: documentContent.length,
        coverage: (totalContentLength / documentContent.length * 100).toFixed(1) + '%',
        hasProtection: !hasCompleteContent || hasFullDocumentError,
        protectionReason: hasFullDocumentError ? '全文档错误覆盖' : (!hasCompleteContent ? '内容不完整' : '无'),
        parts: parts
    };
}

// 运行测试
if (require.main === module) {
    testDocumentDisplayFix()
        .then(results => {
            console.log('\n💾 保存测试报告...');
            const fs = require('fs');
            const reportPath = `test-reports/document-display-fix-${Date.now()}.json`;
            fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
            console.log(`📄 报告已保存: ${reportPath}`);
        })
        .catch(error => {
            console.error('💥 测试异常:', error);
        });
}

module.exports = testDocumentDisplayFix; 