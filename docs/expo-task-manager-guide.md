# Expo Task Manager 使用指南

## 概述

`expo-task-manager` 是 Expo 提供的后台任务管理库，允许应用在后台执行任务。这对于需要持续处理数据、上传文件、同步信息等场景非常有用。

## 主要功能

### 1. 后台任务执行
- 在应用进入后台时继续运行任务
- 处理长时间运行的操作
- 在应用被挂起时保持任务活跃

### 2. 任务管理
- 定义、启动、停止后台任务
- 监控任务状态和进度
- 处理任务完成和错误情况

### 3. 系统集成
- 与 iOS 和 Android 的后台处理机制集成
- 支持不同的后台模式

## 安装依赖

```bash
npx expo install expo-task-manager expo-background-fetch
```

## 核心概念

### TaskManager.defineTask()
定义后台任务，指定任务名称和执行逻辑。

### BackgroundFetch.registerTaskAsync()
注册后台获取任务，设置执行间隔和选项。

### BackgroundFetch.BackgroundFetchResult
任务执行结果枚举：
- `NewData`: 有新数据
- `NoData`: 无数据
- `Failed`: 执行失败

## 使用示例

### 1. 基础任务定义

```typescript
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// 定义任务
TaskManager.defineTask('background-sync', async () => {
  try {
    // 执行同步逻辑
    await syncData();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 注册任务
await BackgroundFetch.registerTaskAsync('background-sync', {
  minimumInterval: 15 * 60, // 15分钟
  stopOnTerminate: false,
  startOnBoot: true,
});
```

### 2. 图片上传任务

```typescript
TaskManager.defineTask('background-image-upload', async () => {
  try {
    const pendingImages = await getPendingUploadImages();
    
    for (const image of pendingImages) {
      await uploadImage(image);
      await removePendingImage(image.id);
    }
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
```

### 3. 数据同步任务

```typescript
TaskManager.defineTask('background-data-sync', async () => {
  try {
    const pendingData = await getPendingSyncData();
    
    for (const data of pendingData) {
      await syncDataToServer(data);
      await removePendingData(data.id);
    }
    
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
```

## 任务管理器封装

我们提供了一个完整的任务管理器封装 (`BackTaskManager`)，包含以下功能：

### 主要方法

```typescript
// 启动所有后台任务
await backTaskManager.startAllTasks();

// 停止所有后台任务
await backTaskManager.stopAllTasks();

// 添加待上传图片
await backTaskManager.addPendingUploadImage(imageUri, metadata);

// 添加待同步数据
await backTaskManager.addPendingSyncData(data);

// 获取任务状态
const status = await backTaskManager.getTaskStatus('task-name');

// 获取所有任务状态
const allStatuses = await backTaskManager.getAllTaskStatuses();
```

### 任务类型

1. **图片上传任务** (`background-image-upload`)
   - 执行间隔: 5分钟
   - 功能: 上传待上传的图片到服务器

2. **数据同步任务** (`background-data-sync`)
   - 执行间隔: 15分钟
   - 功能: 同步待同步的数据到服务器

3. **通知检查任务** (`background-notification`)
   - 执行间隔: 30分钟
   - 功能: 检查是否需要发送通知

## 配置选项

### BackgroundFetch 选项

```typescript
{
  minimumInterval: 15 * 60, // 最小执行间隔（秒）
  stopOnTerminate: false,   // 应用终止时是否停止任务
  startOnBoot: true,        // 设备重启后是否自动启动
}
```

### 任务状态监控

```typescript
interface TaskStatus {
  isRegistered: boolean;           // 是否已注册
  lastExecution?: Date;            // 最后执行时间
  executionCount: number;          // 执行次数
  lastResult?: BackgroundFetchResult; // 最后执行结果
}
```

## 最佳实践

### 1. 任务设计原则

- **轻量级**: 任务应该快速完成，避免长时间运行
- **幂等性**: 任务可以重复执行而不产生副作用
- **容错性**: 任务应该能够处理各种错误情况

### 2. 数据管理

- 使用本地存储管理待处理数据
- 实现数据去重和清理机制
- 记录任务执行状态和结果

### 3. 错误处理

```typescript
TaskManager.defineTask('my-task', async () => {
  try {
    // 任务逻辑
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('任务执行失败:', error);
    // 记录错误，但不抛出异常
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
```

### 4. 资源管理

- 及时清理已处理的数据
- 避免在任务中执行耗时的 UI 操作
- 合理设置任务执行间隔

## 平台限制

### iOS 限制

- 后台任务执行时间有限制（通常30秒）
- 系统会根据应用使用情况调整执行频率
- 需要用户授权后台应用刷新权限

### Android 限制

- 不同厂商可能有不同的后台限制策略
- 建议使用前台服务处理重要任务
- 注意电池优化设置的影响

## 调试和监控

### 1. 日志记录

```typescript
TaskManager.defineTask('debug-task', async () => {
  console.log('任务开始执行:', new Date().toISOString());
  
  try {
    // 任务逻辑
    console.log('任务执行成功');
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('任务执行失败:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});
```

### 2. 状态监控

```typescript
// 获取后台获取状态
const status = await BackgroundFetch.getStatusAsync();

// 获取任务状态
const taskStatus = await backTaskManager.getTaskStatus('task-name');
```

### 3. 测试方法

1. 启动后台任务
2. 添加测试数据到队列
3. 将应用切换到后台
4. 等待系统触发任务执行
5. 重新打开应用查看结果

## 常见问题

### Q: 任务不执行怎么办？
A: 检查以下几点：
- 任务是否正确注册
- 系统权限是否已授权
- 任务执行间隔是否合理
- 设备是否处于低电量模式

### Q: 如何提高任务执行频率？
A: 
- 减少 `minimumInterval` 设置
- 确保任务快速完成
- 避免频繁的网络请求
- 考虑使用前台服务

### Q: 任务执行失败如何处理？
A:
- 实现重试机制
- 记录失败原因
- 提供手动触发选项
- 考虑降级处理方案

## 总结

`expo-task-manager` 提供了强大的后台任务管理能力，通过合理的封装和使用，可以实现可靠的后台数据处理。关键是要理解平台限制，设计轻量级的任务，并做好错误处理和状态监控。
