"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiCollectionDatabaseModels = void 0;
const models_1 = require("./models");
const multi_collection_qdrant_client_1 = require("../vector/multi-collection-qdrant-client");
const deepseek_dual_client_1 = require("../deepseek/deepseek-dual-client");
/**
 * 多集合架构数据库模型
 * 整合PostgreSQL关系数据库和Qdrant多集合向量数据库
 */
class MultiCollectionDatabaseModels extends models_1.DatabaseModels {
    constructor() {
        super();
        this.multiCollectionQdrant = new multi_collection_qdrant_client_1.MultiCollectionQdrantClient();
        console.log('🚀 多集合数据库模型初始化完成');
    }
    /**
     * 获取文本的向量表示
     */
    async getLocalEmbedding(text) {
        const client = (0, deepseek_dual_client_1.getDualDeepSeekClient)();
        const embeddings = await client.createEmbedding(text);
        return embeddings[0]; // 返回第一个embedding
    }
    /**
     * 初始化多集合知识库架构
     */
    async initializeMultiCollectionArchitecture() {
        try {
            console.log('🚀 初始化多集合知识库架构...');
            // 1. 确保PostgreSQL表结构存在
            await this.initializeTables();
            // 2. 初始化所有63个Qdrant集合
            const collectionsResult = await this.multiCollectionQdrant.initializeAllCollections();
            if (collectionsResult.failed === 0) {
                return {
                    success: true,
                    message: `✅ 多集合架构初始化成功！创建了${collectionsResult.success}个领域集合`,
                    collections_result: collectionsResult
                };
            }
            else {
                return {
                    success: false,
                    message: `⚠️ 部分集合初始化失败：成功${collectionsResult.success}个，失败${collectionsResult.failed}个`,
                    collections_result: collectionsResult
                };
            }
        }
        catch (error) {
            console.error('❌ 多集合架构初始化失败:', error);
            return {
                success: false,
                message: '多集合架构初始化失败',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 智能领域识别：基于知识内容自动判断所属领域
     */
    async intelligentDomainDetection(content, context) {
        try {
            console.log('🧠 开始智能领域识别...');
            // 获取所有期刊领域用于比较
            const allDomains = await this.getAllJournalDomains();
            // 构建领域关键词映射
            const domainKeywords = {
                mathematics: ['数学', '方程', '函数', '微积分', '代数', '几何', '统计', '概率', '算法', '计算', '公式', '定理'],
                physics: ['物理', '力学', '电磁', '光学', '量子', '相对论', '能量', '动量', '电子', '原子', '分子', '波'],
                chemistry: ['化学', '元素', '化合物', '反应', '催化', '有机', '无机', '分析', '物理化学', '生物化学', '分子', '原子'],
                biology: ['生物', '细胞', '基因', 'DNA', 'RNA', '蛋白质', '酶', '进化', '生态', '植物', '动物', '微生物'],
                medicine: ['医学', '医疗', '疾病', '治疗', '诊断', '药物', '临床', '病理', '解剖', '生理', '免疫', '手术'],
                computer_science: ['计算机', '算法', '编程', '软件', '硬件', '网络', '数据库', '人工智能', '机器学习', '深度学习'],
                artificial_intelligence: ['人工智能', 'AI', '机器学习', '深度学习', '神经网络', '算法', '模型', '训练', '预测'],
                engineering: ['工程', '设计', '制造', '材料', '结构', '系统', '技术', '开发', '优化', '创新'],
                economics: ['经济', '金融', '市场', '投资', '贸易', '货币', '价格', '供需', '成本', '利润', '银行'],
                management_science: ['管理', '组织', '战略', '决策', '领导', '团队', '项目', '流程', '效率', '质量'],
                // ... 可以继续扩展其他领域的关键词
            };
            // 分析内容中的关键词
            const combinedText = (content + ' ' + (context || '')).toLowerCase();
            const domainScores = {};
            // 为每个领域计算匹配分数
            for (const domain of allDomains) {
                const keywords = domainKeywords[domain.code] || [];
                let score = 0;
                for (const keyword of keywords) {
                    const regex = new RegExp(keyword, 'gi');
                    const matches = combinedText.match(regex);
                    if (matches) {
                        score += matches.length;
                    }
                }
                domainScores[domain.code] = score;
            }
            // 找到得分最高的领域
            let bestDomain = 'general';
            let maxScore = 0;
            for (const [domain, score] of Object.entries(domainScores)) {
                if (score > maxScore && score > 0) {
                    maxScore = score;
                    bestDomain = domain;
                }
            }
            console.log(`🎯 领域识别结果: ${bestDomain} (得分: ${maxScore})`);
            return bestDomain;
        }
        catch (error) {
            console.error('❌ 智能领域识别失败:', error);
            return 'general'; // 默认返回通用领域
        }
    }
    /**
     * 添加知识项到多集合架构
     */
    async addKnowledgeItemToMultiCollection(knowledgeItem) {
        try {
            console.log('📚 添加知识项到多集合架构...');
            // 1. 智能领域识别（如果没有指定领域）
            let targetDomain = knowledgeItem.domain;
            if (!targetDomain || targetDomain === 'auto') {
                targetDomain = await this.intelligentDomainDetection(knowledgeItem.content, knowledgeItem.context);
                console.log(`🧠 自动识别领域: ${targetDomain}`);
            }
            // 2. 将知识项保存到PostgreSQL
            const knowledgeId = knowledgeItem.id || `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const vectorId = `vector_${knowledgeId}_${Date.now()}`;
            await this.addKnowledgeItem({
                id: knowledgeId,
                type: knowledgeItem.type,
                domain: targetDomain,
                content: knowledgeItem.content,
                context: knowledgeItem.context || '',
                source: knowledgeItem.source || '',
                confidence: knowledgeItem.confidence || 0.8,
                tags: knowledgeItem.tags || [],
                vector_id: vectorId,
                ownership_type: 'shared',
                created_at: knowledgeItem.created_at || new Date(),
                updated_at: knowledgeItem.updated_at || new Date()
            });
            // 3. 生成向量嵌入
            console.log('🔢 生成向量嵌入...');
            const embeddingText = `${knowledgeItem.content} ${knowledgeItem.context || ''}`;
            const vector = await this.getLocalEmbedding(embeddingText);
            if (!vector || vector.length === 0) {
                throw new Error('向量生成失败');
            }
            // 4. 添加到对应的领域集合
            const qdrantVectorId = `knowledge_${knowledgeId}_${Date.now()}`;
            await this.multiCollectionQdrant.upsertPoint(targetDomain, qdrantVectorId, vector, {
                knowledge_id: knowledgeId,
                type: knowledgeItem.type,
                domain: targetDomain,
                content: knowledgeItem.content,
                context: knowledgeItem.context || '',
                source: knowledgeItem.source || '',
                confidence: knowledgeItem.confidence || 0.8,
                tags: knowledgeItem.tags || [],
                created_at: new Date().toISOString()
            });
            console.log(`✅ 知识项添加成功: ${knowledgeId} → ${targetDomain} 集合`);
            return {
                success: true,
                message: '知识项添加成功',
                knowledge_id: knowledgeId,
                detected_domain: targetDomain,
                vector_id: qdrantVectorId
            };
        }
        catch (error) {
            console.error('❌ 添加知识项失败:', error);
            return {
                success: false,
                message: '添加知识项失败',
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 智能检索：基于文章领域进行高效搜索
     */
    async intelligentSearch(query, articleDomain, limit = 10) {
        try {
            console.log(`🔍 智能检索: "${query}" (文章领域: ${articleDomain || '未指定'})`);
            // 1. 生成查询向量
            const queryVector = await this.getLocalEmbedding(query);
            if (!queryVector || queryVector.length === 0) {
                throw new Error('查询向量生成失败');
            }
            // 2. 确定搜索领域
            let searchDomains = [];
            if (articleDomain && articleDomain !== 'general') {
                // 搜索指定领域和通用集合
                searchDomains = [articleDomain, 'general'];
            }
            else if (articleDomain === 'general') {
                // 只搜索通用集合
                searchDomains = ['general'];
            }
            else {
                // 未指定领域，智能识别后搜索
                const detectedDomain = await this.intelligentDomainDetection(query);
                searchDomains = detectedDomain !== 'general' ? [detectedDomain, 'general'] : ['general'];
            }
            console.log(`🎯 搜索领域: ${searchDomains.join(', ')}`);
            // 3. 执行多领域并行搜索
            const vectorResults = await this.multiCollectionQdrant.searchInMultipleDomains(searchDomains, queryVector, limit);
            // 4. 整理搜索结果
            const results = vectorResults.map(result => ({
                id: result.payload.knowledge_id || result.id,
                score: result.score,
                content: result.payload.content || '',
                domain: result.domain,
                collection: result.collection,
                type: result.payload.type || 'unknown',
                context: result.payload.context,
                source: result.payload.source
            }));
            console.log(`✅ 智能检索完成: 找到${results.length}个相关结果`);
            return {
                success: true,
                results,
                search_info: {
                    query_vector_length: queryVector.length,
                    searched_domains: searchDomains,
                    total_results: results.length
                }
            };
        }
        catch (error) {
            console.error('❌ 智能检索失败:', error);
            return {
                success: false,
                results: [],
                search_info: {
                    query_vector_length: 0,
                    searched_domains: [],
                    total_results: 0
                },
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 获取多集合架构统计信息
     */
    async getMultiCollectionStats() {
        try {
            console.log('📊 获取多集合架构统计信息...');
            // 1. 获取Qdrant集合统计
            const qdrantHealthCheck = await this.multiCollectionQdrant.healthCheck();
            // 2. 获取PostgreSQL统计
            const postgresqlStats = await this.getKnowledgeLibraryStats();
            // 3. 整合统计信息
            const stats = {
                total_collections: qdrantHealthCheck.total_collections,
                active_collections: qdrantHealthCheck.active_collections,
                empty_collections: qdrantHealthCheck.empty_collections,
                total_knowledge_items: (postgresqlStats.total_private || 0) + (postgresqlStats.total_shared || 0),
                total_vectors: qdrantHealthCheck.total_points,
                collections_detail: qdrantHealthCheck.collections_status.map(collection => ({
                    domain: collection.domain,
                    collection_name: collection.collection,
                    knowledge_count: 0, // 可以通过PostgreSQL查询获得
                    vector_count: collection.points,
                    status: collection.status
                }))
            };
            console.log(`✅ 统计信息获取完成: ${stats.active_collections}个活跃集合, ${stats.total_vectors}个向量`);
            return {
                success: true,
                stats,
                postgresql_stats: postgresqlStats
            };
        }
        catch (error) {
            console.error('❌ 获取统计信息失败:', error);
            return {
                success: false,
                stats: {
                    total_collections: 0,
                    active_collections: 0,
                    empty_collections: 0,
                    total_knowledge_items: 0,
                    total_vectors: 0,
                    collections_detail: []
                },
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * 数据迁移：从单集合迁移到多集合架构
     */
    async migrateToMultiCollection() {
        try {
            console.log('🔄 开始数据迁移：单集合 → 多集合架构...');
            // 1. 获取所有现有知识项
            const allKnowledgeItems = await this.getAllKnowledgeItems(1000); // 获取更多数据
            const migrationResults = {
                success: true,
                message: '数据迁移完成',
                migrated_count: 0,
                failed_count: 0,
                details: []
            };
            // 2. 逐个迁移知识项
            for (const item of allKnowledgeItems) {
                try {
                    // 重新生成向量并添加到对应领域集合
                    const embeddingText = `${item.content} ${item.context || ''}`;
                    const vector = await this.getLocalEmbedding(embeddingText);
                    if (vector && vector.length > 0) {
                        const vectorId = `migrated_${item.id}_${Date.now()}`;
                        await this.multiCollectionQdrant.upsertPoint(item.domain || 'general', vectorId, vector, {
                            knowledge_id: item.id,
                            type: item.type,
                            domain: item.domain || 'general',
                            content: item.content,
                            context: item.context || '',
                            source: item.source || '',
                            confidence: item.confidence || 0.8,
                            tags: item.tags || [],
                            migrated_at: new Date().toISOString()
                        });
                        migrationResults.migrated_count++;
                        migrationResults.details.push({
                            knowledge_id: item.id,
                            status: 'success',
                            target_domain: item.domain || 'general'
                        });
                    }
                }
                catch (error) {
                    migrationResults.failed_count++;
                    migrationResults.details.push({
                        knowledge_id: item.id,
                        status: 'failed',
                        target_domain: item.domain || 'general',
                        error: error instanceof Error ? error.message : String(error)
                    });
                    console.error(`❌ 迁移知识项失败: ${item.id}`, error);
                }
            }
            console.log(`✅ 数据迁移完成: 成功${migrationResults.migrated_count}个, 失败${migrationResults.failed_count}个`);
            return migrationResults;
        }
        catch (error) {
            console.error('❌ 数据迁移失败:', error);
            return {
                success: false,
                message: '数据迁移失败',
                migrated_count: 0,
                failed_count: 0,
                details: []
            };
        }
    }
    /**
     * 获取Qdrant客户端实例（用于高级操作）
     */
    getMultiCollectionQdrantClient() {
        return this.multiCollectionQdrant;
    }
}
exports.MultiCollectionDatabaseModels = MultiCollectionDatabaseModels;
