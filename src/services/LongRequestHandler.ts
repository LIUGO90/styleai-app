/**
 * 长请求处理器
 * 处理 App 挂起场景下的长时间 AI 请求
 * 
 * 核心思路：
 * 1. 提交任务到服务端（立即返回 taskId）
 * 2. 轮询任务状态（仅在 App 前台）
 * 3. App 挂起时保存任务ID
 * 4. App 恢复时继续检查任务
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";

interface PendingTask {
  taskId: string;
  type: "foryou" | "lookbook" | "outfit_check" | "style_item";
  timestamp: number;
  params: any;
  progress: number;
}

export interface TaskStatus {
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: any;
  error?: string;
}

class LongRequestHandler {
  private static instance: LongRequestHandler;
  private readonly STORAGE_KEY = "pending_long_tasks";
  private readonly MAX_TASK_AGE = 24 * 60 * 60 * 1000; // 24小时
  private readonly POLL_INTERVAL = 2000; // 2秒轮询一次
  private appStateSubscription: any;
  private activePollTimers: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): LongRequestHandler {
    if (!LongRequestHandler.instance) {
      LongRequestHandler.instance = new LongRequestHandler();
    }
    return LongRequestHandler.instance;
  }

  /**
   * 初始化服务
   */
  initialize(): void {
    // 监听 App 状态变化
    this.appStateSubscription = AppState.addEventListener(
      "change",
      this.handleAppStateChange.bind(this)
    );
  }

  /**
   * 清理服务
   */
  cleanup(): void {
    this.appStateSubscription?.remove();
    
    // 停止所有轮询
    this.activePollTimers.forEach(timer => clearTimeout(timer));
    this.activePollTimers.clear();
  }

  /**
   * 处理 App 状态变化
   */
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    if (nextAppState === "background") {
      // App 进入后台 - 停止所有轮询
      this.stopAllPolling();
    } else if (nextAppState === "active") {
      // App 回到前台 - 恢复检查任务
      await this.checkAllPendingTasks();
    }
  }

  /**
   * 停止所有轮询
   */
  private stopAllPolling(): void {
    this.activePollTimers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.activePollTimers.clear();
  }

  /**
   * 提交长任务
   */
  async submitTask(
    type: PendingTask["type"],
    params: any,
    apiEndpoint: string
  ): Promise<string> {
    try {

      // 发送到服务端
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const { taskId } = await response.json();

      // 持久化任务
      const task: PendingTask = {
        taskId,
        type,
        timestamp: Date.now(),
        params,
        progress: 0,
      };
      await this.persistTask(task);

      return taskId;
    } catch (error) {
      console.error("❌ 提交任务失败:", error);
      throw error;
    }
  }

  /**
   * 轮询任务状态（仅在前台）
   */
  async pollTaskStatus(
    taskId: string,
    statusEndpoint: string,
    onProgress?: (progress: number) => void,
    onComplete?: (result: any) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    // 检查是否已在轮询
    if (this.activePollTimers.has(taskId)) {
      return;
    }

    const poll = async () => {
      try {
        // 检查 App 状态
        if (AppState.currentState !== "active") {
          this.activePollTimers.delete(taskId);
          return;
        }

        // 查询任务状态
        const response = await fetch(statusEndpoint);
        const taskStatus: TaskStatus = await response.json();

        // 更新进度
        onProgress?.(taskStatus.progress);
        await this.updateTaskProgress(taskId, taskStatus.progress);

        if (taskStatus.status === "completed") {
          // 任务完成
          onComplete?.(taskStatus.result);
          await this.removeTask(taskId);
          this.activePollTimers.delete(taskId);
          return;
        }

        if (taskStatus.status === "failed") {
          // 任务失败
          onError?.(taskStatus.error || "Unknown error");
          await this.removeTask(taskId);
          this.activePollTimers.delete(taskId);
          return;
        }

        // 继续轮询
        const timer = setTimeout(poll, this.POLL_INTERVAL);
        this.activePollTimers.set(taskId, timer);
      } catch (error) {
        console.error(`❌ 轮询失败: ${taskId}`, error);
        
        // 轮询失败，稍后重试
        const timer = setTimeout(poll, this.POLL_INTERVAL * 2);
        this.activePollTimers.set(taskId, timer);
      }
    };

    // 开始轮询
    poll();
  }

  /**
   * 检查所有待完成任务
   */
  async checkAllPendingTasks(): Promise<void> {
    try {
      const tasks = await this.getAllPendingTasks();
      const now = Date.now();

      for (const task of tasks) {
        // 检查是否过期
        const age = now - task.timestamp;
        if (age > this.MAX_TASK_AGE) {
          await this.removeTask(task.taskId);
          continue;
        }

        // 这里应该查询任务状态
        // 实际实现时，需要根据任务类型调用不同的状态端点
        // 示例：
        // const statusEndpoint = this.getStatusEndpoint(task.type, task.taskId);
        // await this.checkTaskStatus(task.taskId, statusEndpoint);
      }
    } catch (error) {
      console.error("❌ 检查待完成任务失败:", error);
    }
  }

  /**
   * 检查单个任务状态
   */
  async checkTaskStatus(
    taskId: string,
    statusEndpoint: string
  ): Promise<TaskStatus | null> {
    try {
      const response = await fetch(statusEndpoint);
      const status: TaskStatus = await response.json();

      if (status.status === "completed" || status.status === "failed") {
        await this.removeTask(taskId);
      }

      return status;
    } catch (error) {
      console.error(`❌ 检查任务状态失败: ${taskId}`, error);
      return null;
    }
  }

  /**
   * 持久化任务
   */
  private async persistTask(task: PendingTask): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const tasks: PendingTask[] = stored ? JSON.parse(stored) : [];

      // 检查是否已存在
      const existingIndex = tasks.findIndex((t) => t.taskId === task.taskId);
      if (existingIndex >= 0) {
        tasks[existingIndex] = task;
      } else {
        tasks.push(task);
      }

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error("❌ 持久化任务失败:", error);
    }
  }

  /**
   * 更新任务进度
   */
  private async updateTaskProgress(
    taskId: string,
    progress: number
  ): Promise<void> {
    try {
      const tasks = await this.getAllPendingTasks();
      const task = tasks.find((t) => t.taskId === taskId);

      if (task) {
        task.progress = progress;
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
      }
    } catch (error) {
      console.error("❌ 更新任务进度失败:", error);
    }
  }

  /**
   * 移除任务
   */
  private async removeTask(taskId: string): Promise<void> {
    try {
      const tasks = await this.getAllPendingTasks();
      const filtered = tasks.filter((t) => t.taskId !== taskId);

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));

      // 停止轮询
      const timer = this.activePollTimers.get(taskId);
      if (timer) {
        clearTimeout(timer);
        this.activePollTimers.delete(taskId);
      }
    } catch (error) {
      console.error("❌ 移除任务失败:", error);
    }
  }

  /**
   * 获取所有待完成任务
   */
  async getAllPendingTasks(): Promise<PendingTask[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      return JSON.parse(stored);
    } catch (error) {
      console.error("❌ 获取待完成任务失败:", error);
      return [];
    }
  }

  /**
   * 清除所有任务
   */
  async clearAllTasks(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      this.stopAllPolling();
    } catch (error) {
      console.error("❌ 清除任务失败:", error);
    }
  }

  /**
   * 获取待完成任务数量
   */
  async getPendingTaskCount(): Promise<number> {
    const tasks = await this.getAllPendingTasks();
    return tasks.length;
  }
}

export const longRequestHandler = LongRequestHandler.getInstance();

