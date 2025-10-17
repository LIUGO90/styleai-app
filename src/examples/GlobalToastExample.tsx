/**
 * 全局 Toast 使用示例
 * 
 * 展示如何在不同场景下使用全局 Toast
 */

import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useGlobalToast, globalToast } from '@/utils/globalToast';
import { useRouter } from 'expo-router';

// ============================================
// 示例 1: 基本使用（在组件中）
// ============================================
export function BasicToastExample() {
  const { showToast } = useGlobalToast();

  return (
    <View>
      {/* 简单消息 */}
      <TouchableOpacity onPress={() => showToast("Hello, World!")}>
        <Text>Show Simple Toast</Text>
      </TouchableOpacity>

      {/* 成功消息 */}
      <TouchableOpacity 
        onPress={() => showToast({ 
          message: "Operation successful!", 
          type: "success" 
        })}
      >
        <Text>Show Success Toast</Text>
      </TouchableOpacity>

      {/* 错误消息 */}
      <TouchableOpacity 
        onPress={() => showToast({ 
          message: "Something went wrong", 
          type: "error" 
        })}
      >
        <Text>Show Error Toast</Text>
      </TouchableOpacity>

      {/* 信息消息 */}
      <TouchableOpacity 
        onPress={() => showToast({ 
          message: "Loading data...", 
          type: "info" 
        })}
      >
        <Text>Show Info Toast</Text>
      </TouchableOpacity>

      {/* 警告消息 */}
      <TouchableOpacity 
        onPress={() => showToast({ 
          message: "Low storage space", 
          type: "warning" 
        })}
      >
        <Text>Show Warning Toast</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 2: 带操作按钮的 Toast
// ============================================
export function ToastWithActionExample() {
  const { showToast } = useGlobalToast();
  const router = useRouter();

  const handleSave = () => {
    // 模拟保存操作
    setTimeout(() => {
      showToast({
        message: "File saved successfully!",
        type: "success",
        action: {
          label: "View",
          onPress: () => {
            console.log("Navigate to file viewer");
            // router.push("/files");
          }
        }
      });
    }, 500);
  };

  const handleDelete = () => {
    showToast({
      message: "Item deleted",
      type: "success",
      action: {
        label: "Undo",
        onPress: () => {
          console.log("Restore item");
          showToast("Item restored");
        }
      }
    });
  };

  return (
    <View>
      <TouchableOpacity onPress={handleSave}>
        <Text>Save File (with View action)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleDelete}>
        <Text>Delete Item (with Undo action)</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 3: 在异步操作中使用
// ============================================
export function AsyncOperationExample() {
  const { showToast } = useGlobalToast();

  const uploadFile = async () => {
    try {
      // 显示加载状态
      showToast({ message: "Uploading file...", type: "info" });

      // 模拟上传
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 成功
      showToast({ 
        message: "Upload complete!", 
        type: "success" 
      });
    } catch (error) {
      // 失败
      showToast({ 
        message: "Upload failed", 
        type: "error" 
      });
    }
  };

  const syncData = async () => {
    try {
      showToast({ message: "Syncing...", type: "info" });
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast({ message: "Sync complete", type: "success" });
    } catch (error) {
      showToast({ message: "Sync failed", type: "error" });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={uploadFile}>
        <Text>Upload File</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={syncData}>
        <Text>Sync Data</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 4: 表单提交
// ============================================
export function FormSubmitExample() {
  const { showToast } = useGlobalToast();

  const handleSubmit = async (data: any) => {
    try {
      // 验证
      if (!data.name) {
        showToast({ 
          message: "Name is required", 
          type: "warning" 
        });
        return;
      }

      // 提交
      showToast({ message: "Submitting...", type: "info" });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 成功
      showToast({
        message: "Form submitted successfully!",
        type: "success",
        action: {
          label: "View",
          onPress: () => console.log("View submission")
        }
      });
    } catch (error) {
      showToast({ 
        message: "Submission failed", 
        type: "error" 
      });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={() => handleSubmit({ name: "" })}>
        <Text>Submit Empty Form (shows warning)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => handleSubmit({ name: "John" })}>
        <Text>Submit Valid Form</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 5: 在服务层使用（单例模式）
// ============================================

// 模拟服务
export class DataService {
  static async saveData(data: any) {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ✅ 在服务中使用 globalToast 单例
      globalToast.success("Data saved successfully!");
      
      return true;
    } catch (error) {
      globalToast.error("Failed to save data");
      return false;
    }
  }

  static async loadData() {
    try {
      globalToast.info("Loading data...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      globalToast.success("Data loaded");
      return { data: [] };
    } catch (error) {
      globalToast.error("Failed to load data");
      return null;
    }
  }

  static async deleteData(id: string) {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 带操作按钮
      globalToast.show({
        message: "Item deleted",
        type: "success",
        action: {
          label: "Undo",
          onPress: () => {
            // 恢复逻辑
            globalToast.info("Item restored");
          }
        }
      });
    } catch (error) {
      globalToast.error("Delete failed");
    }
  }
}

// 组件中调用服务
export function ServiceExample() {
  return (
    <View>
      <TouchableOpacity onPress={() => DataService.saveData({ name: "test" })}>
        <Text>Save Data (using service)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => DataService.loadData()}>
        <Text>Load Data (using service)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => DataService.deleteData("123")}>
        <Text>Delete Data (with undo)</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 6: 快捷方法
// ============================================
export function ShortcutMethodsExample() {
  return (
    <View>
      <TouchableOpacity onPress={() => globalToast.success("Success!")}>
        <Text>Success Toast</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => globalToast.error("Error!")}>
        <Text>Error Toast</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => globalToast.info("Info!")}>
        <Text>Info Toast</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => globalToast.warning("Warning!")}>
        <Text>Warning Toast</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => globalToast.success("Saved!", {
          label: "View",
          onPress: () => console.log("View")
        })}
      >
        <Text>Success with Action</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 7: 网络请求
// ============================================
export function NetworkRequestExample() {
  const { showToast } = useGlobalToast();

  const fetchData = async () => {
    try {
      showToast({ message: "Fetching data...", type: "info" });

      const response = await fetch("https://api.example.com/data");
      
      if (!response.ok) {
        throw new Error("Network error");
      }

      const data = await response.json();
      showToast({ message: "Data loaded", type: "success" });
      
      return data;
    } catch (error) {
      showToast({ 
        message: "Failed to fetch data", 
        type: "error" 
      });
      return null;
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={fetchData}>
        <Text>Fetch Data</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 8: 用户操作确认
// ============================================
export function UserActionExample() {
  const { showToast } = useGlobalToast();

  const likePost = () => {
    showToast({
      message: "Post liked!",
      type: "success",
      action: {
        label: "Unlike",
        onPress: () => {
          showToast("Post unliked");
        }
      }
    });
  };

  const followUser = () => {
    showToast({
      message: "Following user",
      type: "success",
      action: {
        label: "View Profile",
        onPress: () => {
          console.log("Navigate to profile");
        }
      }
    });
  };

  const bookmarkItem = () => {
    showToast({
      message: "Added to bookmarks",
      type: "success",
      action: {
        label: "View All",
        onPress: () => {
          console.log("Navigate to bookmarks");
        }
      }
    });
  };

  return (
    <View>
      <TouchableOpacity onPress={likePost}>
        <Text>Like Post</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={followUser}>
        <Text>Follow User</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={bookmarkItem}>
        <Text>Bookmark Item</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 9: 错误处理
// ============================================
export function ErrorHandlingExample() {
  const { showToast } = useGlobalToast();

  const riskyOperation = async () => {
    try {
      // 可能失败的操作
      const random = Math.random();
      if (random < 0.5) {
        throw new Error("Operation failed");
      }
      
      showToast({ message: "Operation succeeded", type: "success" });
    } catch (error) {
      // 统一的错误处理
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast({ message, type: "error" });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={riskyOperation}>
        <Text>Risky Operation (50% fail)</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// 示例 10: 组合使用示例（完整流程）
// ============================================
export function CompleteFlowExample() {
  const { showToast } = useGlobalToast();
  const router = useRouter();

  const createLookbook = async () => {
    try {
      // 1. 验证
      showToast({ message: "Validating...", type: "info" });
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. 上传图片
      showToast({ message: "Uploading images...", type: "info" });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. 生成
      showToast({ message: "Generating lookbook...", type: "info" });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. 保存
      showToast({ message: "Saving...", type: "info" });
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. 完成
      showToast({
        message: "Lookbook created successfully!",
        type: "success",
        action: {
          label: "View",
          onPress: () => {
            console.log("Navigate to lookbook");
            // router.push("/lookbook");
          }
        }
      });
    } catch (error) {
      showToast({
        message: "Failed to create lookbook",
        type: "error",
        action: {
          label: "Retry",
          onPress: createLookbook
        }
      });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={createLookbook}>
        <Text>Create Lookbook (complete flow)</Text>
      </TouchableOpacity>
    </View>
  );
}

