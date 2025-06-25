import { NextRequest, NextResponse } from 'next/server';
import { getDeepSeekConfig, type DeepSeekProvider } from '@/lib/deepseek/deepseek-config';
import { getDualDeepSeekClient, clearDualDeepSeekClient } from '@/lib/deepseek/deepseek-dual-client';

/**
 * DeepSeek配置管理API
 */

// GET: 获取当前配置状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    const configManager = getDeepSeekConfig();
    const client = getDualDeepSeekClient();

    switch (action) {
      case 'status':
        // 获取配置状态
        const statusReport = await configManager.getStatusReport();
        return NextResponse.json({
          success: true,
          data: statusReport
        });

      case 'health':
        // 健康检查 - 强制刷新客户端
        const freshClient = getDualDeepSeekClient(true);
        const healthStatus = await freshClient.healthCheck();
        return NextResponse.json({
          success: true,
          data: healthStatus
        });

      case 'config':
        // 获取完整配置
        const config = configManager.getConfig();
        // 隐藏敏感信息
        const safeConfig = {
          ...config,
          cloudConfig: {
            ...config.cloudConfig,
            apiKey: config.cloudConfig.apiKey ? '***已配置***' : '未配置'
          }
        };
        return NextResponse.json({
          success: true,
          data: safeConfig
        });

      case 'models':
        // 获取可用的本地模型列表
        try {
          const availableModels = await configManager.getAvailableLocalModels();
          const currentConfig = configManager.getConfig();
          const isLocalAvailable = await configManager.isLocalAPIAvailable();
          
          let errorMessage = null;
          if (!isLocalAvailable) {
            try {
              // 尝试获取详细错误信息
              const response = await fetch(`${currentConfig.localConfig.baseURL}/tags`);
              if (!response.ok) {
                errorMessage = `本地API连接失败: ${response.status} ${response.statusText}`;
              }
            } catch (error) {
              errorMessage = `本地API不可用: ${error instanceof Error ? error.message : '连接失败'}`;
            }
          } else if (availableModels.length === 0) {
            errorMessage = '本地API可用但没有找到任何模型';
          } else if (!availableModels.includes(currentConfig.localConfig.model)) {
            errorMessage = `本地API错误: 模型 "${currentConfig.localConfig.model}" 不存在。可用模型: ${availableModels.join(', ')}`;
          }
          
          return NextResponse.json({
            success: true,
            data: {
              localModels: availableModels,
              currentModel: currentConfig.localConfig.model,
              isAvailable: isLocalAvailable,
              error: errorMessage
            }
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `获取模型列表失败: ${error instanceof Error ? error.message : '未知错误'}`
          });
        }

      default:
        return NextResponse.json({
          success: false,
          error: '无效的操作类型'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('获取DeepSeek配置失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取配置失败'
    }, { status: 500 });
  }
}

// POST: 更新配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, provider, config } = body;

    const configManager = getDeepSeekConfig();
    const client = getDualDeepSeekClient();

    switch (action) {
      case 'switchProvider':
        // 切换API提供商
        if (!provider || (provider !== 'cloud' && provider !== 'local')) {
          return NextResponse.json({
            success: false,
            error: '无效的提供商类型'
          }, { status: 400 });
        }

        const switchSuccess = await client.switchProvider(provider as DeepSeekProvider);
        
        if (switchSuccess) {
          // 配置已在内存中更新，无需清除缓存
          return NextResponse.json({
            success: true,
            message: `成功切换到${provider === 'cloud' ? '云端' : '本地'}API`,
            data: {
              currentProvider: provider
            }
          });
        } else {
          return NextResponse.json({
            success: false,
            error: `切换到${provider === 'cloud' ? '云端' : '本地'}API失败`
          }, { status: 400 });
        }

      case 'testConnection':
        // 测试连接 - 使用新的客户端实例
        const testProvider = provider as DeepSeekProvider;
        const testClient = getDualDeepSeekClient(true);
        
        try {
          // 使用专门的测试方法，直接测试指定提供商
          await testClient.testProviderConnection(testProvider);

          return NextResponse.json({
            success: true,
            message: `${testProvider === 'cloud' ? '云端' : '本地'}API连接测试成功`
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: `${testProvider === 'cloud' ? '云端' : '本地'}API连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`
          }, { status: 400 });
        }

      case 'updateConfig':
        // 更新配置
        if (config) {
          configManager.updateConfig(config);
          // 配置已在内存中更新，无需清除缓存
          return NextResponse.json({
            success: true,
            message: '配置更新成功'
          });
        } else {
          return NextResponse.json({
            success: false,
            error: '缺少配置数据'
          }, { status: 400 });
        }

      case 'reset':
        // 重置配置
        configManager.resetToDefaults();
        // 配置已重置，无需清除缓存
        return NextResponse.json({
          success: true,
          message: '配置已重置为默认值'
        });

      default:
        return NextResponse.json({
          success: false,
          error: '无效的操作类型'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('更新DeepSeek配置失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新配置失败'
    }, { status: 500 });
  }
} 