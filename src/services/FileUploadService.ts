import * as FileSystem from 'expo-file-system';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import UploadStateManager from './UploadStateManager';

export const uploadImageWithFileSystem = async (selectedImage: string): Promise<string | null> => {
  const stateManager = UploadStateManager.getInstance();
  
  // 检查是否可以开始上传
  if (!stateManager.canStartUpload(selectedImage)) {
    return null;
  }

  // 开始上传
  stateManager.startUpload(selectedImage);

  try {
    const imageUri = selectedImage.split('/').pop() || '';
    console.log('开始上传图片:', imageUri);
    
    const response = await uploadAsync(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/upload`, selectedImage, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'image/jpeg',
        'file-name': imageUri,
      },
    });
    
    console.log('上传成功:', response);
    const imageUrl = JSON.parse(response.body).blobUrl;
    console.log('返回的图片URL:', imageUrl);
    
    // 标记上传完成
    stateManager.finishUpload(selectedImage, true);
    
    return imageUrl;
  } catch (error) {
    console.error('上传失败:', error);
    
    // 标记上传失败
    stateManager.finishUpload(selectedImage, false);
    
    throw error;
  }
};

// 获取上传状态的辅助函数
export const getUploadStatus = () => {
  return UploadStateManager.getInstance().getStatus();
};

// 检查特定图片是否正在上传
export const isImageUploading = (imageUri: string) => {
  return UploadStateManager.getInstance().isImageUploading(imageUri);
};

// 重置上传状态（紧急情况使用）
export const resetUploadState = () => {
  UploadStateManager.getInstance().reset();
};