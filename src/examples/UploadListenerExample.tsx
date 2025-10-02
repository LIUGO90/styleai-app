import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useUploadListener } from '@/hooks/useUploadListener';
import { globalUploadListener } from '@/services/GlobalUploadListener';
import { UploadListenerMonitor } from '@/components/UploadListenerMonitor';

export const UploadListenerExample: React.FC = () => {
  const [uploadStatus, setUploadStatus] = useState<string>('未开始');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showMonitor, setShowMonitor] = useState(false);
  
  // 使用上传监听器Hook
  const { addListener, checkPendingUpload, hasPendingUpload, listenerCount } = useUploadListener('ExampleComponent');

  useEffect(() => {
    // 检查是否有待上传的数据
    const checkPending = async () => {
      const hasPending = await hasPendingUpload();
      if (hasPending) {
        setUploadStatus('待上传');
        const pending = await checkPendingUpload();
        if (pending) {
          // 设置监听器
          addListener(pending.messageId, (imageUrl: string) => {
            setUploadedImageUrl(imageUrl);
            setUploadStatus('上传完成');
          });
        }
      }
    };

    checkPending();
  }, [addListener, checkPendingUpload, hasPendingUpload]);

  // 模拟添加图片到上传队列
  const simulateUpload = async () => {
    try {
      setUploadStatus('准备上传...');
      
      // 这里应该调用 BackgroundTaskService.addImageToUploadQueue
      // 为了演示，我们直接模拟上传完成
      setTimeout(() => {
        const mockImageUrl = 'https://example.com/uploaded-image.jpg';
        setUploadedImageUrl(mockImageUrl);
        setUploadStatus('上传完成');
      }, 2000);
      
    } catch (error) {
      console.error('模拟上传失败:', error);
      setUploadStatus('上传失败');
    }
  };

  // 检查监听器状态
  const checkListenerStatus = () => {
    const stats = globalUploadListener.getListenerStats();
    console.log('监听器状态:', stats);
  };

  // 清理所有监听器
  const clearAllListeners = () => {
    globalUploadListener.clearAllListeners();
    setUploadStatus('未开始');
    setUploadedImageUrl(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>上传监听器管理示例</Text>
      
      {/* 监听器监控 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>监听器监控</Text>
        <Text style={styles.statusText}>
          当前组件监听器: {listenerCount}
        </Text>
        
        <TouchableOpacity
          style={[styles.button, styles.monitorButton]}
          onPress={() => setShowMonitor(!showMonitor)}
        >
          <Text style={styles.buttonText}>
            {showMonitor ? '隐藏' : '显示'}监听器监控
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.checkButton]}
          onPress={checkListenerStatus}
        >
          <Text style={styles.buttonText}>检查监听器状态</Text>
        </TouchableOpacity>
      </View>

      {/* 上传状态 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>上传状态</Text>
        <Text style={styles.statusText}>
          状态: {uploadStatus}
        </Text>
        <Text style={styles.statusText}>
          上传结果: {uploadedImageUrl ? '✅ 已完成' : '❌ 未完成'}
        </Text>
        
        {uploadedImageUrl && (
          <Text style={styles.urlText}>
            URL: {uploadedImageUrl}
          </Text>
        )}
      </View>

      {/* 操作按钮 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>操作</Text>
        
        <TouchableOpacity
          style={[styles.button, styles.uploadButton]}
          onPress={simulateUpload}
        >
          <Text style={styles.buttonText}>模拟图片上传</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearAllListeners}
        >
          <Text style={styles.buttonText}>清理所有监听器</Text>
        </TouchableOpacity>
      </View>

      {/* 使用说明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>监听器管理说明</Text>
        <Text style={styles.instructionText}>
          • 组件卸载时自动清理监听器
        </Text>
        <Text style={styles.instructionText}>
          • 支持多个组件同时监听
        </Text>
        <Text style={styles.instructionText}>
          • 监听器触发后自动移除
        </Text>
        <Text style={styles.instructionText}>
          • 防止内存泄漏和重复监听
        </Text>
        <Text style={styles.instructionText}>
          • 支持全局监听器管理
        </Text>
      </View>

      {/* 监听器监控组件 */}
      <UploadListenerMonitor visible={showMonitor} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  monitorButton: {
    backgroundColor: '#9C27B0',
  },
  checkButton: {
    backgroundColor: '#2196F3',
  },
  uploadButton: {
    backgroundColor: '#FF9800',
  },
  clearButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
});
