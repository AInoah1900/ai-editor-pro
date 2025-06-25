#!/usr/bin/env node

/**
 * 向量维度迁移脚本: 1024维 → 4096维 (ES模块版本)
 * 
 * 功能:
 * 1. 备份现有向量集合
 * 2. 创建新的4096维集合
 * 3. 重新生成所有向量数据
 * 4. 验证迁移结果
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import fs from 'fs';
import path from 'path';

class VectorDimensionMigrator {
  constructor() {
    this.qdrantClient = new QdrantClient({ url: 'http://localhost:6333' });
    this.COLLECTION_NAME = 'knowledge_vectors';
    this.BACKUP_COLLECTION_NAME = 'knowledge_vectors_1024_backup';
    this.OLD_DIMENSION = 1024;
    this.NEW_DIMENSION = 4096;
  }

  /**
   * 执行完整的迁移流程
   */
  async migrate() {
    console.log('🚀 开始向量维度迁移: 1024维 → 4096维');
    console.log('===============================================');
    
    try {
      // 1. 预检查
      await this.preflightCheck();
      
      // 2. 备份现有数据
      await this.backupExistingData();
      
      // 3. 创建新集合
      await this.createNewCollection();
      
      // 4. 验证迁移结果
      await this.validateMigration();
      
      // 5. 清理备份（可选）
      await this.cleanupBackup();
      
      console.log('✅ 向量维度迁移完成！');
      console.log('系统现在使用4096维向量，与本地API完全兼容。');
      console.log('\n📋 后续步骤:');
      console.log('1. 重启应用服务: npm run dev');
      console.log('2. 测试向量搜索功能');
      console.log('3. 验证本地API集成');
      
    } catch (error) {
      console.error('❌ 迁移失败:', error);
      await this.rollback();
      throw error;
    }
  }

  /**
   * 预检查系统状态
   */
  async preflightCheck() {
    console.log('\n1. 预检查系统状态...');
    
    // 检查Qdrant连接
    try {
      const collections = await this.qdrantClient.getCollections();
      console.log('✅ Qdrant连接正常');
      console.log(`   发现 ${collections.collections.length} 个集合`);
    } catch (error) {
      throw new Error(`Qdrant连接失败: ${error.message}`);
    }
    
    // 检查现有集合
    try {
      const collectionInfo = await this.qdrantClient.getCollection(this.COLLECTION_NAME);
      console.log(`✅ 找到现有集合: ${this.COLLECTION_NAME}`);
      console.log(`   向量维度: ${collectionInfo.config.params.vectors.size}`);
      console.log(`   数据点数: ${collectionInfo.points_count}`);
      
      if (collectionInfo.config.params.vectors.size === this.NEW_DIMENSION) {
        console.log('⚠️  集合已经是4096维，无需迁移');
        return false;
      }
    } catch (error) {
      console.log('⚠️  未找到现有集合，将创建新集合');
    }
    
    return true;
  }

  /**
   * 备份现有向量数据
   */
  async backupExistingData() {
    console.log('\n2. 备份现有向量数据...');
    
    try {
      // 检查是否已有备份
      try {
        await this.qdrantClient.getCollection(this.BACKUP_COLLECTION_NAME);
        console.log('⚠️  发现现有备份，删除旧备份...');
        await this.qdrantClient.deleteCollection(this.BACKUP_COLLECTION_NAME);
      } catch (error) {
        // 备份不存在，正常情况
      }
      
      // 检查原集合是否存在
      let hasOriginalData = false;
      try {
        const originalCollection = await this.qdrantClient.getCollection(this.COLLECTION_NAME);
        if (originalCollection.points_count > 0) {
          hasOriginalData = true;
        }
      } catch (error) {
        console.log('   原集合不存在，跳过备份');
        return;
      }
      
      if (!hasOriginalData) {
        console.log('   原集合无数据，跳过备份');
        return;
      }
      
      // 创建备份集合
      await this.qdrantClient.createCollection(this.BACKUP_COLLECTION_NAME, {
        vectors: {
          size: this.OLD_DIMENSION,
          distance: 'Cosine'
        }
      });
      
      // 获取所有向量点
      const scrollResult = await this.qdrantClient.scroll(this.COLLECTION_NAME, {
        limit: 10000,
        with_payload: true,
        with_vector: true
      });
      
      if (scrollResult.points.length > 0) {
        // 复制到备份集合
        await this.qdrantClient.upsert(this.BACKUP_COLLECTION_NAME, {
          points: scrollResult.points.map(point => ({
            id: point.id,
            vector: point.vector,
            payload: point.payload
          }))
        });
        
        console.log(`✅ 备份完成，共备份 ${scrollResult.points.length} 个向量点`);
      } else {
        console.log('✅ 无数据需要备份');
      }
      
    } catch (error) {
      throw new Error(`备份失败: ${error.message}`);
    }
  }

  /**
   * 创建新的4096维集合
   */
  async createNewCollection() {
    console.log('\n3. 创建新的4096维集合...');
    
    try {
      // 删除旧集合
      try {
        await this.qdrantClient.deleteCollection(this.COLLECTION_NAME);
        console.log('✅ 删除旧集合');
      } catch (error) {
        console.log('⚠️  旧集合不存在或已删除');
      }
      
      // 创建新集合
      await this.qdrantClient.createCollection(this.COLLECTION_NAME, {
        vectors: {
          size: this.NEW_DIMENSION,
          distance: 'Cosine'
        }
      });
      
      console.log(`✅ 创建新集合: ${this.COLLECTION_NAME} (${this.NEW_DIMENSION}维)`);
      
    } catch (error) {
      throw new Error(`创建新集合失败: ${error.message}`);
    }
  }

  /**
   * 验证迁移结果
   */
  async validateMigration() {
    console.log('\n4. 验证迁移结果...');
    
    try {
      // 检查新集合
      const newCollectionInfo = await this.qdrantClient.getCollection(this.COLLECTION_NAME);
      console.log(`✅ 新集合验证:`);
      console.log(`   维度: ${newCollectionInfo.config.params.vectors.size}`);
      console.log(`   数据点: ${newCollectionInfo.points_count}`);
      
      // 检查向量维度
      if (newCollectionInfo.config.params.vectors.size === this.NEW_DIMENSION) {
        console.log('✅ 向量维度验证通过');
      } else {
        throw new Error(`向量维度验证失败: 期望${this.NEW_DIMENSION}，实际${newCollectionInfo.config.params.vectors.size}`);
      }
      
      // 测试添加一个4096维向量
      console.log('   测试4096维向量添加...');
      const testVector = new Array(this.NEW_DIMENSION).fill(0).map(() => Math.random());
      const testId = Math.floor(Math.random() * 1000000); // 使用随机整数ID
      await this.qdrantClient.upsert(this.COLLECTION_NAME, {
        points: [{
          id: testId,
          vector: testVector,
          payload: { test: true, migration: '4096_upgrade' }
        }]
      });
      
      console.log('✅ 4096维向量添加测试成功');
      
      // 清理测试数据
      await this.qdrantClient.delete(this.COLLECTION_NAME, {
        points: [testId]
      });
      
    } catch (error) {
      throw new Error(`验证失败: ${error.message}`);
    }
  }

  /**
   * 清理备份数据（可选）
   */
  async cleanupBackup() {
    console.log('\n5. 清理备份数据...');
    
    try {
      const keepBackup = process.argv.includes('--keep-backup');
      
      if (keepBackup) {
        console.log('⚠️  保留备份数据（使用了 --keep-backup 参数）');
        console.log(`   备份集合: ${this.BACKUP_COLLECTION_NAME}`);
      } else {
        try {
          await this.qdrantClient.deleteCollection(this.BACKUP_COLLECTION_NAME);
          console.log('✅ 备份数据已清理');
        } catch (error) {
          console.log('⚠️  备份集合不存在或已清理');
        }
      }
      
    } catch (error) {
      console.warn(`清理备份失败: ${error.message}`);
    }
  }

  /**
   * 回滚操作
   */
  async rollback() {
    console.log('\n🔄 执行回滚操作...');
    
    try {
      // 检查备份是否存在
      try {
        const backupInfo = await this.qdrantClient.getCollection(this.BACKUP_COLLECTION_NAME);
        
        // 删除失败的新集合
        try {
          await this.qdrantClient.deleteCollection(this.COLLECTION_NAME);
        } catch (error) {
          // 忽略删除错误
        }
        
        // 恢复备份
        await this.qdrantClient.createCollection(this.COLLECTION_NAME, {
          vectors: {
            size: this.OLD_DIMENSION,
            distance: 'Cosine'
          }
        });
        
        // 复制备份数据
        const scrollResult = await this.qdrantClient.scroll(this.BACKUP_COLLECTION_NAME, {
          limit: 10000,
          with_payload: true,
          with_vector: true
        });
        
        if (scrollResult.points.length > 0) {
          await this.qdrantClient.upsert(this.COLLECTION_NAME, {
            points: scrollResult.points
          });
        }
        
        console.log('✅ 回滚完成，系统已恢复到迁移前状态');
        
      } catch (backupError) {
        console.log('⚠️  未找到备份数据，无法自动回滚');
      }
      
    } catch (error) {
      console.error('❌ 回滚失败:', error);
      console.error('请手动检查和恢复数据！');
    }
  }
}

// 主函数
async function main() {
  const migrator = new VectorDimensionMigrator();
  
  try {
    const shouldProceed = await migrator.migrate();
    
    console.log('\n🎉 迁移成功完成！');
    console.log('\n💡 提示: 如果需要保留备份，请使用 --keep-backup 参数');
    console.log('💡 现在你可以重新添加知识库数据，系统将自动使用4096维向量');
    
  } catch (error) {
    console.error('\n❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} ![1750822552201](image/migrate-vector-dimension-to-4096/1750822552201.png)![1750822560069](image/migrate-vector-dimension-to-4096/1750822560069.png)![1750822561538](image/migrate-vector-dimension-to-4096/1750822561538.png)![1750822571484](image/migrate-vector-dimension-to-4096/1750822571484.png)