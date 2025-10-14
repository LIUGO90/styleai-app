import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { InteractionManager } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// 定义后台任务
const BACKGROUND_FETCH_TASK = 'background-fetch-task';

// 注册后台任务
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {

  try {
    // 模拟后台数据同步
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();

    // 保存到本地存储
    // await AsyncStorage.setItem('backgroundData', JSON.stringify(data));

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('后台任务失败:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export default function InteractionManagerVsBackground() {
  const [interactionStatus, setInteractionStatus] = useState('等待交互');
  const [backgroundStatus, setBackgroundStatus] = useState('未启动');
  const [data, setData] = useState<string[]>([]);

  useEffect(() => {
    // 检查后台任务状态
    checkBackgroundFetchStatus();
  }, []);

  const checkBackgroundFetchStatus = async () => {
    const status = await BackgroundFetch.getStatusAsync();
    setBackgroundStatus(status === BackgroundFetch.BackgroundFetchStatus.Available ? '可用' : '不可用');
  };

  // InteractionManager 示例 - 前台交互优化
  const handleInteractionManagerExample = () => {
    setInteractionStatus('处理中...');

    // 使用 InteractionManager 等待用户交互完成
    InteractionManager.runAfterInteractions(() => {
      // 模拟耗时操作
      setTimeout(() => {
        const newData = Array.from({ length: 100 }, (_, i) => `数据 ${i + 1}`);
        setData(newData);
        setInteractionStatus('完成');
      }, 2000);
    });
  };

  // 后台任务示例
  const startBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 15000, // 15秒
        stopOnTerminate: false,
        startOnBoot: true,
      });
      setBackgroundStatus('已启动');
      Alert.alert('成功', '后台任务已启动');
    } catch (error) {
      Alert.alert('错误', '无法启动后台任务');
    }
  };

  const stopBackgroundTask = async () => {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      setBackgroundStatus('已停止');
      Alert.alert('成功', '后台任务已停止');
    } catch (error) {
      Alert.alert('错误', '无法停止后台任务');
    }
  };

  // 检查交互状态
  const checkInteractionStatus = () => {
    const isInteracting = InteractionManager.isInteracting();
    Alert.alert('交互状态', `当前是否在交互中: ${isInteracting ? '是' : '否'}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>InteractionManager vs 后台任务</Text>

      {/* InteractionManager 部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔄 InteractionManager (前台优化)</Text>
        <Text style={styles.description}>
          用途：优化前台用户交互体验，等待交互完成后执行任务
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleInteractionManagerExample}>
          <Text style={styles.buttonText}>执行前台优化任务</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={checkInteractionStatus}>
          <Text style={styles.buttonText}>检查交互状态</Text>
        </TouchableOpacity>

        <Text style={styles.statusText}>状态: {interactionStatus}</Text>
      </View>

      {/* 后台任务部分 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 后台任务 (Background Tasks)</Text>
        <Text style={styles.description}>
          用途：应用在后台时执行任务，如数据同步、推送通知等
        </Text>

        <TouchableOpacity style={styles.button} onPress={startBackgroundTask}>
          <Text style={styles.buttonText}>启动后台任务</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={stopBackgroundTask}>
          <Text style={styles.buttonText}>停止后台任务</Text>
        </TouchableOpacity>

        <Text style={styles.statusText}>状态: {backgroundStatus}</Text>
      </View>

      {/* 数据展示 */}
      {data.length > 0 && (
        <View style={styles.dataSection}>
          <Text style={styles.dataTitle}>处理的数据:</Text>
          <Text style={styles.dataCount}>共 {data.length} 条数据</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    textAlign: 'center',
  },
  dataSection: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dataCount: {
    fontSize: 14,
    color: '#666',
  },
});
