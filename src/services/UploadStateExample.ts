// // 全局上传状态使用示例

// import { uploadImageWithFileSystem, getUploadStatus, isImageUploading, resetUploadState } from './FileUploadService';

// // 示例1：基本使用
// export const uploadImageExample = async (imageUri: string) => {
//   try {
//     // 检查全局状态
//     const status = getUploadStatus();
//     console.log('当前上传状态:', status);

//     // 检查特定图片是否正在上传
//     if (isImageUploading(imageUri)) {
//       console.log('该图片正在上传中，请稍候');
//       return null;
//     }

//     // 开始上传
//     const result = await uploadImageWithFileSystem(imageUri);
//     return result;
//   } catch (error) {
//     console.error('上传失败:', error);
//     return null;
//   }
// };

// // 示例2：批量上传管理
// export const batchUploadExample = async (imageUris: string[]) => {
//   const results: (string | null)[] = [];
  
//   for (const imageUri of imageUris) {
//     // 等待当前上传完成
//     while (getUploadStatus().isUploading) {
//       console.log('等待当前上传完成...');
//       await new Promise(resolve => setTimeout(resolve, 1000));
//     }
    
//     const result = await uploadImageWithFileSystem(imageUri);
//     results.push(result);
//   }
  
//   return results;
// };

// // 示例3：上传状态监控
// export const monitorUploadStatus = () => {
//   const status = getUploadStatus();
  
//   if (status.isUploading) {
//     console.log(`正在上传: ${status.currentUpload}`);
//     console.log(`队列大小: ${status.queueSize}`);
//   } else {
//     console.log('当前没有上传任务');
//   }
  
//   return status;
// };

// // 示例4：紧急重置（用于错误恢复）
// export const emergencyReset = () => {
//   console.log('执行紧急重置...');
//   resetUploadState();
//   console.log('上传状态已重置');
// };
