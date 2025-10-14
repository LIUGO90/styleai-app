import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { globalUploadListener } from '@/services/GlobalUploadListener';

interface UploadListenerMonitorProps {
  visible?: boolean;
}

export const UploadListenerMonitor: React.FC<UploadListenerMonitorProps> = ({ 
  visible = false 
}) => {
  const [stats, setStats] = useState({
    totalListeners: 0,
    componentCount: 0,
    listeners: [] as string[]
  });

  useEffect(() => {
    if (!visible) return;

    const updateStats = () => {
      const currentStats = globalUploadListener.getListenerStats();
      setStats(currentStats);
    };

    // 初始更新
    updateStats();

    // 定期更新状态
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [visible]);

  const clearAllListeners = () => {
    globalUploadListener.clearAllListeners();
    setStats({
      totalListeners: 0,
      componentCount: 0,
      listeners: []
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>上传监听器监控</Text>

      <Text style={styles.statText}>
        总监听器: {stats.totalListeners}
      </Text>

      <Text style={styles.statText}>
        组件数量: {stats.componentCount}
      </Text>

      {stats.listeners.length > 0 && (
        <View style={styles.listenersContainer}>
          <Text style={styles.listenersTitle}>活跃监听器:</Text>
          {stats.listeners.slice(0, 5).map((listener, index) => (
            <Text key={index} style={styles.listenerText}>
              {listener.substring(0, 20)}...
            </Text>
          ))}
          {stats.listeners.length > 5 && (
            <Text style={styles.moreText}>
              ...还有 {stats.listeners.length - 5} 个
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity
        onPress={clearAllListeners}
        style={styles.clearButton}
      >
        <Text style={styles.clearButtonText}>清理所有监听器</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
    minWidth: 200,
    maxWidth: 300,
  },
  title: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statText: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  listenersContainer: {
    marginTop: 8,
  },
  listenersTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listenerText: {
    color: '#E0E0E0',
    fontSize: 10,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  moreText: {
    color: '#B0B0B0',
    fontSize: 10,
    fontStyle: 'italic',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    padding: 6,
    borderRadius: 4,
    marginTop: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
