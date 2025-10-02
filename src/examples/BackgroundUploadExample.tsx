import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { BackgroundTaskService } from '@/services/BackgroundTaskService';
import { backgroundUploadListener } from '@/services/BackgroundUploadListener';
import { useBackgroundTasks } from '@/hooks/useBackgroundTasks';

export const BackgroundUploadExample: React.FC = () => {
  const { isTasksRunning, startTasks, stopTasks } = useBackgroundTasks();
  const [uploadStatus, setUploadStatus] = useState<string>('未开始');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // 检查是否有待上传的数据
    const checkPendingUpload = async () => {
      const hasPending = await backgroundUploadListener.hasPendingUpload();
      if (hasPending) {
        setUploadStatus('待上传');
        const pending = await backgroundUploadListener.getPendingUpload();
        if (pending) {
          setCurrentImage(pending.imageUri);
          
          // 设置上传完成监听器
          backgroundUploadListener.addListener(pending.messageId, (imageUrl: string) => {
            setUploadedImageUrl(imageUrl);
            setUploadStatus('上传完成');
            Alert.alert('上传成功', `图片已上传: ${imageUrl}`);
          });
        }
      }
    };

    checkPendingUpload();
  }, []);

  // 模拟选择图片并添加到上传队列
  const simulateImageUpload = async () => {
    try {
      setUploadStatus('准备上传...');
      
      // 模拟图片URI
      const imageUri = 'file:///path/to/simulated/image.jpg';
      const messageId = 'demo_' + Date.now();
      
      // 添加到后台上传队列
      await BackgroundTaskService.addImageToUploadQueue(imageUri, messageId);
      
      setCurrentImage(imageUri);
      setUploadStatus('已添加到队列，等待后台处理');
      
      // 设置上传完成监听器
      backgroundUploadListener.addListener(messageId, (imageUrl: string) => {
        setUploadedImageUrl(imageUrl);
        setUploadStatus('上传完成');
        Alert.alert('上传成功', `图片已上传: ${imageUrl}`);
      });
      
      console.log('图片已添加到后台上传队列');
    } catch (error) {
      console.error('添加图片失败:', error);
      Alert.alert('错误', '添加图片失败');
    }
  };

  // 检查上传状态
  const checkUploadStatus = async () => {
    try {
      const hasPending = await backgroundUploadListener.hasPendingUpload();
      const pending = await backgroundUploadListener.getPendingUpload();
      
      Alert.alert(
        '上传状态',
        `有待上传: ${hasPending ? '是' : '否'}\n` +
        `当前图片: ${currentImage ? '已选择' : '未选择'}\n` +
        `上传结果: ${uploadedImageUrl ? '已完成' : '未完成'}`
      );
    } catch (error) {
      console.error('检查状态失败:', error);
    }
  };

  // 清除上传数据
  const clearUploadData = async () => {
    try {
      setCurrentImage(null);
      setUploadedImageUrl(null);
      setUploadStatus('未开始');
      console.log('上传数据已清除');
    } catch (error) {
      console.error('清除数据失败:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>后台任务上传示例</Text>
      
      {/* 任务状态 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>后台任务状态</Text>
        <Text style={styles.statusText}>
          任务运行: {isTasksRunning ? '✅ 运行中' : '❌ 已停止'}
        </Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startTasks}
          >
            <Text style={styles.buttonText}>启动任务</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.stopButton]}
            onPress={stopTasks}
          >
            <Text style={styles.buttonText}>停止任务</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 上传状态 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>上传状态</Text>
        <Text style={styles.statusText}>
          状态: {uploadStatus}
        </Text>
        <Text style={styles.statusText}>
          当前图片: {currentImage ? '✅ 已选择' : '❌ 未选择'}
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
          onPress={simulateImageUpload}
        >
          <Text style={styles.buttonText}>模拟图片上传</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.checkButton]}
          onPress={checkUploadStatus}
        >
          <Text style={styles.buttonText}>检查上传状态</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearUploadData}
        >
          <Text style={styles.buttonText}>清除数据</Text>
        </TouchableOpacity>
      </View>

      {/* 使用说明 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>使用说明</Text>
        <Text style={styles.instructionText}>
          1. 首先启动后台任务
        </Text>
        <Text style={styles.instructionText}>
          2. 点击"模拟图片上传"添加图片到队列
        </Text>
        <Text style={styles.instructionText}>
          3. 后台任务会自动处理队列中的图片
        </Text>
        <Text style={styles.instructionText}>
          4. 上传完成后会收到通知
        </Text>
        <Text style={styles.instructionText}>
          5. 本地数据会自动更新
        </Text>
      </View>

      {/* 技术细节 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>技术细节</Text>
        <Text style={styles.techText}>
          • 使用 BackgroundTaskService 管理上传队列
        </Text>
        <Text style={styles.techText}>
          • 使用 BackgroundUploadListener 监听上传结果
        </Text>
        <Text style={styles.techText}>
          • 自动更新本地 AsyncStorage 数据
        </Text>
        <Text style={styles.techText}>
          • 支持上传失败重试机制
        </Text>
        <Text style={styles.techText}>
          • 上传成功后自动预加载图片
        </Text>
      </View>
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flex: 1,
    marginRight: 8,
  },
  stopButton: {
    backgroundColor: '#F44336',
    flex: 1,
    marginLeft: 8,
  },
  uploadButton: {
    backgroundColor: '#FF9800',
  },
  checkButton: {
    backgroundColor: '#2196F3',
  },
  clearButton: {
    backgroundColor: '#9E9E9E',
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
  techText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    lineHeight: 18,
  },
});
