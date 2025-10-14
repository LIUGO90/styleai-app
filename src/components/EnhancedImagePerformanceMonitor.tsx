import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { enhancedImageCacheManager } from "@/utils/EnhancedImageCache";

interface EnhancedImagePerformanceMonitorProps {
  visible?: boolean;
}

export const EnhancedImagePerformanceMonitor: React.FC<
  EnhancedImagePerformanceMonitorProps
> = ({ visible = false }) => {
  const [stats, setStats] = useState({
    preloadedCount: 0,
    hasPersistentCache: false,
    cacheExpiry: null as Date | null
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const updateStats = () => {
      const cacheStats = enhancedImageCacheManager.getCacheStats();
      setStats(cacheStats);
    };

    // 初始更新
    updateStats();

    // 定期更新状态
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [visible]);

  const handleClearCache = async () => {
    await enhancedImageCacheManager.clearAllCache();
    setStats(enhancedImageCacheManager.getCacheStats());
  };

  const handleClearMemoryOnly = async () => {
    await enhancedImageCacheManager.clearMemoryCache();
    setStats(enhancedImageCacheManager.getCacheStats());
  };

  if (!visible) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 50,
        right: 10,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        borderRadius: 8,
        zIndex: 1000,
        minWidth: 200,
      }}
    >
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <Text style={{ color: "white", fontSize: 12, fontWeight: 'bold' }}>
          图片缓存状态
        </Text>
        <Text style={{ color: "white", fontSize: 10 }}>
          {isExpanded ? '▼' : '▶'}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: "white", fontSize: 10, marginTop: 4 }}>
        内存缓存: {stats.preloadedCount} 张
      </Text>

      <Text style={{ color: "white", fontSize: 10 }}>
        持久缓存: {stats.hasPersistentCache ? '✅ 有' : '❌ 无'}
      </Text>

      {isExpanded && (
        <View style={{ marginTop: 8 }}>
          <Text style={{ color: "#4CAF50", fontSize: 10, marginBottom: 4 }}>
            expo-image 磁盘缓存: 自动管理
          </Text>

          <Text style={{ color: "#FFC107", fontSize: 10, marginBottom: 8 }}>
            重启后: 磁盘缓存保留，内存缓存重建
          </Text>

          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity
              onPress={handleClearMemoryOnly}
              style={{
                backgroundColor: '#FF5722',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                flex: 1
              }}
            >
              <Text style={{ color: 'white', fontSize: 8, textAlign: 'center' }}>
                清内存
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearCache}
              style={{
                backgroundColor: '#F44336',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                flex: 1
              }}
            >
              <Text style={{ color: 'white', fontSize: 8, textAlign: 'center' }}>
                清全部
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
