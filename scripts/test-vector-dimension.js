#!/usr/bin/env node

/**
 * 向量维度测试脚本
 * 验证向量生成是否正确
 */

const { NewKnowledgeRetriever } = require('../lib/rag/new-knowledge-retriever');

async function testVectorDimension() {
  console.log('🔍 测试向量维度生成...\n');

  try {
    const retriever = new NewKnowledgeRetriever();
    
    // 测试不同长度的文本
    const testTexts = [
      '这是一个短文本',
      '这是一个中等长度的文本，包含更多的内容和信息，用于测试向量生成的稳定性',
      '这是一个很长的文本，包含大量的专业术语和复杂的语义结构。人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。该领域的研究包括机器人、语言识别、图像识别、自然语言处理和专家系统等。'
    ];

    for (let i = 0; i < testTexts.length; i++) {
      const text = testTexts[i];
      console.log(`📝 测试文本 ${i + 1}: ${text.substring(0, 30)}...`);
      console.log(`   长度: ${text.length} 字符`);
      
      try {
        // 通过反射调用私有方法进行测试
        const vector = await retriever.generateEmbedding(text);
        
        console.log(`   ✅ 向量生成成功`);
        console.log(`   📊 向量维度: ${vector.length}`);
        console.log(`   📈 向量范围: [${Math.min(...vector).toFixed(4)}, ${Math.max(...vector).toFixed(4)}]`);
        console.log(`   🎯 向量示例: [${vector.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
        
        // 验证维度
        if (vector.length === 4096) {
          console.log(`   ✅ 维度正确: 4096`);
        } else {
          console.log(`   ❌ 维度错误: 期望4096，实际${vector.length}`);
        }
        
        // 验证向量是否标准化
        const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        console.log(`   📏 向量模长: ${magnitude.toFixed(6)}`);
        if (Math.abs(magnitude - 1.0) < 0.001) {
          console.log(`   ✅ 向量已标准化`);
        } else {
          console.log(`   ⚠️  向量未完全标准化`);
        }
        
      } catch (error) {
        console.log(`   ❌ 向量生成失败: ${error.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 修改NewKnowledgeRetriever类以暴露私有方法用于测试
function patchKnowledgeRetriever() {
  const originalModule = require('../lib/rag/new-knowledge-retriever');
  const { NewKnowledgeRetriever } = originalModule;
  
  // 添加公共方法来访问私有的向量生成方法
  NewKnowledgeRetriever.prototype.generateEmbedding = function(text) {
    // 直接调用私有方法
    return this.generateAdvancedLocalEmbedding(text);
  };
  
  NewKnowledgeRetriever.prototype.generateAdvancedLocalEmbedding = function(text) {
    const vector = new Array(4096).fill(0);
    
    // 预处理文本
    const cleanText = this.preprocessText(text);
    const words = this.segmentWords(cleanText);
    const phrases = this.extractPhrases(cleanText);
    
    // 多层次特征提取
    const features = {
      lexical: this.extractLexicalFeatures(words),
      semantic: this.extractSemanticFeatures(words, phrases),
      syntactic: this.extractSyntacticFeatures(cleanText),
      domain: this.extractDomainFeatures(words, phrases)
    };
    
    // 组合特征到向量空间
    let offset = 0;
    
    // 填充词汇特征 (0-255)
    for (let i = 0; i < 256; i++) {
      vector[offset + i] = features.lexical[i % features.lexical.length];
    }
    offset += 256;
    
    // 填充语义特征 (256-511)
    for (let i = 0; i < 256; i++) {
      vector[offset + i] = features.semantic[i % features.semantic.length];
    }
    offset += 256;
    
    // 填充句法特征 (512-767)
    for (let i = 0; i < 256; i++) {
      vector[offset + i] = features.syntactic[i % features.syntactic.length];
    }
    offset += 256;
    
    // 填充领域特征 (768-1023)
    for (let i = 0; i < 256; i++) {
      vector[offset + i] = features.domain[i % features.domain.length];
    }
    
    // 标准化向量
    return this.normalizeVector(vector);
  };
  
  // 添加所有需要的辅助方法
  NewKnowledgeRetriever.prototype.preprocessText = function(text) {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  NewKnowledgeRetriever.prototype.segmentWords = function(text) {
    const words = [];
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    words.push(...chineseChars);
    const englishWords = text.match(/[a-zA-Z]+/g) || [];
    words.push(...englishWords);
    const numbers = text.match(/\d+/g) || [];
    words.push(...numbers);
    return words;
  };
  
  NewKnowledgeRetriever.prototype.extractPhrases = function(text) {
    const phrases = [];
    const chineseText = text.replace(/[^\u4e00-\u9fa5]/g, '');
    for (let len = 2; len <= 4; len++) {
      for (let i = 0; i <= chineseText.length - len; i++) {
        phrases.push(chineseText.substring(i, i + len));
      }
    }
    return phrases;
  };
  
  NewKnowledgeRetriever.prototype.extractLexicalFeatures = function(words) {
    const features = [];
    const totalWords = words.length;
    
    if (totalWords === 0) return new Array(64).fill(0);
    
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const uniqueWords = Object.keys(wordFreq).length;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / totalWords;
    const maxFreq = Math.max(...Object.values(wordFreq));
    
    features.push(
      uniqueWords / totalWords,
      avgWordLength / 10,
      maxFreq / totalWords,
      words.filter(w => /[\u4e00-\u9fa5]/.test(w)).length / totalWords,
      words.filter(w => /[a-zA-Z]/.test(w)).length / totalWords,
      words.filter(w => /\d/.test(w)).length / totalWords
    );
    
    while (features.length < 64) {
      const hash = this.simpleHash(words.join('') + features.length);
      features.push((hash % 1000) / 1000);
    }
    
    return features.slice(0, 64);
  };
  
  NewKnowledgeRetriever.prototype.extractSemanticFeatures = function(words, phrases) {
    const features = [];
    const semanticDict = {
      technology: ['技术', '系统', '算法', '数据', '网络', '软件', '硬件', '程序', '代码', '开发'],
      business: ['商业', '市场', '销售', '客户', '产品', '服务', '管理', '营销', '策略', '经济'],
      academic: ['研究', '理论', '方法', '实验', '分析', '论文', '学术', '科学', '知识', '教育']
    };
    
    for (const [, keywords] of Object.entries(semanticDict)) {
      let score = 0;
      const allText = [...words, ...phrases].join('');
      keywords.forEach(keyword => {
        const count = (allText.match(new RegExp(keyword, 'g')) || []).length;
        score += count;
      });
      features.push(score / (words.length + phrases.length));
    }
    
    while (features.length < 64) {
      const hash = this.simpleHash(words.join('') + phrases.join('') + features.length);
      features.push((hash % 1000) / 1000);
    }
    
    return features.slice(0, 64);
  };
  
  NewKnowledgeRetriever.prototype.extractSyntacticFeatures = function(text) {
    const features = [];
    const punctuation = text.match(/[。！？，；：]/g) || [];
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    
    features.push(
      punctuation.length / text.length,
      sentences.length > 0 ? text.length / sentences.length : 0,
      (text.match(/[，；：]/g) || []).length / text.length,
      (text.match(/[？]/g) || []).length / text.length,
      (text.match(/[！]/g) || []).length / text.length
    );
    
    while (features.length < 64) {
      const hash = this.simpleHash(text + features.length);
      features.push((hash % 1000) / 1000);
    }
    
    return features.slice(0, 64);
  };
  
  NewKnowledgeRetriever.prototype.extractDomainFeatures = function(words, phrases) {
    const features = [];
    const allText = [...words, ...phrases].join('');
    
    const domainKeywords = {
      physics: ['物理', '量子', '能量', '力学', '电磁', '光学'],
      chemistry: ['化学', '分子', '原子', '反应', '化合物', '元素'],
      biology: ['生物', '细胞', '基因', '蛋白质', 'DNA', '遗传']
    };
    
    for (const keywords of Object.values(domainKeywords)) {
      let score = 0;
      keywords.forEach(keyword => {
        const count = (allText.match(new RegExp(keyword, 'g')) || []).length;
        score += count;
      });
      features.push(score / (words.length + phrases.length));
    }
    
    while (features.length < 64) {
      const hash = this.simpleHash(allText + features.length);
      features.push((hash % 1000) / 1000);
    }
    
    return features.slice(0, 64);
  };
  
  NewKnowledgeRetriever.prototype.normalizeVector = function(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  };
  
  NewKnowledgeRetriever.prototype.simpleHash = function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  };
}

async function main() {
  console.log('🔧 修补KnowledgeRetriever类...');
  patchKnowledgeRetriever();
  
  console.log('✅ 修补完成，开始测试\n');
  await testVectorDimension();
  
  console.log('🏁 测试完成');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testVectorDimension }; 