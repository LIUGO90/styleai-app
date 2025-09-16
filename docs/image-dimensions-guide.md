# 图片尺寸获取指南

## 概述

本指南介绍如何在React Native Expo项目中获取图片的真实宽高。我们提供了多种方法来获取图片尺寸，包括本地图片和远程图片。

## 功能特性

- ✅ 支持本地图片 (require() 导入的图片)
- ✅ 支持远程图片 (URL)
- ✅ 支持批量获取图片尺寸
- ✅ 提供React Hook方便使用
- ✅ 自动计算宽高比
- ✅ 提供尺寸计算工具函数
- ✅ 完整的TypeScript支持

## 文件结构

```
src/
├── utils/
│   └── imageDimensions.ts          # 核心工具函数
├── hooks/
│   └── useImageDimensions.ts       # React Hook
├── config/
│   └── imagePaths.ts              # 图片路径配置 (已更新)
└── examples/
    ├── ImageDimensionsExample.tsx  # 完整示例
    └── SimpleImageDimensionsExample.tsx # 简单示例
```

## 使用方法

### 1. 基本用法 - 使用Hook

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useImageDimensions } from '../hooks/useImageDimensions';
import { IMAGE_PATHS } from '../config/imagePaths';

export const MyComponent = () => {
  const { dimensions, loading, error } = useImageDimensions(
    IMAGE_PATHS.TEST_IMAGES.TEST01
  );

  if (loading) return <Text>加载中...</Text>;
  if (error) return <Text>错误: {error}</Text>;
  if (!dimensions) return <Text>无图片尺寸信息</Text>;

  return (
    <View>
      <Text>宽度: {dimensions.width}px</Text>
      <Text>高度: {dimensions.height}px</Text>
      <Text>宽高比: {dimensions.aspectRatio.toFixed(2)}</Text>
    </View>
  );
};
```

### 2. 手动获取图片尺寸

```tsx
import { getImageDimensions } from '../utils/imageDimensions';

const handleGetDimensions = async () => {
  try {
    const dimensions = await getImageDimensions(IMAGE_PATHS.TEST_IMAGES.TEST01);
    console.log('图片尺寸:', dimensions);
    // 输出: { width: 800, height: 600, aspectRatio: 1.33 }
  } catch (error) {
    console.error('获取图片尺寸失败:', error);
  }
};
```

### 3. 批量获取图片尺寸

```tsx
import { useMultipleImageDimensions } from '../hooks/useImageDimensions';

export const BatchExample = () => {
  const testImages = Object.values(IMAGE_PATHS.TEST_IMAGES);
  const { dimensions, loading, error } = useMultipleImageDimensions(testImages);

  if (loading) return <Text>批量加载中...</Text>;
  if (error) return <Text>错误: {error}</Text>;

  return (
    <View>
      {dimensions.map((dim, index) => (
        <Text key={index}>
          图片{index + 1}: {dim.width}x{dim.height}
        </Text>
      ))}
    </View>
  );
};
```

### 4. 从配置获取图片尺寸

```tsx
import { getTestImageDimensions } from '../config/imagePaths';

// 直接从配置获取图片尺寸 (适用于本地图片)
const dimensions = getTestImageDimensions('TEST01');
console.log('配置中的尺寸:', dimensions);
```

### 5. 尺寸计算工具

```tsx
import { calculateFitDimensions } from '../utils/imageDimensions';

const originalDimensions = { width: 800, height: 600, aspectRatio: 1.33 };
const fitDimensions = calculateFitDimensions(originalDimensions, 200, 150);

console.log('适合屏幕的尺寸:', fitDimensions);
// 输出: { width: 200, height: 150, aspectRatio: 1.33 }
```

## API 参考

### 工具函数

#### `getImageDimensions(imageSource)`
获取单张图片的尺寸信息。

**参数:**
- `imageSource`: 图片源 (require() 返回值、URI字符串或图片对象)

**返回:** `Promise<ImageDimensions>`

**示例:**
```tsx
const dimensions = await getImageDimensions(require('./image.png'));
```

#### `getMultipleImageDimensions(imageSources)`
批量获取多张图片的尺寸信息。

**参数:**
- `imageSources`: 图片源数组

**返回:** `Promise<ImageDimensions[]>`

#### `calculateFitDimensions(originalDimensions, maxWidth?, maxHeight?)`
计算适合指定容器的图片尺寸。

**参数:**
- `originalDimensions`: 原始图片尺寸
- `maxWidth`: 最大宽度 (可选，默认屏幕宽度的80%)
- `maxHeight`: 最大高度 (可选，默认300)

**返回:** `ImageDimensions`

### React Hooks

#### `useImageDimensions(imageSource, autoLoad?)`
获取单张图片尺寸的Hook。

**参数:**
- `imageSource`: 图片源
- `autoLoad`: 是否自动加载 (默认true)

**返回:** `{ dimensions, loading, error }`

#### `useMultipleImageDimensions(imageSources, autoLoad?)`
批量获取图片尺寸的Hook。

**参数:**
- `imageSources`: 图片源数组
- `autoLoad`: 是否自动加载 (默认true)

**返回:** `{ dimensions, loading, error, reload }`

### 类型定义

```tsx
interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

interface ImageDimensionsResult {
  dimensions: ImageDimensions | null;
  loading: boolean;
  error: string | null;
}
```

## 支持的图片类型

### 本地图片
```tsx
// require() 导入的图片
const localImage = require('./assets/image.png');
const dimensions = await getImageDimensions(localImage);
```

### 远程图片
```tsx
// URL字符串
const remoteImage = 'https://example.com/image.jpg';
const dimensions = await getImageDimensions(remoteImage);

// 图片对象
const imageObject = { uri: 'https://example.com/image.jpg' };
const dimensions = await getImageDimensions(imageObject);
```

### 配置中的图片
```tsx
// 从imagePaths.ts配置获取
const testImage = IMAGE_PATHS.TEST_IMAGES.TEST01;
const dimensions = await getImageDimensions(testImage);
```

## 最佳实践

### 1. 错误处理
```tsx
try {
  const dimensions = await getImageDimensions(imageSource);
  // 使用尺寸信息
} catch (error) {
  console.error('获取图片尺寸失败:', error);
  // 处理错误情况
}
```

### 2. 性能优化
```tsx
// 使用Hook自动管理状态
const { dimensions, loading, error } = useImageDimensions(imageSource);

// 避免重复获取
const memoizedDimensions = useMemo(() => {
  return dimensions;
}, [dimensions]);
```

### 3. 批量处理
```tsx
// 批量获取时使用Promise.all
const imageSources = [image1, image2, image3];
const allDimensions = await getMultipleImageDimensions(imageSources);
```

## 常见问题

### Q: 为什么本地图片获取尺寸失败？
A: 确保使用`require()`正确导入图片，并且图片文件存在。

### Q: 远程图片获取尺寸很慢？
A: 远程图片需要网络请求，建议使用预加载或缓存机制。

### Q: 如何获取动态图片的尺寸？
A: 使用Hook的`reload`方法或重新调用`getImageDimensions`函数。

### Q: 支持哪些图片格式？
A: 支持所有React Native支持的图片格式，包括PNG、JPG、GIF、WebP等。

## 示例项目

查看 `src/examples/` 目录中的完整示例：
- `SimpleImageDimensionsExample.tsx` - 基本用法示例
- `ImageDimensionsExample.tsx` - 完整功能示例

## 更新日志

- **v1.0.0** - 初始版本，支持基本的图片尺寸获取功能
- 支持本地和远程图片
- 提供React Hook
- 完整的TypeScript支持
