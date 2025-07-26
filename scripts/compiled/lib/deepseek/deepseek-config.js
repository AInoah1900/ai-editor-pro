"use strict";
/**
 * DeepSeek API配置管理器
 * 严格按照配置中心和环境变量配置，不进行智能切换
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekConfigManager = exports.DEFAULT_DEEPSEEK_CONFIG = void 0;
exports.getDeepSeekConfig = getDeepSeekConfig;
/**
 * 默认配置 - 默认使用云端API，超时时间10分钟
 */
exports.DEFAULT_DEEPSEEK_CONFIG = {
    provider: 'cloud', // 默认使用云端API
    cloudConfig: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseURL: process.env.DEEPSEEK_CLOUD_BASE_URL || 'https://api.deepseek.com/v1',
        model: process.env.DEEPSEEK_CLOUD_MODEL || 'deepseek-chat'
    },
    localConfig: {
        baseURL: process.env.DEEPSEEK_LOCAL_BASE_URL || 'http://localhost:11434',
        model: process.env.DEEPSEEK_LOCAL_MODEL || 'deepseek-r1:8b'
    },
    timeout: 600000, // 10分钟超时时间
    maxRetries: parseInt(process.env.DEEPSEEK_MAX_RETRIES || '3')
};
function getGlobalRuntimeProvider() {
    return global.__DEEPSEEK_RUNTIME_PROVIDER || null;
}
function setGlobalRuntimeProvider(provider) {
    global.__DEEPSEEK_RUNTIME_PROVIDER = provider;
    global.__DEEPSEEK_RUNTIME_PROVIDER_SET = true;
}
function isGlobalRuntimeProviderSet() {
    return global.__DEEPSEEK_RUNTIME_PROVIDER_SET === true;
}
/**
 * DeepSeek配置管理器
 */
