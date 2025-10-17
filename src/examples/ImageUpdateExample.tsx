/**
 * 图片更新管理器使用示例
 * 
 * 展示如何在不同场景下使用 imageUpdateManager
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { imageUpdateManager, ImageUpdateType } from '@/utils/imageUpdateManager';

// ============================================
// 示例 1: Lookbook 页面 - 基本实现
// ============================================
export function LookbookPageExample() {
  const [images, setImages] = React.useState<string[]>([]);

  const loadImages = useCallback(async () => {
    console.log('📥 加载图片...');
    // 模拟加载图片
    await new Promise(resolve => setTimeout(resolve, 500));
    setImages(['img1.jpg', 'img2.jpg', 'img3.jpg']);
    console.log('✅ 图片加载完成');
  }, []);

  useFocusEffect(
    useCallback(() => {
      // 初始加载
      loadImages();
      
      // 监听图片更新
      const unsubscribe = imageUpdateManager.addListener((type) => {
        console.log(`🔄 收到图片更新通知: ${type}`);
        
        if (type === 'lookbook' || type === 'all') {
          loadImages(); // 自动重新加载
        }
      });
      
      // 清理
      return () => {
        unsubscribe();
      };
    }, [loadImages])
  );

  return (
    <ScrollView>
      {images.map((img, index) => (
        <View key={index}>
          <Text>{img}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ============================================
// 示例 2: Closet 页面 - 多类型监听
// ============================================
export function ClosetPageExample() {
  const [items, setItems] = React.useState<any[]>([]);

  const loadItems = useCallback(async () => {
    console.log('📥 加载 Closet 项目...');
    // 加载逻辑
    setItems([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
      
      const unsubscribe = imageUpdateManager.addListener((type) => {
        // 响应 closet 或 all 类型的更新
        if (type === 'closet' || type === 'all') {
          console.log('🔄 Closet 页面收到更新通知');
          loadItems();
        }
      });
      
      return () => unsubscribe();
    }, [loadItems])
  );

  return (
    <View>
      <Text>Closet 页面</Text>
    </View>
  );
}

// ============================================
// 示例 3: 带加载状态的页面
// ============================================
export function PageWithLoadingExample() {
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📥 开始加载数据...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(['item1', 'item2']);
      console.log('✅ 数据加载完成');
    } catch (error) {
      console.error('❌ 加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      
      const unsubscribe = imageUpdateManager.addListener((type) => {
        if (type === 'lookbook' || type === 'all') {
          console.log('🔄 收到更新，重新加载...');
          loadData();
        }
      });
      
      return () => unsubscribe();
    }, [loadData])
  );

  return (
    <View>
      {loading ? (
        <Text>加载中...</Text>
      ) : (
        <View>
          {data.map((item, index) => (
            <Text key={index}>{item}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================
// 示例 4: 发布更新通知（服务端）
// ============================================
export const saveImageAndNotify = async (
  imageUrl: string,
  type: ImageUpdateType = 'lookbook'
) => {
  try {
    console.log(`📸 保存图片: ${imageUrl}`);
    
    // 模拟保存图片到数据库
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 🔔 发送更新通知
    imageUpdateManager.notifyImageUpdate(type);
    
    console.log('✅ 图片保存成功，已发送更新通知');
  } catch (error) {
    console.error('❌ 保存失败:', error);
  }
};

// ============================================
// 示例 5: 手动触发更新（测试用）
// ============================================
export function ManualUpdateTrigger() {
  const handleTriggerLookbook = () => {
    console.log('🔔 手动触发 Lookbook 更新');
    imageUpdateManager.notifyImageUpdate('lookbook');
  };

  const handleTriggerCloset = () => {
    console.log('🔔 手动触发 Closet 更新');
    imageUpdateManager.notifyImageUpdate('closet');
  };

  const handleTriggerAll = () => {
    console.log('🔔 手动触发所有页面更新');
    imageUpdateManager.notifyImageUpdate('all');
  };

  return (
    <View>
      <TouchableOpacity onPress={handleTriggerLookbook}>
        <Text>触发 Lookbook 更新</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleTriggerCloset}>
        <Text>触发 Closet 更新</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={handleTriggerAll}>
        <Text>触发所有更新</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 6: 条件监听（只在特定条件下刷新）
// ============================================
export function ConditionalListenerExample() {
  const [autoRefresh, setAutoRefresh] = React.useState(true);
  const [data, setData] = React.useState<any[]>([]);

  const loadData = useCallback(async () => {
    console.log('📥 加载数据...');
    setData([]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
      
      const unsubscribe = imageUpdateManager.addListener((type) => {
        // 只在 autoRefresh 为 true 时才刷新
        if (autoRefresh && (type === 'lookbook' || type === 'all')) {
          console.log('🔄 自动刷新已启用，重新加载数据');
          loadData();
        } else {
          console.log('⏸️ 自动刷新已禁用，跳过更新');
        }
      });
      
      return () => unsubscribe();
    }, [loadData, autoRefresh]) // 注意：autoRefresh 在依赖数组中
  );

  return (
    <View>
      <TouchableOpacity onPress={() => setAutoRefresh(!autoRefresh)}>
        <Text>
          自动刷新: {autoRefresh ? '开启' : '关闭'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 7: 多个监听器同时工作
// ============================================
export function MultipleListenersExample() {
  useFocusEffect(
    useCallback(() => {
      // 监听器 1: 记录日志
      const unsubscribe1 = imageUpdateManager.addListener((type) => {
        console.log(`📊 监听器 1: 收到 ${type} 更新`);
      });
      
      // 监听器 2: 显示通知
      const unsubscribe2 = imageUpdateManager.addListener((type) => {
        console.log(`🔔 监听器 2: 显示 ${type} 通知`);
      });
      
      // 监听器 3: 更新分析数据
      const unsubscribe3 = imageUpdateManager.addListener((type) => {
        console.log(`📈 监听器 3: 更新 ${type} 分析`);
      });
      
      return () => {
        unsubscribe1();
        unsubscribe2();
        unsubscribe3();
      };
    }, [])
  );

  return (
    <View>
      <Text>多个监听器示例</Text>
    </View>
  );
}

// ============================================
// 示例 8: 错误处理
// ============================================
export function ErrorHandlingExample() {
  const [data, setData] = React.useState<any[]>([]);

  const loadDataWithErrorHandling = useCallback(async () => {
    try {
      console.log('📥 加载数据...');
      
      // 模拟可能失败的操作
      if (Math.random() > 0.5) {
        throw new Error('加载失败');
      }
      
      setData(['item1', 'item2']);
      console.log('✅ 加载成功');
    } catch (error) {
      console.error('❌ 加载失败:', error);
      // 错误处理：显示错误消息，但不影响监听器
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDataWithErrorHandling();
      
      const unsubscribe = imageUpdateManager.addListener((type) => {
        if (type === 'lookbook' || type === 'all') {
          // 即使之前加载失败，也重试
          console.log('🔄 收到更新通知，重试加载...');
          loadDataWithErrorHandling();
        }
      });
      
      return () => unsubscribe();
    }, [loadDataWithErrorHandling])
  );

  return (
    <View>
      <Text>错误处理示例</Text>
    </View>
  );
}

// ============================================
// 示例 9: 带过滤器的页面
// ============================================
export function PageWithFilterExample() {
  const [filter, setFilter] = React.useState<string>('all');
  const [data, setData] = React.useState<any[]>([]);

  const loadFilteredData = useCallback(async () => {
    console.log(`📥 加载数据，筛选: ${filter}`);
    // 根据 filter 加载数据
    setData([]);
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadFilteredData();
      
      const unsubscribe = imageUpdateManager.addListener((type) => {
        if (type === 'lookbook' || type === 'all') {
          // 保持当前筛选器，重新加载
          console.log(`🔄 更新数据，保持筛选: ${filter}`);
          loadFilteredData();
        }
      });
      
      return () => unsubscribe();
    }, [loadFilteredData])
  );

  return (
    <View>
      <TouchableOpacity onPress={() => setFilter('casual')}>
        <Text>Casual</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setFilter('formal')}>
        <Text>Formal</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 10: 查看监听器状态
// ============================================
export function ListenerStatusExample() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const listenerCount = imageUpdateManager.getListenerCount();
      setCount(listenerCount);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <Text>当前监听器数量: {count}</Text>
    </View>
  );
}

// ============================================
// 最佳实践模板
// ============================================
export function BestPracticeTemplate() {
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // 数据加载函数
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📥 开始加载数据...');
      // 你的加载逻辑
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData([]);
      console.log('✅ 数据加载完成');
    } catch (error) {
      console.error('❌ 加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 使用 useFocusEffect 管理生命周期
  useFocusEffect(
    useCallback(() => {
      // 1. 初始加载
      loadData();
      
      // 2. 添加监听器
      const unsubscribe = imageUpdateManager.addListener((type) => {
        console.log(`🔄 收到图片更新通知: ${type}`);
        
        // 3. 检查类型并重新加载
        if (type === 'lookbook' || type === 'all') {
          loadData();
        }
      });
      
      // 4. 返回清理函数
      return () => {
        unsubscribe();
      };
    }, [loadData])
  );

  return (
    <View>
      {loading ? (
        <Text>加载中...</Text>
      ) : (
        <ScrollView>
          {data.map((item, index) => (
            <Text key={index}>{item}</Text>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

