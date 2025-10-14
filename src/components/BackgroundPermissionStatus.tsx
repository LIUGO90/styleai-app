import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { checkBackgroundPermissions } from '@/utils/permissions';
import { BackgroundTaskService } from '@/services/BackgroundTaskService';

export const BackgroundPermissionStatus: React.FC = () => {
  const [permissionStatus, setPermissionStatus] = useState({
    available: false,
    status: '检查中...',
    needsPermission: false
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const status = await checkBackgroundPermissions();
    setPermissionStatus(status);
  };

  const handleRequestPermission = async () => {
    if (permissionStatus.needsPermission) {
      Alert.alert(
        '开启后台权限',
        '请在设置中开启"后台应用刷新"权限以使用后台任务功能',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '去设置', 
            onPress: () => {

            }
          }
        ]
      );
    }
  };

  const startBackgroundTasks = async () => {
    try {
      await BackgroundTaskService.startAllTasks();
      Alert.alert('成功', '后台任务已启动');
      checkStatus();
    } catch (error) {
      console.error('启动后台任务失败:', error);
      Alert.alert('错误', '启动后台任务失败');
    }
  };

  const stopBackgroundTasks = async () => {
    try {
      await BackgroundTaskService.stopAllTasks();
      Alert.alert('成功', '后台任务已停止');
      checkStatus();
    } catch (error) {
      console.error('停止后台任务失败:', error);
      Alert.alert('错误', '停止后台任务失败');
    }
  };

  return (
    <View style={{ padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, margin: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
        后台任务状态
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
        状态: {permissionStatus.status}
      </Text>

      <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
        可用性: {permissionStatus.available ? '✅ 可用' : '❌ 不可用'}
      </Text>

      {permissionStatus.needsPermission && (
        <TouchableOpacity
          onPress={handleRequestPermission}
          style={{
            backgroundColor: '#007AFF',
            padding: 8,
            borderRadius: 4,
            alignItems: 'center',
            marginBottom: 8
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            开启后台权限
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={startBackgroundTasks}
        style={{
          backgroundColor: '#34C759',
          padding: 8,
          borderRadius: 4,
          alignItems: 'center',
          marginBottom: 8
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          启动后台任务
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={stopBackgroundTasks}
        style={{
          backgroundColor: '#FF3B30',
          padding: 8,
          borderRadius: 4,
          alignItems: 'center',
          marginBottom: 8
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          停止后台任务
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={checkStatus}
        style={{
          backgroundColor: '#FF9500',
          padding: 8,
          borderRadius: 4,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          刷新状态
        </Text>
      </TouchableOpacity>
    </View>
  );
};
