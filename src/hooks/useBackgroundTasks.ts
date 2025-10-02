import { useState, useEffect } from 'react';
import { BackgroundTaskService } from '@/services/BackgroundTaskService';
import { checkBackgroundPermissions, requestBackgroundPermissions } from '@/utils/permissions';

export const useBackgroundTasks = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    available: false,
    status: '检查中...',
    needsPermission: false
  });
  const [isTasksRunning, setIsTasksRunning] = useState(false);

  // 检查权限状态
  const checkPermissions = async () => {
    try {
      const status = await checkBackgroundPermissions();
      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('检查权限失败:', error);
      return {
        available: false,
        status: '检查失败',
        needsPermission: true
      };
    }
  };

  // 启动后台任务
  const startTasks = async () => {
    try {
      // 先检查权限
      const status = await checkPermissions();
      
      if (status.available) {
        await BackgroundTaskService.startAllTasks();
        setIsTasksRunning(true);
        console.log('后台任务已启动');
        return true;
      } else if (status.needsPermission) {
        // 请求权限
        const granted = await requestBackgroundPermissions();
        if (granted) {
          await BackgroundTaskService.startAllTasks();
          setIsTasksRunning(true);
          console.log('权限获取成功，后台任务已启动');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('启动后台任务失败:', error);
      return false;
    }
  };

  // 停止后台任务
  const stopTasks = async () => {
    try {
      await BackgroundTaskService.stopAllTasks();
      setIsTasksRunning(false);
      console.log('后台任务已停止');
      return true;
    } catch (error) {
      console.error('停止后台任务失败:', error);
      return false;
    }
  };

  // 检查任务状态
  const checkTaskStatus = async () => {
    try {
      const status = await BackgroundTaskService.checkTaskStatus();
      return status;
    } catch (error) {
      console.error('检查任务状态失败:', error);
      return { available: false, status: null };
    }
  };

  // 初始化
  useEffect(() => {
    const initialize = async () => {
      try {
        await checkPermissions();
        setIsInitialized(true);
      } catch (error) {
        console.error('初始化失败:', error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  return {
    isInitialized,
    permissionStatus,
    isTasksRunning,
    checkPermissions,
    startTasks,
    stopTasks,
    checkTaskStatus
  };
};
