/**
 * 持久化请求完整示例
 * 展示如何在实际应用中使用持久化 AI 请求功能
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { usePersistentRequests, usePendingRequestCount } from '@/hooks/usePersistentRequests';
import { persistentAIService } from '@/services/PersistentAIService';
import PendingRequestsNotification from '@/components/PendingRequestsNotification';

const PersistentRequestsExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  // 使用 Hook 管理持久化请求
  const {
    pendingRequests,
    pendingCount,
    isRestoring,
    isInitialized,
    restoreAllRequests,
    restoreRequest,
    clearAllRequests,
    refreshRequests,
    setAutoRestore,
    isAutoRestoreEnabled,
  } = usePersistentRequests({
    autoRestore: false, // 使用手动模式，方便演示
    onRequestRestored: (request) => {
      console.log('🔔 请求正在恢复:', request);
    },
  });

  // 也可以使用简单的计数 Hook
  const quickCount = usePendingRequestCount();

  // 模拟发起 ForYou 请求
  const handleStartForYouRequest = async () => {
    setIsLoading(true);
    try {
      const userId = 'demo_user';
      const imageUrls = ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'];
      const prompt = '时尚休闲风格';

      console.log('🎬 开始 ForYou 请求...');
      
      const results = await persistentAIService.requestForYou(
        userId,
        imageUrls,
        prompt,
        {
          onProgress: (progress) => {
            console.log(`📊 进度: ${progress}%`);
          },
        }
      );

      console.log('✅ ForYou 请求成功:', results);
      Alert.alert('成功', '请求已完成！');
      
      // 刷新请求列表
      await refreshRequests();
    } catch (error) {
      console.error('❌ ForYou 请求失败:', error);
      Alert.alert('失败', '请求失败，已保存到队列中');
      
      // 刷新请求列表，显示失败的请求
      await refreshRequests();
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟发起 Lookbook 请求
  const handleStartLookbookRequest = async () => {
    setIsLoading(true);
    try {
      const userId = 'demo_user';
      const imageUrl = 'https://example.com/user-image.jpg';
      const styleOptions = ['casual', 'elegant'];
      const numImages = 4;

      console.log('🎬 开始 Lookbook 请求...');
      
      const results = await persistentAIService.requestLookbook(
        userId,
        imageUrl,
        styleOptions,
        numImages,
        {
          onProgress: (progress) => {
            console.log(`📊 进度: ${progress}%`);
          },
        }
      );

      console.log('✅ Lookbook 请求成功:', results);
      Alert.alert('成功', '请求已完成！');
      
      await refreshRequests();
    } catch (error) {
      console.error('❌ Lookbook 请求失败:', error);
      Alert.alert('失败', '请求失败，已保存到队列中');
      
      await refreshRequests();
    } finally {
      setIsLoading(false);
    }
  };

  // 处理恢复所有请求
  const handleRestoreAll = async () => {
    try {
      Alert.alert(
        '确认恢复',
        `确定要恢复 ${pendingCount} 个请求吗？`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '恢复',
            onPress: async () => {
              await restoreAllRequests();
              Alert.alert('成功', '所有请求已恢复！');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('失败', '恢复请求失败');
    }
  };

  // 处理清除所有请求
  const handleClearAll = async () => {
    Alert.alert(
      '确认清除',
      '确定要清除所有待处理的请求吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            await clearAllRequests();
            Alert.alert('成功', '所有请求已清除');
          },
        },
      ]
    );
  };

  // 切换自动恢复模式
  const handleToggleAutoRestore = (value: boolean) => {
    setAutoRestore(value);
    Alert.alert(
      '模式已切换',
      value
        ? '自动恢复已启用，请求将在 App 重启后自动恢复'
        : '自动恢复已禁用，需要手动恢复请求'
    );
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>初始化中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 顶部通知栏 */}
      <PendingRequestsNotification
        autoRestore={isAutoRestoreEnabled}
        onRestoreComplete={refreshRequests}
      />

      {/* 标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>持久化请求演示</Text>
        <Text style={styles.subtitle}>
          测试 App 中断后请求恢复功能
        </Text>
      </View>

      {/* 统计信息 */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{pendingCount}</Text>
          <Text style={styles.statLabel}>待处理请求</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{quickCount}</Text>
          <Text style={styles.statLabel}>快速计数</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{isRestoring ? '恢复中' : '空闲'}</Text>
          <Text style={styles.statLabel}>状态</Text>
        </View>
      </View>

      {/* 自动恢复开关 */}
      <View style={styles.settingCard}>
        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>自动恢复模式</Text>
            <Text style={styles.settingDescription}>
              启用后，请求将在 App 重启时自动恢复
            </Text>
          </View>
          <Switch
            value={isAutoRestoreEnabled}
            onValueChange={handleToggleAutoRestore}
          />
        </View>
      </View>

      {/* 发起请求 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. 发起新请求</Text>
        <Text style={styles.sectionDescription}>
          点击下方按钮发起请求，然后尝试关闭 App 来模拟中断
        </Text>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartForYouRequest}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '加载中...' : '发起 ForYou 请求'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartLookbookRequest}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '加载中...' : '发起 Lookbook 请求'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 请求列表 */}
      {pendingCount > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 待处理请求列表</Text>
          
          <View style={styles.requestList}>
            {pendingRequests.map((request, index) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestType}>
                    {request.type === 'foryou' ? 'ForYou' : 'Lookbook'}
                  </Text>
                  <Text style={styles.requestRetry}>
                    {request.retryCount}/{request.maxRetries} 次
                  </Text>
                </View>
                
                <Text style={styles.requestId}>ID: {request.id}</Text>
                <Text style={styles.requestTime}>
                  {new Date(request.timestamp).toLocaleString()}
                </Text>

                <TouchableOpacity
                  style={[styles.button, styles.smallButton, styles.successButton]}
                  onPress={() => restoreRequest(request.id)}
                >
                  <Text style={styles.buttonText}>恢复此请求</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 批量操作 */}
      {pendingCount > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 批量操作</Text>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.successButton]}
              onPress={handleRestoreAll}
              disabled={isRestoring}
            >
              <Text style={styles.buttonText}>
                {isRestoring ? '恢复中...' : '恢复全部'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleClearAll}
              disabled={isRestoring}
            >
              <Text style={styles.buttonText}>清除全部</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 使用说明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>使用说明</Text>
        <View style={styles.instructionList}>
          <Text style={styles.instructionItem}>
            1️⃣ 点击"发起请求"按钮开始一个 AI 请求
          </Text>
          <Text style={styles.instructionItem}>
            2️⃣ 在请求完成前，关闭或最小化 App（模拟中断）
          </Text>
          <Text style={styles.instructionItem}>
            3️⃣ 重新打开 App，查看待处理的请求
          </Text>
          <Text style={styles.instructionItem}>
            4️⃣ 点击"恢复"按钮继续中断的请求
          </Text>
          <Text style={styles.instructionItem}>
            5️⃣ 或切换到"自动恢复模式"，让系统自动处理
          </Text>
        </View>
      </View>

      {/* 技术说明 */}
      <View style={[styles.section, styles.techSection]}>
        <Text style={styles.sectionTitle}>技术特性</Text>
        <View style={styles.techList}>
          <Text style={styles.techItem}>✅ 请求持久化到本地存储</Text>
          <Text style={styles.techItem}>✅ 支持自动/手动恢复模式</Text>
          <Text style={styles.techItem}>✅ 最多重试 3 次</Text>
          <Text style={styles.techItem}>✅ 1 小时后自动清理过期请求</Text>
          <Text style={styles.techItem}>✅ 实时监听 App 状态变化</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  settingCard: {
    backgroundColor: '#FFF',
    padding: 16,
    marginTop: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    maxWidth: '80%',
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  buttonGroup: {
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  smallButton: {
    paddingVertical: 10,
    minHeight: 40,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  successButton: {
    backgroundColor: '#28A745',
  },
  dangerButton: {
    backgroundColor: '#DC3545',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  requestList: {
    gap: 12,
  },
  requestCard: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  requestRetry: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  requestId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  requestTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  instructionList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  techSection: {
    marginBottom: 20,
  },
  techList: {
    gap: 6,
  },
  techItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});

export default PersistentRequestsExample;

