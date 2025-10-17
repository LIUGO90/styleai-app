/**
 * Template Generation Store 使用示例
 * 
 * 这个文件展示了如何在不同场景下使用 templateGenerationStore
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTemplateGenerationStore } from '@/stores/templateGenerationStore';

// 示例 1: 基本使用
export function BasicExample() {
  const { setGenerating, isGenerating: isTemplateGenerating } = useTemplateGenerationStore();
  const templateId = 'template-123';

  const handleGenerate = async () => {
    // 检查是否已经在生成
    if (isTemplateGenerating(templateId)) {
      console.log('Already generating...');
      return;
    }

    try {
      // 开始生成
      setGenerating(templateId, true);
      
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('Generation complete!');
    } finally {
      // 完成后清除状态
      setGenerating(templateId, false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleGenerate}
      disabled={isTemplateGenerating(templateId)}
    >
      <View>
        {isTemplateGenerating(templateId) ? (
          <>
            <ActivityIndicator />
            <Text>Generating...</Text>
          </>
        ) : (
          <Text>Generate</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// 示例 2: 多个 Template
export function MultipleTemplatesExample() {
  const { setGenerating, isGenerating: isTemplateGenerating } = useTemplateGenerationStore();
  
  const templates = [
    { id: 'template-1', name: 'Look 1' },
    { id: 'template-2', name: 'Look 2' },
    { id: 'template-3', name: 'Look 3' },
  ];

  const handleGenerate = async (templateId: string) => {
    if (isTemplateGenerating(templateId)) {
      return;
    }

    try {
      setGenerating(templateId, true);
      // API 调用...
      await new Promise(resolve => setTimeout(resolve, 2000));
    } finally {
      setGenerating(templateId, false);
    }
  };

  return (
    <View>
      {templates.map(template => (
        <TouchableOpacity
          key={template.id}
          onPress={() => handleGenerate(template.id)}
          disabled={isTemplateGenerating(template.id)}
        >
          <View>
            <Text>{template.name}</Text>
            {isTemplateGenerating(template.id) && <ActivityIndicator />}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// 示例 3: 使用清理功能
export function CleanupExample() {
  const { clearAll, clear } = useTemplateGenerationStore();

  // 清除所有状态（例如在组件卸载时）
  React.useEffect(() => {
    return () => {
      clearAll();
    };
  }, []);

  // 清除特定 template 的状态
  const handleClear = (templateId: string) => {
    clear(templateId);
  };

  return (
    <View>
      <TouchableOpacity onPress={clearAll}>
        <Text>Clear All</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => handleClear('template-123')}>
        <Text>Clear Template 123</Text>
      </TouchableOpacity>
    </View>
  );
}

// 示例 4: 与 useFocusEffect 配合使用
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function FocusEffectExample() {
  const { clearAll } = useTemplateGenerationStore();

  // 每次页面获得焦点时清除状态
  useFocusEffect(
    useCallback(() => {
      clearAll();
      
      return () => {
        // 页面失去焦点时也可以清除
        clearAll();
      };
    }, [])
  );

  return <View><Text>Screen Content</Text></View>;
}

// 示例 5: 防止重复点击
export function PreventDuplicateExample() {
  const { setGenerating, isGenerating: isTemplateGenerating } = useTemplateGenerationStore();
  const templateId = 'template-456';

  const handleGenerate = async () => {
    // 防止重复点击
    if (isTemplateGenerating(templateId)) {
      console.log('请等待当前生成完成');
      return;
    }

    try {
      setGenerating(templateId, true);
      
      // 执行耗时操作
      await performHeavyOperation();
      
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      // 无论成功或失败，都要清除状态
      setGenerating(templateId, false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleGenerate}
      disabled={isTemplateGenerating(templateId)}
      style={{ opacity: isTemplateGenerating(templateId) ? 0.6 : 1 }}
    >
      <Text>
        {isTemplateGenerating(templateId) ? 'Processing...' : 'Generate Look'}
      </Text>
    </TouchableOpacity>
  );
}

async function performHeavyOperation() {
  // 模拟重型操作
  return new Promise(resolve => setTimeout(resolve, 3000));
}

