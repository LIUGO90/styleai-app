import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { InteractionManager } from 'react-native';

export default function InteractionManagerExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<string[]>([]);

  // 示例1: 基本用法 - 延迟执行任务
  const handleBasicExample = () => {
    setIsLoading(true);

    // 等待所有交互和动画完成后再执行
    InteractionManager.runAfterInteractions(() => {
      // 模拟耗时操作
      setTimeout(() => {
        setData(['数据1', '数据2', '数据3']);
        setIsLoading(false);
      }, 1000);
    });
  };

  // 示例2: 复杂数据处理
  const handleComplexDataProcessing = () => {
    setIsLoading(true);

    InteractionManager.runAfterInteractions(() => {
      // 模拟复杂的数据处理
      const processData = () => {
        const newData = [];
        for (let i = 0; i < 1000; i++) {
          newData.push(`处理数据 ${i}`);
        }
        return newData;
      };

      const result = processData();
      setData(result);
      setIsLoading(false);
    });
  };

  // 示例3: 网络请求优化
  const handleNetworkRequest = () => {
    setIsLoading(true);

    InteractionManager.runAfterInteractions(async () => {
      try {
        // 模拟网络请求
        await new Promise(resolve => setTimeout(resolve, 2000));
        setData(['网络数据1', '网络数据2', '网络数据3']);
      } catch (error) {
        Alert.alert('错误', '网络请求失败');
      } finally {
        setIsLoading(false);
      }
    });
  };

  // 示例4: 检查交互状态
  const checkInteractionStatus = () => {
    const isInteracting = InteractionManager.isInteracting();
    Alert.alert('交互状态', `当前是否在交互中: ${isInteracting ? '是' : '否'}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>InteractionManager 示例</Text>

      <TouchableOpacity style={styles.button} onPress={handleBasicExample}>
        <Text style={styles.buttonText}>基本用法</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleComplexDataProcessing}>
        <Text style={styles.buttonText}>复杂数据处理</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleNetworkRequest}>
        <Text style={styles.buttonText}>网络请求优化</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={checkInteractionStatus}>
        <Text style={styles.buttonText}>检查交互状态</Text>
      </TouchableOpacity>

      {isLoading && <Text style={styles.loadingText}>加载中...</Text>}

      {data.length > 0 && (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>数据:</Text>
          {data.slice(0, 5).map((item, index) => (
            <Text key={index} style={styles.dataItem}>{item}</Text>
          ))}
          {data.length > 5 && <Text style={styles.moreText}>...还有 {data.length - 5} 项</Text>}
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
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  dataContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dataItem: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});
