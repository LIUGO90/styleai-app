// import * as TaskManager from "expo-task-manager";
// import * as BackgroundFetch from "expo-background-fetch";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as FileSystem from "expo-file-system";
// import { uploadAsync, FileSystemUploadType } from "expo-file-system/legacy";

// // 任务类型定义
// export interface BackgroundTask {
//   name: string;
//   task: () => Promise<BackgroundFetch.BackgroundFetchResult>;
//   options?: BackgroundFetch.BackgroundFetchOptions;
// }

// // 任务状态
// export interface TaskStatus {
//   isRegistered: boolean;
//   lastExecution?: Date;
//   executionCount: number;
//   lastResult?: BackgroundFetch.BackgroundFetchResult;
// }

// // 后台任务管理器
// export class BackTaskManager {
//   private static instance: BackTaskManager;
//   private tasks: Map<string, BackgroundTask> = new Map();
//   private taskStatuses: Map<string, TaskStatus> = new Map();

//   private constructor() {
//     this.initializeTaskManager();
//   }

//   public static getInstance(): BackTaskManager {
//     if (!BackTaskManager.instance) {
//       BackTaskManager.instance = new BackTaskManager();
//     }
//     return BackTaskManager.instance;
//   }

//   // 初始化任务管理器
//   private async initializeTaskManager() {
//     try {
//       // 加载任务状态
//       await this.loadTaskStatuses();

//       // 注册所有已定义的任务
//       await this.registerAllTasks();


//     } catch (error) {
//       console.error("后台任务管理器初始化失败:", error);
//     }
//   }

//   // 定义图片上传任务
//   public defineImageUploadTask() {
//     const taskName = "background-image-upload";

//     TaskManager.defineTask(taskName, async () => {
//       try {

//         // 获取待上传的图片
//         const pendingImages = await this.getPendingUploadImages();

//         if (pendingImages.length === 0) {

//           return BackgroundFetch.BackgroundFetchResult.NoData;
//         }

//         // 上传图片
//         let successCount = 0;
//         for (const imageData of pendingImages) {
//           try {
//             await this.uploadImage(imageData.uri);
//             successCount++;

//             // 从待上传列表中移除
//             await this.removePendingImage(imageData.id);


//           } catch (error) {
//             console.error(`图片上传失败: ${imageData.id}`, error);
//           }
//         }

//         // 更新任务状态
//         await this.updateTaskStatus(
//           taskName,
//           BackgroundFetch.BackgroundFetchResult.NewData,
//         );


//         return BackgroundFetch.BackgroundFetchResult.NewData;
//       } catch (error) {
//         console.error("后台图片上传任务失败:", error);
//         await this.updateTaskStatus(
//           taskName,
//           BackgroundFetch.BackgroundFetchResult.Failed,
//         );
//         return BackgroundFetch.BackgroundFetchResult.Failed;
//       }
//     });

//     // 注册任务
//     this.registerTask(taskName, {
//       name: taskName,
//       task: async () => {
//         // 任务逻辑已在上面定义
//         return BackgroundFetch.BackgroundFetchResult.NewData;
//       },
//       options: {
//         minimumInterval: 5 * 60, // 5分钟
//         stopOnTerminate: false,
//         startOnBoot: true,
//       },
//     });
//   }

//   // 定义数据同步任务
//   public defineDataSyncTask() {
//     const taskName = "background-data-sync";

//     TaskManager.defineTask(taskName, async () => {
//       try {

//         // 获取待同步的数据
//         const pendingData = await this.getPendingSyncData();

//         if (pendingData.length === 0) {

//           return BackgroundFetch.BackgroundFetchResult.NoData;
//         }

//         // 同步数据
//         let successCount = 0;
//         for (const data of pendingData) {
//           try {
//             await this.syncData(data);
//             successCount++;

//             // 从待同步列表中移除
//             await this.removePendingData(data.id);


//           } catch (error) {
//             console.error(`数据同步失败: ${data.id}`, error);
//           }
//         }

//         // 更新任务状态
//         await this.updateTaskStatus(
//           taskName,
//           BackgroundFetch.BackgroundFetchResult.NewData,
//         );


//         return BackgroundFetch.BackgroundFetchResult.NewData;
//       } catch (error) {
//         console.error("后台数据同步任务失败:", error);
//         await this.updateTaskStatus(
//           taskName,
//           BackgroundFetch.BackgroundFetchResult.Failed,
//         );
//         return BackgroundFetch.BackgroundFetchResult.Failed;
//       }
//     });

//     // 注册任务
//     this.registerTask(taskName, {
//       name: taskName,
//       task: async () => {
//         return BackgroundFetch.BackgroundFetchResult.NewData;
//       },
//       options: {
//         minimumInterval: 15 * 60, // 15分钟
//         stopOnTerminate: false,
//         startOnBoot: true,
//       },
//     });
//   }