class DeepSeekConfigManager {
    constructor() {
        this.runtimeProviderSet = false;
        this.config = Object.assign({}, exports.DEFAULT_DEEPSEEK_CONFIG);
        // 从全局状态恢复运行时设置
        if (isGlobalRuntimeProviderSet() && getGlobalRuntimeProvider()) {
            const provider = getGlobalRuntimeProvider();
            this.config.provider = provider;
            this.runtimeProviderSet = true;
            console.log(`🔄 从全局状态恢复配置中心设置: ${provider === 'cloud' ? '云端API' : '本地API'}`);
        }
        this.loadFromEnvironment();
    }
    static getInstance() {
        if (!DeepSeekConfigManager.instance) {
            DeepSeekConfigManager.instance = new DeepSeekConfigManager();
        }
        return DeepSeekConfigManager.instance;
    }
    /**
     * 从环境变量加载配置 - 所有配置都从.env.local文件读取
     */
    loadFromEnvironment() {
        // 加载云端API配置
        if (process.env.DEEPSEEK_API_KEY) {
            this.config.cloudConfig.apiKey = process.env.DEEPSEEK_API_KEY;
        }
        if (process.env.DEEPSEEK_CLOUD_BASE_URL) {
            this.config.cloudConfig.baseURL = process.env.DEEPSEEK_CLOUD_BASE_URL;
        }
        if (process.env.DEEPSEEK_CLOUD_MODEL) {
            this.config.cloudConfig.model = process.env.DEEPSEEK_CLOUD_MODEL;
        }
        // 加载本地API配置
        if (process.env.DEEPSEEK_LOCAL_BASE_URL) {
            this.config.localConfig.baseURL = process.env.DEEPSEEK_LOCAL_BASE_URL;
        }
        if (process.env.DEEPSEEK_LOCAL_MODEL) {
            this.config.localConfig.model = process.env.DEEPSEEK_LOCAL_MODEL;
        }
        // 加载提供商选择 - 仅作为默认值，不覆盖运行时设置
        if (process.env.DEEPSEEK_PROVIDER && !this.runtimeProviderSet) {
            const provider = process.env.DEEPSEEK_PROVIDER.toLowerCase();
            if (provider === 'cloud' || provider === 'local') {
                this.config.provider = provider;
                console.log(`🔧 从环境变量加载默认提供商配置: ${provider === 'cloud' ? '云端API' : '本地API'}`);
            }
        }
        else if (this.runtimeProviderSet) {
            console.log(`🎯 使用配置中心设置的提供商: ${this.config.provider === 'cloud' ? '云端API' : '本地API'}`);
        }
        // 加载超时配置 - 默认10分钟
        if (process.env.DEEPSEEK_TIMEOUT) {
            this.config.timeout = parseInt(process.env.DEEPSEEK_TIMEOUT);
        }
        // 加载重试次数配置
        if (process.env.DEEPSEEK_MAX_RETRIES) {
            this.config.maxRetries = parseInt(process.env.DEEPSEEK_MAX_RETRIES);
        }
        console.log('📋 DeepSeek配置加载完成:', {
            provider: this.config.provider,
            timeout: this.config.timeout,
            maxRetries: this.config.maxRetries,
            cloudConfigured: Boolean(this.config.cloudConfig.apiKey),
            localConfigured: Boolean(this.config.localConfig.baseURL)
        });
    }
    /**
     * 获取当前配置
     */
    getConfig() {
        return Object.assign({}, this.config);
    }
    /**
     * 设置提供商 - 由配置中心调用，优先级高于环境变量
     */
    setProvider(provider) {
        this.config.provider = provider;
        // 标记为运行时设置，防止被环境变量覆盖
        this.runtimeProviderSet = true;
        // 同步到全局状态，确保跨实例保持
        setGlobalRuntimeProvider(provider);
        console.log(`🔄 DeepSeek API提供商设置为: ${provider === 'cloud' ? '云端API' : '本地API'}`);
    }
    /**
     * 获取当前提供商
     */
    getProvider() {
        return this.config.provider;
    }
    /**
     * 获取超时时间 - 统一10分钟
     */
    getTimeout() {
        return this.config.timeout;
    }
    /**
     * 获取当前活动的API配置
     */
    getActiveConfig() {
        const currentConfig = this.getConfig();
        if (currentConfig.provider === 'cloud') {
            return {
                baseURL: currentConfig.cloudConfig.baseURL,
                model: currentConfig.cloudConfig.model,
                apiKey: currentConfig.cloudConfig.apiKey
            };
        }
        else {
            return {
                baseURL: currentConfig.localConfig.baseURL,
                model: currentConfig.localConfig.model
            };
        }
    }
    /**
     * 检查云端API是否配置
     */
    isCloudAPIConfigured() {
        const currentConfig = this.getConfig();
        return Boolean(currentConfig.cloudConfig.apiKey && currentConfig.cloudConfig.baseURL);
    }
    /**
     * 检查本地API是否配置
     */
    isLocalAPIConfigured() {
        const currentConfig = this.getConfig();
        return Boolean(currentConfig.localConfig.baseURL && currentConfig.localConfig.model);
    }
    /**
     * 检查本地API是否可用
     */
    async isLocalAPIAvailable() {
        if (!this.isLocalAPIConfigured()) {
            return false;
        }
        try {
            const currentConfig = this.getConfig();
            const baseURL = currentConfig.localConfig.baseURL;
            const tagsEndpoint = baseURL.includes('/v1')
                ? baseURL.replace('/v1', '/api/tags')
                : `${baseURL}/api/tags`;
            console.log(`🔍 检查本地API可用性: ${tagsEndpoint}`);
            const response = await fetch(tagsEndpoint, {
                method: 'GET',
                signal: AbortSignal.timeout(10000) // 10秒超时
            });
            if (!response.ok) {
                console.warn(`本地API响应错误: ${response.status}`);
                return false;
            }
            const data = await response.json();
            // 检查是否有可用的模型
            if (data.models && data.models.length > 0) {
                console.log(`✅ 本地API可用，发现 ${data.models.length} 个模型`);
                return true;
            }
            else {
                console.warn('本地API可用但没有模型');
                return false;
            }
        }
        catch (error) {
            console.warn('本地API检查失败:', error instanceof Error ? error.message : error);
            return false;
        }
    }
    /**
     * 获取可用的本地模型列表
     */
    async getAvailableLocalModels() {
        if (!this.isLocalAPIConfigured()) {
            return [];
        }
        try {
            const currentConfig = this.getConfig();
            const baseURL = currentConfig.localConfig.baseURL;
            const tagsEndpoint = baseURL.includes('/v1')
                ? baseURL.replace('/v1', '/api/tags')
                : `${baseURL}/api/tags`;
            const response = await fetch(tagsEndpoint, {
                method: 'GET',
                signal: AbortSignal.timeout(10000)
            });
            if (!response.ok) {
                return [];
            }
            const data = await response.json();
            if (data.models && Array.isArray(data.models)) {
                return data.models.map((model) => model.name);
            }
            return [];
        }
        catch (error) {
            console.error('获取本地模型列表失败:', error);
            return [];
        }
    }
    /**
     * 更新配置 - 由配置中心调用
     */
    updateConfig(updates) {
        this.config = Object.assign(Object.assign({}, this.config), updates);
        console.log('🔧 配置已更新');
    }
    /**
     * 重新加载环境变量配置
     */
    reloadFromEnvironment() {
        this.loadFromEnvironment();
        console.log('🔄 已重新加载环境变量配置');
    }
    /**
     * 重置为默认配置
     */
    resetToDefaults() {
        this.config = Object.assign({}, exports.DEFAULT_DEEPSEEK_CONFIG);
        this.loadFromEnvironment();
        console.log('🔄 配置已重置为默认值');
    }
    /**
     * 获取状态报告 - 只检查当前选择的API提供商
     */
    async getStatusReport() {
        const currentProvider = this.config.provider;
        console.log(`📊 状态检查 - 仅检查当前API提供商: ${currentProvider === 'cloud' ? '云端API' : '本地API'}`);
        const result = {
            currentProvider,
            cloudStatus: { configured: false, available: false },
            localStatus: { configured: false, available: false },
            timeout: this.config.timeout,
            recommendations: []
        };
        // 只检查当前选择的API提供商
        if (currentProvider === 'cloud') {
            // 检查云端API
            const cloudConfigured = this.isCloudAPIConfigured();
            result.cloudStatus = {
                configured: cloudConfigured,
                available: cloudConfigured // 假设云端API配置正确就可用
            };
            if (!cloudConfigured) {
                result.recommendations.push('云端API未配置，请检查DEEPSEEK_API_KEY环境变量');
                console.log('❌ 云端API未配置');
            }
            else {
                console.log('✅ 云端API配置检查通过');
            }
        }
        else {
            // 检查本地API
            const localConfigured = this.isLocalAPIConfigured();
            const localAvailable = localConfigured ? await this.isLocalAPIAvailable() : false;
            result.localStatus = {
                configured: localConfigured,
                available: localAvailable
            };
            if (!localConfigured) {
                result.recommendations.push('本地API未配置，请检查环境变量配置');
                console.log('❌ 本地API未配置');
            }
            else if (!localAvailable) {
                result.recommendations.push('本地API配置正确但服务不可用，请启动Ollama服务');
                console.log('❌ 本地API服务不可用');
            }
            else {
                console.log('✅ 本地API配置和服务检查通过');
            }
        }
        return result;
    }
}
exports.DeepSeekConfigManager = DeepSeekConfigManager;
/**
 * 获取配置管理器实例
 */
function getDeepSeekConfig() {
    return DeepSeekConfigManager.getInstance();
}
