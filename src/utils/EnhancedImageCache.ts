import { Image } from "expo-image";
import AsyncStorage from '@react-native-async-storage/async-storage';

// 增强的图片缓存管理类
export class EnhancedImageCacheManager {
  private static instance: EnhancedImageCacheManager;
  private preloadedImages: Set<string> = new Set();
  private readonly CACHE_KEY = 'preloaded_images';
  private readonly CACHE_EXPIRY_KEY = 'cache_expiry';
  private readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7天

  private constructor() {
    this.loadCacheFromStorage();
  }

  static getInstance(): EnhancedImageCacheManager {
    if (!EnhancedImageCacheManager.instance) {
      EnhancedImageCacheManager.instance = new EnhancedImageCacheManager();
    }
    return EnhancedImageCacheManager.instance;
  }

  // 从存储中加载缓存状态
  private async loadCacheFromStorage(): Promise<void> {
    try {
      const [cachedImages, expiry] = await Promise.all([
        AsyncStorage.getItem(this.CACHE_KEY),
        AsyncStorage.getItem(this.CACHE_EXPIRY_KEY)
      ]);

      // 检查缓存是否过期
      if (expiry && Date.now() > parseInt(expiry)) {

        await this.clearPersistentCache();
        return;
      }

      if (cachedImages) {
        const imageUrls = JSON.parse(cachedImages);
        this.preloadedImages = new Set(imageUrls);

      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  // 保存缓存状态到存储
  private async saveCacheToStorage(): Promise<void> {
    try {
      const imageUrls = Array.from(this.preloadedImages);
      const expiry = Date.now() + this.CACHE_DURATION;

      await Promise.all([
        AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(imageUrls)),
        AsyncStorage.setItem(this.CACHE_EXPIRY_KEY, expiry.toString())
      ]);


    } catch (error) {
      console.error('Failed to save cache to storage:', error);
    }
  }

  // 预加载图片
  async preloadImages(imageSources: any[]): Promise<void> {
    try {
      // 过滤出远程图片
      const remoteImages = imageSources.filter((source) => {
        if (typeof source === "string") {
          return source.startsWith("http://") || source.startsWith("https://");
        }
        if (source && typeof source === "object" && source.uri) {
          return (
            source.uri.startsWith("http://") ||
            source.uri.startsWith("https://")
          );
        }
        return false;
      });

      const newImages = remoteImages.filter((source) => {
        const key = typeof source === "string" ? source : source.uri;
        return !this.preloadedImages.has(key);
      });

      if (newImages.length > 0) {
        await Image.prefetch(newImages);

        // 记录已预加载的图片
        newImages.forEach((source) => {
          const key = typeof source === "string" ? source : source.uri;
          this.preloadedImages.add(key);
        });

        // 保存到持久化存储
        await this.saveCacheToStorage();


      } else {

      }
    } catch (error) {
      console.error("Failed to preload images:", error);
    }
  }

  // 预加载单个图片
  async preloadImage(imageSource: any): Promise<void> {
    try {
      const isRemote =
        typeof imageSource === "string"
          ? imageSource.startsWith("http://") ||
            imageSource.startsWith("https://")
          : imageSource &&
            typeof imageSource === "object" &&
            imageSource.uri &&
            (imageSource.uri.startsWith("http://") ||
              imageSource.uri.startsWith("https://"));

      if (!isRemote) {

        return;
      }

      const key =
        typeof imageSource === "string" ? imageSource : imageSource.uri;

      if (!this.preloadedImages.has(key)) {
        await Image.prefetch([imageSource]);
        this.preloadedImages.add(key);

        // 保存到持久化存储
        await this.saveCacheToStorage();


      } else {

      }
    } catch (error) {
      console.error("Failed to preload image:", error);
    }
  }

  // 检查图片是否已预加载
  isImagePreloaded(imageSource: any): boolean {
    const isRemote =
      typeof imageSource === "string"
        ? imageSource.startsWith("http://") ||
          imageSource.startsWith("https://")
        : imageSource &&
          typeof imageSource === "object" &&
          imageSource.uri &&
          (imageSource.uri.startsWith("http://") ||
            imageSource.uri.startsWith("https://"));

    if (!isRemote) {
      return true;
    }

    const key = typeof imageSource === "string" ? imageSource : imageSource.uri;
    return this.preloadedImages.has(key);
  }

  // 清除内存缓存
  async clearMemoryCache(): Promise<void> {
    try {
      await Image.clearMemoryCache();
      this.preloadedImages.clear();

    } catch (error) {
      console.error("Failed to clear image cache:", error);
    }
  }

  // 清除持久化缓存
  async clearPersistentCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.CACHE_KEY),
        AsyncStorage.removeItem(this.CACHE_EXPIRY_KEY)
      ]);
      this.preloadedImages.clear();

    } catch (error) {
      console.error("Failed to clear persistent cache:", error);
    }
  }

  // 清除所有缓存
  async clearAllCache(): Promise<void> {
    await Promise.all([
      this.clearMemoryCache(),
      this.clearPersistentCache()
    ]);
  }

  // 获取缓存统计信息
  getCacheStats(): {
    preloadedCount: number;
    hasPersistentCache: boolean;
    cacheExpiry: Date | null;
  } {
    return {
      preloadedCount: this.preloadedImages.size,
      hasPersistentCache: this.preloadedImages.size > 0,
      cacheExpiry: null // 可以从 AsyncStorage 获取
    };
  }

  // 获取已预加载的图片数量
  getPreloadedCount(): number {
    return this.preloadedImages.size;
  }
}

// 导出单例实例
export const enhancedImageCacheManager = EnhancedImageCacheManager.getInstance();

// 便捷函数
export const preloadImages = (imageSources: any[]) =>
  enhancedImageCacheManager.preloadImages(imageSources);
export const preloadImage = (imageSource: any) =>
  enhancedImageCacheManager.preloadImage(imageSource);
export const clearImageCache = () => enhancedImageCacheManager.clearMemoryCache();
export const clearAllImageCache = () => enhancedImageCacheManager.clearAllCache();
export const isImagePreloaded = (imageSource: any) =>
  enhancedImageCacheManager.isImagePreloaded(imageSource);
export const getCacheStats = () => enhancedImageCacheManager.getCacheStats();
