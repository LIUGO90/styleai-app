import { Image } from 'expo-image';

// 图片缓存管理类
export class ImageCacheManager {
  private static instance: ImageCacheManager;
  private preloadedImages: Set<string> = new Set();

  private constructor() {}

  static getInstance(): ImageCacheManager {
    if (!ImageCacheManager.instance) {
      ImageCacheManager.instance = new ImageCacheManager();
    }
    return ImageCacheManager.instance;
  }

  // 预加载图片
  async preloadImages(imageSources: any[]): Promise<void> {
    try {
      // 过滤出远程图片（URI 格式）
      const remoteImages = imageSources.filter(source => {
        if (typeof source === 'string') {
          return source.startsWith('http://') || source.startsWith('https://');
        }
        if (source && typeof source === 'object' && source.uri) {
          return source.uri.startsWith('http://') || source.uri.startsWith('https://');
        }
        return false; // 本地 require() 图片不需要预加载
      });

      const newImages = remoteImages.filter(source => {
        const key = typeof source === 'string' ? source : source.uri;
        return !this.preloadedImages.has(key);
      });

      if (newImages.length > 0) {
        await Image.prefetch(newImages);
        
        // 记录已预加载的图片
        newImages.forEach(source => {
          const key = typeof source === 'string' ? source : source.uri;
          this.preloadedImages.add(key);
        });
        
        console.log(`Preloaded ${newImages.length} remote images`);
      } else {
        console.log('All remote images already preloaded');
      }
    } catch (error) {
      console.error('Failed to preload images:', error);
    }
  }

  // 预加载单个图片
  async preloadImage(imageSource: any): Promise<void> {
    try {
      // 检查是否为远程图片
      const isRemote = typeof imageSource === 'string' 
        ? (imageSource.startsWith('http://') || imageSource.startsWith('https://'))
        : (imageSource && typeof imageSource === 'object' && imageSource.uri && 
           (imageSource.uri.startsWith('http://') || imageSource.uri.startsWith('https://')));

      if (!isRemote) {
        console.log('Local image - no need to preload');
        return;
      }

      const key = typeof imageSource === 'string' ? imageSource : imageSource.uri;
      
      if (!this.preloadedImages.has(key)) {
        await Image.prefetch([imageSource]);
        this.preloadedImages.add(key);
        console.log('Remote image preloaded successfully');
      } else {
        console.log('Remote image already preloaded');
      }
    } catch (error) {
      console.error('Failed to preload image:', error);
    }
  }

  // 清除内存缓存
  async clearMemoryCache(): Promise<void> {
    try {
      await Image.clearMemoryCache();
      this.preloadedImages.clear();
      console.log('Image cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  // 检查图片是否已预加载
  isImagePreloaded(imageSource: any): boolean {
    // 本地图片不需要预加载检查
    const isRemote = typeof imageSource === 'string' 
      ? (imageSource.startsWith('http://') || imageSource.startsWith('https://'))
      : (imageSource && typeof imageSource === 'object' && imageSource.uri && 
         (imageSource.uri.startsWith('http://') || imageSource.uri.startsWith('https://')));

    if (!isRemote) {
      return true; // 本地图片视为已预加载
    }

    const key = typeof imageSource === 'string' ? imageSource : imageSource.uri;
    return this.preloadedImages.has(key);
  }

  // 获取已预加载的图片数量
  getPreloadedCount(): number {
    return this.preloadedImages.size;
  }
}

// 导出单例实例
export const imageCacheManager = ImageCacheManager.getInstance();

// 便捷函数
export const preloadImages = (imageSources: any[]) => imageCacheManager.preloadImages(imageSources);
export const preloadImage = (imageSource: any) => imageCacheManager.preloadImage(imageSource);
export const clearImageCache = () => imageCacheManager.clearMemoryCache();
export const isImagePreloaded = (imageSource: any) => imageCacheManager.isImagePreloaded(imageSource);
