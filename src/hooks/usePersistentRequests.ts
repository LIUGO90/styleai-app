/**
 * 持久化请求 Hook
 * 提供便捷的方式管理持久化请求
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { persistentAIService, PersistedRequest } from '@/services/PersistentAIService';

interface UsePersistentRequestsOptions {
  /**
   * 是否启用自动恢复（默认 true）
   */
  autoRestore?: boolean;
  
  /**
   * 请求恢复时的回调
   */
  onRequestRestored?: (request: PersistedRequest) => void;
  
  /**
   * 是否自动初始化服务（默认 true）
   */
  autoInitialize?: boolean;
}

interface UsePersistentRequestsReturn {
  /**
   * 待处理的请求列表
   */
  pendingRequests: PersistedRequest[];
  
  /**
   * 待处理的请求数量
   */
  pendingCount: number;
  
  /**
   * 是否正在恢复请求
   */
  isRestoring: boolean;
  
  /**
   * 是否已初始化
   */
  isInitialized: boolean;
  
  /**
   * 手动恢复所有请求
   */
  restoreAllRequests: () => Promise<void>;
  
  /**
   * 手动恢复指定请求
   */
  restoreRequest: (requestId: string) => Promise<void>;
  
  /**
   * 清除所有请求
   */
  clearAllRequests: () => Promise<void>;
  
  /**
   * 刷新请求列表
   */
  refreshRequests: () => Promise<void>;
  
  /**
   * 设置自动恢复模式
   */
  setAutoRestore: (enabled: boolean) => void;
  
  /**
   * 获取自动恢复状态
   */
  isAutoRestoreEnabled: boolean;
}

export function usePersistentRequests(
  options: UsePersistentRequestsOptions = {}
): UsePersistentRequestsReturn {
  const {
    autoRestore = true,
    onRequestRestored,
    autoInitialize = true,
  } = options;

  const [pendingRequests, setPendingRequests] = useState<PersistedRequest[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [autoRestoreEnabled, setAutoRestoreEnabled] = useState(autoRestore);

  // 使用 ref 存储回调，避免依赖项变化导致重新初始化
  const onRequestRestoredRef = useRef(onRequestRestored);
  
  // 更新 ref
  useEffect(() => {
    onRequestRestoredRef.current = onRequestRestored;
  }, [onRequestRestored]);

  // 刷新请求列表
  const refreshRequests = useCallback(async () => {
    try {
      const requests = await persistentAIService.getAllPersistedRequests();
      setPendingRequests(requests);
    } catch (error) {
      console.error('刷新请求列表失败:', error);
    }
  }, []);

  // 初始化服务（只在组件挂载时执行一次）
  useEffect(() => {
    if (!autoInitialize) return;

    const initialize = async () => {
      try {
        await persistentAIService.initialize();
        
        // 设置自动恢复模式
        persistentAIService.setAutoRestore(autoRestore);
        
        // 设置恢复回调（使用 ref 中的最新值）
        persistentAIService.setOnRequestRestored((request) => {
          if (onRequestRestoredRef.current) {
            onRequestRestoredRef.current(request);
          }
        });
        
        setIsInitialized(true);
        
        // 初次加载请求列表
        await refreshRequests();
      } catch (error) {
        console.error('初始化持久化服务失败:', error);
      }
    };

    initialize();

    return () => {
      persistentAIService.cleanup();
    };
  }, [autoInitialize, refreshRequests]); // 依赖 autoInitialize 和 refreshRequests

  // 单独处理 autoRestore 的变化
  useEffect(() => {
    if (isInitialized) {
      persistentAIService.setAutoRestore(autoRestore);
      setAutoRestoreEnabled(autoRestore);
    }
  }, [autoRestore, isInitialized]);

  // 监听自动恢复模式变化
  useEffect(() => {
    if (!isInitialized) return;
    
    const interval = setInterval(async () => {
      // 定期刷新请求列表
      await refreshRequests();
    }, 5000); // 每 5 秒刷新一次

    return () => clearInterval(interval);
  }, [isInitialized, refreshRequests]);

  // 恢复所有请求
  const restoreAllRequests = useCallback(async () => {
    if (isRestoring) return;
    
    setIsRestoring(true);
    try {
      await persistentAIService.manuallyRestoreAllRequests();
      await refreshRequests();
    } catch (error) {
      console.error('恢复所有请求失败:', error);
      throw error;
    } finally {
      setIsRestoring(false);
    }
  }, [isRestoring, refreshRequests]);

  // 恢复指定请求
  const restoreRequest = useCallback(async (requestId: string) => {
    try {
      await persistentAIService.manuallyRestoreRequest(requestId);
      await refreshRequests();
    } catch (error) {
      console.error(`恢复请求失败: ${requestId}`, error);
      throw error;
    }
  }, [refreshRequests]);

  // 清除所有请求
  const clearAllRequests = useCallback(async () => {
    try {
      await persistentAIService.clearAllPersistedRequests();
      await refreshRequests();
    } catch (error) {
      console.error('清除所有请求失败:', error);
      throw error;
    }
  }, [refreshRequests]);

  // 设置自动恢复模式
  const setAutoRestoreMode = useCallback((enabled: boolean) => {
    persistentAIService.setAutoRestore(enabled);
    setAutoRestoreEnabled(enabled);
  }, []);

  return {
    pendingRequests,
    pendingCount: pendingRequests.length,
    isRestoring,
    isInitialized,
    restoreAllRequests,
    restoreRequest,
    clearAllRequests,
    refreshRequests,
    setAutoRestore: setAutoRestoreMode,
    isAutoRestoreEnabled: autoRestoreEnabled,
  };
}

/**
 * 快速获取待处理请求数量的 Hook
 */
export function usePendingRequestCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = async () => {
      try {
        const count = await persistentAIService.getPendingRequestCount();
        setCount(count);
      } catch (error) {
        console.error('获取待处理请求数量失败:', error);
      }
    };

    updateCount();

    // 定期更新
    const interval = setInterval(updateCount, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return count;
}

