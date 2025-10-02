import * as FileSystem from 'expo-file-system';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import UploadStateManager from './UploadStateManager';

interface UploadImageForGeminiAnalyzeResponse {
  message: string; // 返回的消息
  image: string; // 返回的Gemini图片URL
  uploadedImage: string; // 返回的上传到服务器的图片URL
}

// 压缩图片的辅助函数
const compressImage = async (imageUri: string, maxWidth: number = 1024): Promise<string> => {
  try {
    console.log('开始压缩图片...');
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: maxWidth } }, // 限制最大宽度，保持比例
      ],
      { 
        compress: 0.7,  // 70% 压缩率
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    console.log('图片压缩完成:', manipResult.uri);
    return manipResult.uri;
  } catch (error) {
    console.error('图片压缩失败，使用原图:', error);
    return imageUri; // 压缩失败则使用原图
  }
};

export const uploadImageForGeminiAnalyze = async (userId: string, selectedImage: string): Promise<UploadImageForGeminiAnalyzeResponse> => {
  const stateManager = UploadStateManager.getInstance();
  // 检查是否可以开始上传
  if (!stateManager.canStartUpload(selectedImage)) {
    return { message: 'error', image: '', uploadedImage: '' };
  }

  // 开始上传
  stateManager.startUpload(selectedImage);

  try {
    // 先压缩图片
    const compressedImage = await compressImage(selectedImage, 512);
    
    const imageUri = selectedImage.split('/').pop() || '';
    console.log('开始上传图片:', imageUri);

    const response = await uploadAsync(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/gemini`, compressedImage, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'image/jpeg',
        'file-name': imageUri,
        'user-id': userId,
      },
    });
    
    stateManager.finishUpload(selectedImage, true);
    console.log('上传成功:', response);
    const body = JSON.parse(response.body);
    console.log('上传成功:', body);
    if (body.success === true) {
      const message = body.message;
      const image = body.image;
      const uploadedImage = body.uploadedImage;
      console.log('返回的图片URL:', image);
      console.log('返回的消息:', message);
      console.log('返回的图片URL:', uploadedImage);
      return { message, image, uploadedImage };
    } else {
      return { message: 'error', image: '', uploadedImage: '' };
    }
  } catch (error) {
    console.error('上传失败:', error);

    // 标记上传失败
    stateManager.finishUpload(selectedImage, false);

    throw error;
  }
}
export const uploadImageWithFileSystem = async (userId: string, selectedImage: string): Promise<string | null> => {
  const stateManager = UploadStateManager.getInstance();

  // 检查是否可以开始上传
  if (!stateManager.canStartUpload(selectedImage)) {
    return null;
  }

  // 开始上传
  stateManager.startUpload(selectedImage);

  try {
    // 先压缩图片
    const compressedImage = await compressImage(selectedImage, 512);
    
    const imageUri = selectedImage.split('/').pop() || '';
    console.log('开始上传图片:', imageUri);

    const response = await uploadAsync(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/upload`, compressedImage, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.BINARY_CONTENT,
      headers: {
        'Content-Type': 'image/jpeg',
        'file-name': imageUri,
        'user-id': userId,
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

// 删除远程图片
export const deleteRemoteImage = async (userId: string, imageUrl: string): Promise<boolean> => {
  try {
    console.log('开始删除远程图片:', imageUrl);

    // 从URL中提取图片ID或文件名
    // const imageId = imageUrl.split('/').pop() || '';
    // console.log('提取的图片ID:', imageId);

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/upload`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'user-id': userId,
      },
      body: JSON.stringify({
        blobUrl: imageUrl,
        userId: userId,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('删除成功:', result);
      return true;
    } else {
      console.error('删除失败，状态码:', response.status);
      return false;
    }
  } catch (error) {
    console.error('删除远程图片失败:', error);
    return false;
  }
};

// 批量删除远程图片
export const deleteMultipleRemoteImages = async (userId: string, imageUrls: string[]): Promise<{ success: string[], failed: string[] }> => {
  const results = { success: [] as string[], failed: [] as string[] };

  for (const imageUrl of imageUrls) {
    const isDeleted = await deleteRemoteImage(userId, imageUrl);
    if (isDeleted) {
      results.success.push(imageUrl);
    } else {
      results.failed.push(imageUrl);
    }
  }

  console.log('批量删除结果:', results);
  return results;
};