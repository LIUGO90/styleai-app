/**
 * 长请求处理示例
 * 展示如何处理 App 挂起场景下的长时间 AI 请求
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { longRequestHandler } from '@/services/LongRequestHandler';
import { useGlobalToast } from '@/utils/globalToast';

// ============================================
// 示例 1: ForYou 页面集成
// ============================================
export function ForYouLongRequestExample() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { showToast } = useGlobalToast();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      
      // 1. 提交任务到服务端（立即返回）
      showToast({ message: "Submitting request...", type: "info" });
      
      const taskId = await longRequestHandler.submitTask(
        'foryou',
        {
          userId: 'user123',
          imageUrl: ['img1.jpg', 'img2.jpg'],
          prompt: 'casual style'
        },
        `${process.env.EXPO_PUBLIC_API_URL}/api/tasks/submit`
      );
      
      console.log(`📋 任务ID: ${taskId}`);
      
      // 2. 开始轮询（仅在前台）
      showToast({ message: "Generating...", type: "info" });
      
      longRequestHandler.pollTaskStatus(
        taskId,
        `${process.env.EXPO_PUBLIC_API_URL}/api/tasks/${taskId}/status`,
        // onProgress
        (prog) => {
          setProgress(prog);
          console.log(`进度: ${prog}%`);
        },
        // onComplete
        (result) => {
          console.log('✅ 生成完成:', result);
          showToast({
            message: "Generation completed!",
            type: "success",
            action: {
              label: "View",
              onPress: () => {
                // 显示结果
              }
            }
          });
          setIsGenerating(false);
          setProgress(0);
        },
        // onError
        (error) => {
          console.error('❌ 生成失败:', error);
          showToast({ message: error, type: "error" });
          setIsGenerating(false);
          setProgress(0);
        }
      );
      
    } catch (error) {
      console.error("❌ 提交任务失败:", error);
      showToast({ message: "Failed to submit request", type: "error" });
      setIsGenerating(false);
    }
  };

  // App 回到前台时检查任务
  useFocusEffect(
    useCallback(() => {
      const checkTasks = async () => {
        const count = await longRequestHandler.getPendingTaskCount();
        if (count > 0) {
          console.log(`📋 发现 ${count} 个待完成任务`);
          showToast({
            message: `You have ${count} pending task(s)`,
            type: "info",
            action: {
              label: "Check",
              onPress: async () => {
                await longRequestHandler.checkAllPendingTasks();
              }
            }
          });
        }
      };
      
      checkTasks();
    }, [])
  );

  return (
    <View>
      <TouchableOpacity
        onPress={handleGenerate}
        disabled={isGenerating}
        style={{ opacity: isGenerating ? 0.6 : 1 }}
      >
        {isGenerating ? (
          <View>
            <ActivityIndicator />
            <Text>Generating... {progress}%</Text>
          </View>
        ) : (
          <Text>Generate Look</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 2: 简化版（使用辅助函数）
// ============================================
export function SimplifiedLongRequestExample() {
  const { showToast } = useGlobalToast();
  const [progress, setProgress] = useState(0);

  const generateWithBackgroundSupport = async () => {
    try {
      // 提交并轮询
      const taskId = await longRequestHandler.submitTask(
        'foryou',
        { /* params */ },
        '/api/tasks/submit'
      );

      await longRequestHandler.pollTaskStatus(
        taskId,
        `/api/tasks/${taskId}/status`,
        (prog) => setProgress(prog),
        (result) => showToast({ message: "Done!", type: "success" }),
        (error) => showToast({ message: error, type: "error" })
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <TouchableOpacity onPress={generateWithBackgroundSupport}>
      <Text>Generate ({progress}%)</Text>
    </TouchableOpacity>
  );
}