//   // 定义通知检查任务
//   public defineNotificationTask() {
//     const taskName = "background-notification";

//     TaskManager.defineTask(taskName, async () => {
//       try {

//         // 检查是否需要发送通知
//         const shouldSendNotification = await this.checkNotificationConditions();

//         if (shouldSendNotification) {
//           await this.sendNotification();

//           await this.updateTaskStatus(
//             taskName,
//             BackgroundFetch.BackgroundFetchResult.NewData,
//           );
//           return BackgroundFetch.BackgroundFetchResult.NewData;
//         } else {

//           await this.updateTaskStatus(
//             taskName,
//             BackgroundFetch.BackgroundFetchResult.NoData,
//           );
//           return BackgroundFetch.BackgroundFetchResult.NoData;
//         }
//       } catch (error) {
//         console.error("后台通知任务失败:", error);
//         await this.updateTaskStatus(
//           taskName,
//           BackgroundFetch.BackgroundFetchResult.Failed,
//         );
//         return BackgroundFetch.BackgroundFetchResult.Failed;
//       }
//     });

//     // 注册任务
//     this.registerTask(taskName, {
//       name: taskName,
//       task: async () => {
//         return BackgroundFetch.BackgroundFetchResult.NewData;
//       },
//       options: {
//         minimumInterval: 30 * 60, // 30分钟
//         stopOnTerminate: false,
//         startOnBoot: true,
//       },
//     });
//   }

//   // 注册任务
//   private async registerTask(taskName: string, task: BackgroundTask) {
//     try {
//       this.tasks.set(taskName, task);

//       // 注册后台获取任务
//       await BackgroundFetch.registerTaskAsync(
//         taskName,
//         task.options || {
//           minimumInterval: 15 * 60,
//           stopOnTerminate: false,
//           startOnBoot: true,
//         },
//       );


//     } catch (error) {
//       console.error(`注册任务失败: ${taskName}`, error);
//     }
//   }

//   // 注册所有任务
//   private async registerAllTasks() {
//     for (const [taskName, task] of this.tasks) {
//       await this.registerTask(taskName, task);
//     }
//   }

//   // 启动所有后台任务
//   public async startAllTasks() {
//     try {

//       // 定义所有任务
//       this.defineImageUploadTask();
//       this.defineDataSyncTask();
//       this.defineNotificationTask();

//       // 注册所有任务
//       await this.registerAllTasks();


//     } catch (error) {
//       console.error("启动后台任务失败:", error);
//     }
//   }

//   // 停止所有后台任务
//   public async stopAllTasks() {
//     try {

//       for (const taskName of this.tasks.keys()) {
//         await BackgroundFetch.unregisterTaskAsync(taskName);

//       }


//     } catch (error) {
//       console.error("停止后台任务失败:", error);
//     }
//   }

//   // 获取任务状态
//   public async getTaskStatus(taskName: string): Promise<TaskStatus | null> {
//     return this.taskStatuses.get(taskName) || null;
//   }

//   // 获取所有任务状态
//   public async getAllTaskStatuses(): Promise<Map<string, TaskStatus>> {
//     return this.taskStatuses;
//   }

//   // 更新任务状态
//   private async updateTaskStatus(
//     taskName: string,
//     result: BackgroundFetch.BackgroundFetchResult,
//   ) {
//     const status = this.taskStatuses.get(taskName) || {
//       isRegistered: true,
//       executionCount: 0,
//     };

//     status.lastExecution = new Date();
//     status.executionCount++;
//     status.lastResult = result;

//     this.taskStatuses.set(taskName, status);

//     // 保存到本地存储
//     await this.saveTaskStatuses();
//   }

//   // 保存任务状态到本地存储
//   private async saveTaskStatuses() {
//     try {
//       const statuses = Object.fromEntries(this.taskStatuses);
//       await AsyncStorage.setItem(
//         "backgroundTaskStatuses",
//         JSON.stringify(statuses),
//       );
//     } catch (error) {
//       console.error("保存任务状态失败:", error);
//     }
//   }

//   // 从本地存储加载任务状态
//   private async loadTaskStatuses() {
//     try {
//       const statusesJson = await AsyncStorage.getItem("backgroundTaskStatuses");
//       if (statusesJson) {
//         const statuses = JSON.parse(statusesJson);
//         this.taskStatuses = new Map(Object.entries(statuses));
//       }
//     } catch (error) {
//       console.error("加载任务状态失败:", error);
//     }
//   }

//   // 添加待上传图片
//   public async addPendingUploadImage(imageUri: string, metadata?: any) {
//     try {
//       const pendingImages = await this.getPendingUploadImages();
//       const newImage = {
//         id: Date.now().toString(),
//         uri: imageUri,
//         metadata,
//         createdAt: new Date().toISOString(),
//       };

//       pendingImages.push(newImage);
//       await AsyncStorage.setItem(
//         "pendingUploadImages",
//         JSON.stringify(pendingImages),
//       );


