/**
 * 页面活动状态管理器使用示例
 * 
 * 展示如何在不同页面中使用 pageActivityManager
 */

import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { pageActivityManager } from '@/utils/pageActivityManager';
import { clearBadge } from '@/utils/badgeManager';

// ============================================
// 示例 1: Lookbook 页面
// ============================================
export function LookbookPageExample() {
  useFocusEffect(
    useCallback(() => {
      // 进入页面时
      pageActivityManager.setActivePage('lookbook');
      clearBadge('lookbook');
      
      console.log('✅ Lookbook 页面活跃');
      
      // 离开页面时
      return () => {
        pageActivityManager.clearActivePage();
        console.log('👋 离开 Lookbook 页面');
      };
    }, [])
  );

  return (
    <View>
      <Text>Lookbook 页面</Text>
    </View>
  );
}

// ============================================
// 示例 2: Closet 页面
// ============================================
export function ClosetPageExample() {
  useFocusEffect(
    useCallback(() => {
      pageActivityManager.setActivePage('closet');
      clearBadge('closet');
      
      return () => {
        pageActivityManager.clearActivePage();
      };
    }, [])
  );

  return (
    <View>
      <Text>Closet 页面</Text>
    </View>
  );
}

// ============================================
// 示例 3: My Profile 页面
// ============================================
export function MyProfilePageExample() {
  useFocusEffect(
    useCallback(() => {
      pageActivityManager.setActivePage('my');
      clearBadge('my');
      
      return () => {
        pageActivityManager.clearActivePage();
      };
    }, [])
  );

  return (
    <View>
      <Text>My Profile 页面</Text>
    </View>
  );
}

// ============================================
// 示例 4: 带数据加载的页面
// ============================================
export function PageWithDataLoadingExample() {
  const loadData = async () => {
    console.log('加载数据...');
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('数据加载完成');
  };

  useFocusEffect(
    useCallback(() => {
      // 1. 设置页面活动状态
      pageActivityManager.setActivePage('lookbook');
      
      // 2. 清除徽章
      clearBadge('lookbook');
      
      // 3. 加载数据
      loadData();
      
      // 4. 清理函数
      return () => {
        pageActivityManager.clearActivePage();
      };
    }, [])
  );

  return (
    <View>
      <Text>带数据加载的页面</Text>
    </View>
  );
}

// ============================================
// 示例 5: 检查页面活动状态
// ============================================
export function CheckPageActivityExample() {
  const checkActivity = () => {
    const activePage = pageActivityManager.getActivePage();
    console.log('当前活动页面:', activePage);
    
    const isLookbookActive = pageActivityManager.isPageActive('lookbook');
    console.log('Lookbook 是否活跃:', isLookbookActive);
  };

  React.useEffect(() => {
    checkActivity();
  }, []);

  return (
    <View>
      <Text>检查页面活动状态</Text>
    </View>
  );
}

// ============================================
// 示例 6: 带依赖项的 useFocusEffect
// ============================================
export function PageWithDependenciesExample() {
  const [filter, setFilter] = React.useState('all');

  const loadFilteredData = useCallback(async () => {
    console.log(`加载 ${filter} 数据...`);
    // 加载数据逻辑
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      pageActivityManager.setActivePage('lookbook');
      clearBadge('lookbook');
      
      // 加载数据
      loadFilteredData();
      
      return () => {
        pageActivityManager.clearActivePage();
      };
    }, [loadFilteredData]) // 添加依赖项
  );

  return (
    <View>
      <Text>带依赖项的页面</Text>
    </View>
  );
}

// ============================================
// 示例 7: Modal 场景（不改变页面状态）
// ============================================
export function ModalExample() {
  const [modalVisible, setModalVisible] = React.useState(false);

  // 注意：Modal 打开时不应该改变页面活动状态
  // 因为用户仍然在原页面的上下文中

  return (
    <View>
      <Text>Modal 示例</Text>
      {/* Modal 不需要设置页面活动状态 */}
    </View>
  );
}

// ============================================
// 示例 8: 手动控制页面状态（特殊场景）
// ============================================
export function ManualControlExample() {
  const handleEnterPage = () => {
    // 手动设置页面活动
    pageActivityManager.setActivePage('lookbook');
    console.log('手动进入页面');
  };

  const handleLeavePage = () => {
    // 手动清除页面状态
    pageActivityManager.clearActivePage();
    console.log('手动离开页面');
  };

  return (
    <View>
      <Text>手动控制示例</Text>
      {/* 通常不推荐手动控制，除非有特殊需求 */}
    </View>
  );
}

// ============================================
// 最佳实践总结
// ============================================

/**
 * 最佳实践：
 * 
 * 1. ✅ 始终在 useFocusEffect 中设置和清除页面状态
 * 2. ✅ 返回清理函数以清除状态
 * 3. ✅ 先设置活动状态，再清除徽章，最后加载数据
 * 4. ✅ 使用 useCallback 包裹回调函数
 * 5. ✅ 正确设置依赖项数组
 * 
 * 避免：
 * 
 * 1. ❌ 不要在 useEffect 中设置（应该用 useFocusEffect）
 * 2. ❌ 不要忘记返回清理函数
 * 3. ❌ 不要在 Modal 中改变页面状态
 * 4. ❌ 不要在组件卸载后设置状态（会导致内存泄漏警告）
 */

// ============================================
// 完整的模板代码
// ============================================
export function CompleteTemplateExample() {
  // 状态
  const [data, setData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // 数据加载函数
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 加载数据逻辑
      console.log('加载数据...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData([]);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 页面焦点效果
  useFocusEffect(
    useCallback(() => {
      // 1. 设置页面活动状态
      pageActivityManager.setActivePage('lookbook');
      
      // 2. 清除徽章
      clearBadge('lookbook');
      
      // 3. 加载数据
      loadData();
      
      // 4. 清理函数
      return () => {
        pageActivityManager.clearActivePage();
      };
    }, [loadData])
  );

  return (
    <View>
      {loading ? (
        <Text>加载中...</Text>
      ) : (
        <Text>数据已加载</Text>
      )}
    </View>
  );
}

