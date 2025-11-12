import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { UserImageService } from '@/services/UserImageService';
import { imageUpdateManager } from '@/utils/imageUpdateManager';
import type { UserImage } from '@/types/userImage.types';

export interface ImageItem {
  id: string;
  image_url: string;
  style: string;
  metadata: Record<string, any>;
}

interface ImageContextType {
  // 图片列表
  images: ImageItem[];
  // 原始数据（包含所有字段）
  allItems: UserImage[];
  // 可用风格列表
  availableStyles: string[];
  // 加载状态
  loading: boolean;
  // 刷新图片
  refreshImages: () => Promise<void>;
}

const ImageContext = createContext<ImageContextType | undefined>(undefined);

interface ImageProviderProps {
  children: ReactNode;
}

export const ImageProvider: React.FC<ImageProviderProps> = ({ children }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [allItems, setAllItems] = useState<UserImage[]>([]);
  const [availableStyles, setAvailableStyles] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // 加载图片
  const loadImages = useCallback(async () => {
    if (!user?.id) {
      setImages([]);
      setAllItems([]);
      setAvailableStyles(['All']);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 [ImageContext] 正在加载图片...');
      
      // 获取所有 items
      const items = await UserImageService.getUserImages(user.id);
      setAllItems(items);

      // 提取所有独特的风格
      const styles = ['All', ...new Set(items.map(item => item.style || 'Unknown').filter(Boolean))];
      setAvailableStyles(styles);

      // 提取所有图片 URL
      const allImages: ImageItem[] = items
        .filter(item => {
          const hasUrl = item.image_url && item.image_url.length > 0;
          if (!hasUrl) {
            console.warn(`⚠️ [ImageContext] 图片 ${item.id} 没有有效的 URL`);
          }
          return hasUrl;
        })
        .map(item => ({
          id: item.id,
          image_url: item.image_url,
          style: item.style || 'Unknown',
          metadata: item.metadata || {},
        }));

      console.log(`✅ [ImageContext] 成功获取 ${allImages.length} 张图片，${styles.length - 1} 个风格`);
      console.log(`📊 [ImageContext] 原始记录: ${items.length} 条，有效图片: ${allImages.length} 张`);
      
      // 打印前几张图片的 URL 用于调试
      if (allImages.length > 0) {
        console.log(`📸 [ImageContext] 前3张图片 URL:`, allImages.slice(0, 3).map(img => img.image_url));
      } else if (items.length > 0) {
        console.warn(`⚠️ [ImageContext] 有 ${items.length} 条记录，但没有有效图片 URL`);
        console.warn(`⚠️ [ImageContext] 记录示例:`, items.slice(0, 3).map(item => ({
          id: item.id,
          has_url: !!item.image_url,
          url_length: item.image_url?.length || 0,
          url_preview: item.image_url?.substring(0, 50) || 'N/A'
        })));
      }
      
      setImages(allImages);
    } catch (error) {
      console.error('❌ [ImageContext] 加载图片失败:', error);
      setImages([]);
      setAllItems([]);
      setAvailableStyles(['All']);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 刷新图片
  const refreshImages = useCallback(async () => {
    console.log('🔄 [ImageContext] 开始刷新图片...');
    try {
      await loadImages();
      console.log('✅ [ImageContext] 图片刷新完成');
    } catch (error) {
      console.error('❌ [ImageContext] 刷新图片失败:', error);
    }
  }, [loadImages]);

  // 用户登录时加载图片
  useEffect(() => {
    if (user?.id) {
      loadImages();
    } else {
      setImages([]);
      setAllItems([]);
      setAvailableStyles(['All']);
      setLoading(false);
    }
  }, [user?.id, loadImages]);

  // 监听图片更新通知
  useEffect(() => {
    const unsubscribe = imageUpdateManager.addListener((type) => {
      console.log(`🔔 [ImageContext] 收到图片更新通知: ${type}，刷新图片列表`);
      // 当有新图片时，自动重新加载
      if (type === 'lookbook' || type === 'all') {
        refreshImages();
      }
    });

    // 清理函数
    return () => {
      unsubscribe();
    };
  }, [refreshImages]);

  return (
    <ImageContext.Provider value={{ 
      images,
      allItems,
      availableStyles,
      loading,
      refreshImages,
    }}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImage = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error('useImage must be used within ImageProvider');
  }
  return context;
};

