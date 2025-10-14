import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { preloadImage, preloadImages } from '@/utils/imageCache';
import { uploadAsync, FileSystemUploadType } from 'expo-file-system/legacy';
import { globalUploadListener } from './GlobalUploadListener';
// 任务名称常量
const BACKGROUND_TASKS = {
  IMAGE_UPLOAD: 'background-image-upload',
  MESSAGE_SYNC: 'background-message-sync',
  PUSH_NOTIFICATION: 'background-push-notification',
} as const;

// 图片上传后台任务
TaskManager.defineTask(BACKGROUND_TASKS.IMAGE_UPLOAD, async () => {

  try {
    // 获取待上传的图片队列
    const pendingUploads = await AsyncStorage.getItem('pendingImageUploads');
    if (!pendingUploads) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const uploads = JSON.parse(pendingUploads);
    let successCount = 0;

    for (const upload of uploads) {
      try {
        const response = await uploadAsync(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/upload`, upload, {
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.BINARY_CONTENT,
          headers: {
            'Content-Type': 'image/jpeg',
            'file-name': upload,
          },
        });


        const imageUrl = JSON.parse(response.body).blobUrl;

        successCount++;

        // 通知全局上传监听器
        await globalUploadListener.handleUploadComplete(upload.messageId, imageUrl);

        // 移除已上传的图片
        const remainingUploads = uploads.filter((u: any) => u.id !== upload.id);
        await AsyncStorage.setItem('pendingImageUploads', JSON.stringify(remainingUploads));

        preloadImage(imageUrl);

      } catch (error) {
        console.error('图片上传失败:', error);
      }
    }


    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('图片上传后台任务失败:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 消息同步后台任务
TaskManager.defineTask(BACKGROUND_TASKS.MESSAGE_SYNC, async () => {

  try {
    // 获取本地未同步的消息
    const localMessages = await AsyncStorage.getItem('localMessages');
    if (!localMessages) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const messages = JSON.parse(localMessages);
    let syncCount = 0;

    for (const message of messages) {
      try {
        // 同步消息到服务器
        const response = await fetch('https://your-api.com/messages/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        });

        if (response.ok) {
          syncCount++;
          // 标记消息为已同步
          message.synced = true;
        }
      } catch (error) {
        console.error('消息同步失败:', error);
      }
    }

    // 更新本地消息状态
    await AsyncStorage.setItem('localMessages', JSON.stringify(messages));


    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('消息同步后台任务失败:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 推送通知后台任务
TaskManager.defineTask(BACKGROUND_TASKS.PUSH_NOTIFICATION, async () => {

  try {
    // 检查是否有新消息
    const response = await fetch('https://your-api.com/messages/check');
    const data = await response.json();

    if (data.hasNewMessages) {
      // 发送本地通知
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '新消息',
          body: `您有 ${data.messageCount} 条新消息`,
          data: { type: 'new_message' },
        },
        trigger: null, // 立即发送
      });
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('推送通知后台任务失败:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export class BackgroundTaskService {
  // 启动所有后台任务
  static async startAllTasks() {
    try {
      // 启动图片上传任务
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASKS.IMAGE_UPLOAD, {
        minimumInterval: 2000, // 1秒
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // 启动消息同步任务
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASKS.MESSAGE_SYNC, {
        minimumInterval: 15000, // 15秒
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // 启动推送通知任务
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASKS.PUSH_NOTIFICATION, {
        minimumInterval: 60000, // 1分钟
        stopOnTerminate: false,
        startOnBoot: true,
      });


    } catch (error) {
      console.error('启动后台任务失败:', error);
    }
  }

  // 停止所有后台任务
  static async stopAllTasks() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASKS.IMAGE_UPLOAD);
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASKS.MESSAGE_SYNC);
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASKS.PUSH_NOTIFICATION);


    } catch (error) {
      console.error('停止后台任务失败:', error);
    }
  }

  // 添加图片到上传队列
  static async addImageToUploadQueue(imageUri: string, messageId: string) {
    try {
      const pendingUploads = await AsyncStorage.getItem('pendingImageUploads');
      const uploads = pendingUploads ? JSON.parse(pendingUploads) : [];

      const newUpload = {
        id: Date.now().toString(),
        imageUri,
        messageId,
        timestamp: new Date().toISOString(),
      };

      uploads.push(newUpload);
      await AsyncStorage.setItem('pendingImageUploads', JSON.stringify(uploads));


    } catch (error) {
      console.error('添加图片到上传队列失败:', error);
    }
  }

  // 添加消息到同步队列
  static async addMessageToSyncQueue(message: any) {
    try {
      const localMessages = await AsyncStorage.getItem('localMessages');
      const messages = localMessages ? JSON.parse(localMessages) : [];

      const newMessage = {
        ...message,
        id: Date.now().toString(),
        synced: false,
        timestamp: new Date().toISOString(),
      };

      messages.push(newMessage);
      await AsyncStorage.setItem('localMessages', JSON.stringify(messages));


    } catch (error) {
      console.error('添加消息到同步队列失败:', error);
    }
  }

  // 检查后台任务状态
  static async checkTaskStatus() {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      return {
        available: status === BackgroundFetch.BackgroundFetchStatus.Available,
        status: status,
      };
    } catch (error) {
      console.error('检查后台任务状态失败:', error);
      return { available: false, status: null };
    }
  }
}
