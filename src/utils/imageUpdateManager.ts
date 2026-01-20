/**
 * 图片更新管理器
 * 用于在有新图片添加时通知相关页面进行更新
 */

export type ImageUpdateType = 'lookbook' | 'closet' | 'all';

// 事件监听器类型
type ImageUpdateListener = (type: ImageUpdateType) => void;

class ImageUpdateManager {
  private listeners: Set<ImageUpdateListener> = new Set();

  /**
   * 添加图片更新监听器
   * @param listener 监听函数
   * @returns 取消监听的函数
   */
  addListener(listener: ImageUpdateListener): () => void {
    this.listeners.add(listener);

    // 返回取消监听的函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有监听器有新图片
   * @param type 图片更新类型
   */
  notifyImageUpdate(type: ImageUpdateType = 'all'): void {
    this.listeners.forEach(listener => {
      try {
        listener(type);
      } catch (error) {
        console.error('❌ 图片更新监听器执行失败:', error);
      }
    });
  }

  /**
   * 清除所有监听器
   */
  clearAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * 获取当前监听器数量
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}

// 导出单例实例
export const imageUpdateManager = new ImageUpdateManager();

