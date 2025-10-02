import { useEffect, useRef } from 'react';
import { globalUploadListener } from '@/services/GlobalUploadListener';

export const useUploadListener = (componentId: string) => {
  const listenerIdsRef = useRef<Set<string>>(new Set());

  // 添加监听器
  const addListener = (
    messageId: string, 
    callback: (imageUrl: string) => void
  ): string => {
    const listenerId = globalUploadListener.addListener(
      messageId, 
      callback, 
      componentId
    );
    listenerIdsRef.current.add(listenerId);
    return listenerId;
  };

  // 移除特定监听器
  const removeListener = (listenerId: string) => {
    globalUploadListener.removeListener(listenerId);
    listenerIdsRef.current.delete(listenerId);
  };

  // 检查待上传数据
  const checkPendingUpload = async () => {
    return await globalUploadListener.getPendingUpload();
  };

  // 检查是否有待上传
  const hasPendingUpload = async () => {
    return await globalUploadListener.hasPendingUpload();
  };

  // 组件卸载时清理所有监听器
  useEffect(() => {
    return () => {
      console.log(`Component ${componentId} unmounting, cleaning up listeners`);
      globalUploadListener.removeComponentListeners(componentId);
      listenerIdsRef.current.clear();
    };
  }, [componentId]);

  return {
    addListener,
    removeListener,
    checkPendingUpload,
    hasPendingUpload,
    listenerCount: listenerIdsRef.current.size
  };
};