// ============================================
// 示例 3: 手动检查待完成任务
// ============================================
export function PendingTasksViewer() {
  const [tasks, setTasks] = useState<any[]>([]);

  const loadTasks = async () => {
    const pending = await longRequestHandler.getAllPendingTasks();
    setTasks(pending);
  };

  React.useEffect(() => {
    loadTasks();
  }, []);

  return (
    <View>
      <Text>待完成任务: {tasks.length}</Text>
      
      {tasks.map(task => (
        <View key={task.taskId}>
          <Text>{task.type}</Text>
          <Text>进度: {task.progress}%</Text>
          <Text>时间: {new Date(task.timestamp).toLocaleString()}</Text>
        </View>
      ))}
      
      <TouchableOpacity onPress={loadTasks}>
        <Text>刷新</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => longRequestHandler.checkAllPendingTasks()}
      >
        <Text>检查所有任务</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => longRequestHandler.clearAllTasks()}
      >
        <Text>清除所有任务</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 4: 初始化（在 _layout.tsx 中）
// ============================================
export function AppInitializationExample() {
  React.useEffect(() => {
    // 初始化长请求处理器
    longRequestHandler.initialize();
    
    return () => {
      longRequestHandler.cleanup();
    };
  }, []);

  return <View>{/* App 内容 */}</View>;
}

// ============================================
// 示例 5: 用户提示待完成任务
// ============================================
export function PendingTaskNotification() {
  const [taskCount, setTaskCount] = useState(0);
  const { showToast } = useGlobalToast();

  useFocusEffect(
    useCallback(() => {
      const checkAndNotify = async () => {
        const count = await longRequestHandler.getPendingTaskCount();
        setTaskCount(count);
        
        if (count > 0) {
          showToast({
            message: `You have ${count} task(s) in progress`,
            type: "info",
            action: {
              label: "Check",
              onPress: async () => {
                await longRequestHandler.checkAllPendingTasks();
              }
            }
          });
        }
      };
      
      checkAndNotify();
    }, [])
  );

  return (
    <View>
      {taskCount > 0 && (
        <View>
          <Text>⏳ {taskCount} task(s) pending</Text>
        </View>
      )}
    </View>
  );
}

// ============================================
// 完整流程示例
// ============================================
export function CompleteFlowExample() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'polling' | 'background' | 'completed'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const { showToast } = useGlobalToast();

  const handleGenerate = async () => {
    try {
      // 阶段 1: 提交
      setStatus('submitting');
      showToast({ message: "Submitting...", type: "info" });
      
      const taskId = await longRequestHandler.submitTask(
        'foryou',
        { /* params */ },
        '/api/tasks/submit'
      );
      
      // 阶段 2: 轮询
      setStatus('polling');
      showToast({ message: "Generating...", type: "info" });
      
      await longRequestHandler.pollTaskStatus(
        taskId,
        `/api/tasks/${taskId}/status`,
        // Progress
        (prog) => {
          setProgress(prog);
          if (prog === 50) {
            showToast({ message: "Halfway there...", type: "info" });
          }
        },
        // Complete
        (res) => {
          setStatus('completed');
          setResult(res);
          showToast({ message: "Completed!", type: "success" });
        },
        // Error
        (error) => {
          setStatus('idle');
          showToast({ message: error, type: "error" });
        }
      );
      
    } catch (error) {
      setStatus('idle');
      showToast({ message: "Failed", type: "error" });
    }
  };

  // 监听 App 状态
  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' && status === 'polling') {
        setStatus('background');
        showToast({ 
          message: "Processing in background...", 
          type: "info" 
        });
      }
    });

    return () => subscription.remove();
  }, [status]);

  return (
    <View>
      {/* 状态显示 */}
      <Text>状态: {status}</Text>
      <Text>进度: {progress}%</Text>
      
      {/* 操作按钮 */}
      <TouchableOpacity 
        onPress={handleGenerate}
        disabled={status !== 'idle' && status !== 'completed'}
      >
        <Text>生成图片</Text>
      </TouchableOpacity>
      
      {/* 进度显示 */}
      {status === 'polling' && (
        <View>
          <ActivityIndicator />
          <Text>生成中... {progress}%</Text>
          <Text>您可以切换到其他App，完成后会通知您</Text>
        </View>
      )}
      
      {/* 后台处理提示 */}
      {status === 'background' && (
        <View>
          <Text>任务正在后台处理...</Text>
          <Text>完成后会通知您</Text>
        </View>
      )}
      
      {/* 结果显示 */}
      {status === 'completed' && result && (
        <View>
          <Text>生成完成！</Text>
          {/* 显示结果 */}
        </View>
      )}
    </View>
  );
}

