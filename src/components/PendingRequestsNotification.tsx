/**
 * 待处理请求通知组件
 * 显示中断的请求，允许用户手动恢复
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { persistentAIService, PersistedRequest } from '@/services/PersistentAIService';

interface PendingRequestsNotificationProps {
  /**
   * 是否启用自动恢复（默认 false，使用手动模式）
   */
  autoRestore?: boolean;
  
  /**
   * 恢复完成的回调
   */
  onRestoreComplete?: () => void;
}

const PendingRequestsNotification: React.FC<PendingRequestsNotificationProps> = ({
  autoRestore = false,
  onRestoreComplete,
}) => {
  const [pendingRequests, setPendingRequests] = useState<PersistedRequest[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    initializeService();
  }, []);

  useEffect(() => {
    // 设置自动恢复模式
    persistentAIService.setAutoRestore(autoRestore);
    
    if (!autoRestore) {
      // 手动模式：检查待处理请求
      checkPendingRequests();
    }
  }, [autoRestore]);

  const initializeService = async () => {
    try {
      await persistentAIService.initialize();
      
      // 设置恢复回调
      persistentAIService.setOnRequestRestored((request) => {
        console.log('📌 请求正在恢复:', request);
        
        if (autoRestore) {
          // 自动模式下，更新请求列表
          checkPendingRequests();
        }
      });
      
      // 初次检查
      await checkPendingRequests();
    } catch (error) {
      console.error('初始化持久化服务失败:', error);
    }
  };

  const checkPendingRequests = async () => {
    try {
      const requests = await persistentAIService.getAllPersistedRequests();
      const validRequests = requests.filter(r => r.retryCount < r.maxRetries);
      setPendingRequests(validRequests);
      setIsVisible(validRequests.length > 0);
    } catch (error) {
      console.error('检查待处理请求失败:', error);
    }
  };

  const handleRestoreAll = async () => {
    setIsRestoring(true);
    try {
      await persistentAIService.manuallyRestoreAllRequests();
      await checkPendingRequests();
      onRestoreComplete?.();
    } catch (error) {
      console.error('恢复请求失败:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreOne = async (requestId: string) => {
    try {
      await persistentAIService.manuallyRestoreRequest(requestId);
      await checkPendingRequests();
    } catch (error) {
      console.error('恢复请求失败:', error);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const handleClearAll = async () => {
    try {
      await persistentAIService.clearAllPersistedRequests();
      await checkPendingRequests();
    } catch (error) {
      console.error('清除请求失败:', error);
    }
  };

  const getRequestTypeLabel = (type: string): string => {
    switch (type) {
      case 'foryou':
        return 'For You 推荐';
      case 'lookbook':
        return 'Lookbook 生成';
      case 'chat':
        return '聊天';
      case 'analyze':
        return '分析';
      default:
        return type;
    }
  };

  if (!isVisible || pendingRequests.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>
            🔔 发现 {pendingRequests.length} 个中断的请求
          </Text>
          <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 请求列表 */}
        <View style={styles.requestList}>
          {pendingRequests.map((request, index) => (
            <View key={request.id} style={styles.requestItem}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestType}>
                  {getRequestTypeLabel(request.type)}
                </Text>
                <Text style={styles.requestMeta}>
                  重试: {request.retryCount}/{request.maxRetries}
                </Text>
              </View>
              
              {!autoRestore && (
                <TouchableOpacity
                  onPress={() => handleRestoreOne(request.id)}
                  style={styles.restoreButton}
                >
                  <Text style={styles.restoreButtonText}>恢复</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* 操作按钮 */}
        {!autoRestore && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleRestoreAll}
              disabled={isRestoring}
              style={[styles.actionButton, styles.primaryButton, isRestoring && styles.disabledButton]}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.actionButtonText}>恢复全部</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearAll}
              disabled={isRestoring}
              style={[styles.actionButton, styles.dangerButton, isRestoring && styles.disabledButton]}
            >
              <Text style={styles.actionButtonText}>清除全部</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 自动模式提示 */}
        {autoRestore && (
          <View style={styles.autoModeHint}>
            <Text style={styles.autoModeText}>
              ⚡ 自动恢复模式已启用，请求将自动恢复
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  card: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    flex: 1,
  },
  closeButton: {
    padding: 4,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#856404',
    fontWeight: 'bold',
  },
  requestList: {
    marginBottom: 12,
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  requestMeta: {
    fontSize: 12,
    color: '#666',
  },
  restoreButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  restoreButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: '#28A745',
  },
  dangerButton: {
    backgroundColor: '#DC3545',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  autoModeHint: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#D1ECF1',
    borderRadius: 6,
  },
  autoModeText: {
    fontSize: 12,
    color: '#0C5460',
    textAlign: 'center',
  },
});

export default PendingRequestsNotification;