//     } catch (error) {
//       console.error("添加待上传图片失败:", error);
//     }
//   }

//   // 添加待同步数据
//   public async addPendingSyncData(data: any) {
//     try {
//       const pendingData = await this.getPendingSyncData();
//       const newData = {
//         id: Date.now().toString(),
//         data,
//         createdAt: new Date().toISOString(),
//       };

//       pendingData.push(newData);
//       await AsyncStorage.setItem(
//         "pendingSyncData",
//         JSON.stringify(pendingData),
//       );


//     } catch (error) {
//       console.error("添加待同步数据失败:", error);
//     }
//   }

//   // 获取待上传图片
//   private async getPendingUploadImages(): Promise<any[]> {
//     try {
//       const pendingImages = await AsyncStorage.getItem("pendingUploadImages");
//       return pendingImages ? JSON.parse(pendingImages) : [];
//     } catch (error) {
//       console.error("获取待上传图片失败:", error);
//       return [];
//     }
//   }

//   // 获取待同步数据
//   private async getPendingSyncData(): Promise<any[]> {
//     try {
//       const pendingData = await AsyncStorage.getItem("pendingSyncData");
//       return pendingData ? JSON.parse(pendingData) : [];
//     } catch (error) {
//       console.error("获取待同步数据失败:", error);
//       return [];
//     }
//   }

//   // 移除待上传图片
//   private async removePendingImage(imageId: string) {
//     try {
//       const pendingImages = await this.getPendingUploadImages();
//       const filteredImages = pendingImages.filter((img) => img.id !== imageId);
//       await AsyncStorage.setItem(
//         "pendingUploadImages",
//         JSON.stringify(filteredImages),
//       );
//     } catch (error) {
//       console.error("移除待上传图片失败:", error);
//     }
//   }

//   // 移除待同步数据
//   private async removePendingData(dataId: string) {
//     try {
//       const pendingData = await this.getPendingSyncData();
//       const filteredData = pendingData.filter((item) => item.id !== dataId);
//       await AsyncStorage.setItem(
//         "pendingSyncData",
//         JSON.stringify(filteredData),
//       );
//     } catch (error) {
//       console.error("移除待同步数据失败:", error);
//     }
//   }

//   // 图片上传方法
//   private async uploadImage(selectedImage: string): Promise<string> {
//     try {
//       const imageUri = selectedImage.split("/").pop() || "";

//        const response = await uploadAsync(
//         `${process.env.EXPO_PUBLIC_API_URL}/api/apple/upload`,
//         selectedImage,
//         {
//           httpMethod: "POST", // Or 'PUT' depending on your server
//           uploadType: FileSystemUploadType.BINARY_CONTENT,
//           headers: {
//             "Content-Type": "image/jpeg",
//             "file-name": imageUri, // Or the appropriate image type
//           },
//         },
//       );

//       const imageUrl = JSON.parse(response.body).blobUrl;

//       await AsyncStorage.setItem("imageUrl", imageUrl);
//       return imageUrl;
//     } catch (error) {
//       console.error("Upload failed:", error);
//       return "error";
//     }
//   }

//   private async generateOpenaiStyle(imageUri: string): Promise<void> {
//     const response = await fetch(
//       `${process.env.EXPO_PUBLIC_API_URL}/api/apple/ai_style`,
//       {
//         method: "POST",
//         body: imageUri,
//       },
//     );
//     if (!response.ok) {
//       throw new Error(`上传失败: ${response.status}`);
//     }

//     return response.json();
//   }

//   private async generateKlingImage(imageUri: string): Promise<void> {
//     const response = await fetch(
//       `${process.env.EXPO_PUBLIC_API_URL}/api/apple/kling`,
//       {
//         method: "POST",
//         body: JSON.stringify({
//           imageUri: imageUri,
//         }),
//       },
//     );
//     if (!response.ok) {
//       throw new Error(`上传失败: ${response.status}`);
//     }

//     return response.json();
//   }

//   // 数据同步方法
//   private async syncData(data: any): Promise<void> {
//     // 模拟数据同步
//     return new Promise((resolve) => {
//       setTimeout(() => {

//         resolve();
//       }, 1000);
//     });
//   }

//   // 检查通知条件
//   private async checkNotificationConditions(): Promise<boolean> {
//     // 模拟检查通知条件
//     return Math.random() > 0.7; // 30% 概率发送通知
//   }

//   // 发送通知
//   private async sendNotification(): Promise<void> {
//     // 模拟发送通知

//   }

//   // 获取后台获取状态
//   public async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
//     try {
//       return await BackgroundFetch.getStatusAsync();
//     } catch (error) {
//       console.error("获取后台获取状态失败:", error);
//       return null;
//     }
//   }
// }

// // 导出单例实例
// export const backTaskManager = BackTaskManager.getInstance();
