import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { imageCacheManager } from '@/utils/imageCache';

interface ImagePerformanceMonitorProps {
  visible?: boolean;
}

export const ImagePerformanceMonitor: React.FC<ImagePerformanceMonitorProps> = ({ 
  visible = false 
}) => {
  const [preloadedCount, setPreloadedCount] = useState(0);
  const [cacheStatus, setCacheStatus] = useState('');

  useEffect(() => {
    if (!visible) return;

    const updateStats = () => {
      const count = imageCacheManager.getPreloadedCount();
      setPreloadedCount(count);
      setCacheStatus(`远程图片: ${count} 张 | 本地图片: 自动缓存`);
    };

    // 初始更新
    updateStats();

    // 定期更新状态
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [visible, preloadedCount]);

  if (!visible) return null;

  return (
    <View style={{
      position: 'absolute',
      top: 50,
      right: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 8,
      borderRadius: 8,
      zIndex: 1000,
    }}>
      <Text style={{ color: 'white', fontSize: 12 }}>
        {cacheStatus}
      </Text>
      <Text style={{ color: 'white', fontSize: 10, marginTop: 2 }}>
        缓存状态: 活跃
      </Text>
    </View>
  );
};
