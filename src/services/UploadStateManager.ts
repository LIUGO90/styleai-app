// 全局上传状态管理器
class UploadStateManager {
  private static instance: UploadStateManager;
  private isUploading: boolean = false;
  private uploadQueue: Set<string> = new Set();
  private currentUpload: string | null = null;
  private uploadCallbacks: Map<string, Function[]> = new Map();

  private constructor() {}

  public static getInstance(): UploadStateManager {
    if (!UploadStateManager.instance) {
      UploadStateManager.instance = new UploadStateManager();
    }
    return UploadStateManager.instance;
  }

  // 检查是否可以开始上传
  public canStartUpload(imageUri: string): boolean {
    if (this.isUploading) {
      console.log('已有上传任务进行中，忽略重复请求');
      return false;
    }

    if (this.uploadQueue.has(imageUri)) {
      console.log('图片已在上传队列中，忽略重复请求');
      return false;
    }

    return true;
  }

  // 开始上传
  public startUpload(imageUri: string): void {
    this.isUploading = true;
    this.currentUpload = imageUri;
    this.uploadQueue.add(imageUri);
    console.log('开始上传:', imageUri.substring(0, 50) + '...');
  }

  // 完成上传
  public finishUpload(imageUri: string, success: boolean = true): void {
    this.isUploading = false;
    this.currentUpload = null;
    this.uploadQueue.delete(imageUri);
    
    if (success) {
      console.log('上传完成:', imageUri.substring(0, 50) + '...');
    } else {
      console.log('上传失败:', imageUri.substring(0, 50) + '...');
    }

    // 触发回调
    const callbacks = this.uploadCallbacks.get(imageUri) || [];
    callbacks.forEach(callback => callback(success));
    this.uploadCallbacks.delete(imageUri);
  }

  // 添加上传回调
  public addCallback(imageUri: string, callback: Function): void {
    if (!this.uploadCallbacks.has(imageUri)) {
      this.uploadCallbacks.set(imageUri, []);
    }
    this.uploadCallbacks.get(imageUri)!.push(callback);
  }

  // 获取当前状态
  public getStatus(): {
    isUploading: boolean;
    currentUpload: string | null;
    queueSize: number;
  } {
    return {
      isUploading: this.isUploading,
      currentUpload: this.currentUpload,
      queueSize: this.uploadQueue.size,
    };
  }

  // 重置状态（紧急情况使用）
  public reset(): void {
    this.isUploading = false;
    this.currentUpload = null;
    this.uploadQueue.clear();
    this.uploadCallbacks.clear();
    console.log('上传状态已重置');
  }

  // 检查特定图片是否正在上传
  public isImageUploading(imageUri: string): boolean {
    return this.uploadQueue.has(imageUri) || this.currentUpload === imageUri;
  }
}

export default UploadStateManager;
