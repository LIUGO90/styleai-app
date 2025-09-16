# 图片加载优化指南

## 概述

本项目使用 `expo-image` 和自定义缓存管理器来优化图片加载速度，提供更好的用户体验。

## 主要优化特性

### 1. 使用 expo-image 替代 React Native Image
- **更好的缓存机制**: 自动内存和磁盘缓存
- **更快的加载速度**: 优化的图片解码和渲染
- **更流畅的过渡**: 支持淡入淡出动画
- **更好的错误处理**: 内置占位符和错误状态

### 2. 图片预加载
- **智能预加载**: 在组件挂载时预加载所有需要的图片
- **避免重复加载**: 缓存管理器跟踪已预加载的图片
- **内存管理**: 自动清理不需要的缓存

### 3. 缓存策略
- **memory-disk**: 同时使用内存和磁盘缓存（推荐）
- **memory**: 仅使用内存缓存（快速但易丢失）
- **disk**: 仅使用磁盘缓存（持久但较慢）

## 使用方法

### 基本用法

```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: 'https://example.com/image.jpg' }}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  placeholder="https://via.placeholder.com/200x200?text=Loading..."
/>
```

### 预加载图片

#### 本地图片（require）
本地图片不需要手动预加载，`expo-image` 会自动处理缓存：

```tsx
// 本地图片会自动缓存，无需预加载
<Image
  source={require('./assets/image1.png')}
  style={{ width: 200, height: 200 }}
  contentFit="cover"
  cachePolicy="memory-disk"
/>
```

#### 远程图片（URL）
远程图片可以手动预加载以提升性能：

```tsx
import { preloadImages } from '@/utils/imageCache';

useEffect(() => {
  const remoteImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
  ];
  
  preloadImages(remoteImages);
}, []);
```

### 使用优化后的消息组件

```tsx
import OptimizedRenderMessage from '@/components/OptimizedRenderMessage';

<OptimizedRenderMessage 
  item={message} 
  onButtonPress={handleButtonPress}
/>
```

## 性能监控

在开发模式下，会显示图片缓存状态监控器，显示：
- 已预加载的图片数量
- 缓存状态

## 最佳实践

### 1. 图片尺寸优化
- 使用适当的图片尺寸，避免加载过大的图片
- 考虑使用不同分辨率的图片（@2x, @3x）

### 2. 缓存策略选择
- **频繁访问的图片**: 使用 `memory-disk`
- **临时图片**: 使用 `memory`
- **重要图片**: 使用 `disk`

### 3. 预加载时机
- 在用户可能访问的页面预加载图片
- 避免一次性预加载过多图片
- 考虑网络状况和用户设备性能

### 4. 错误处理
- 提供合适的占位符图片
- 处理加载失败的情况
- 提供重试机制

## 性能对比

| 特性 | React Native Image | expo-image (优化后) |
|------|-------------------|-------------------|
| 首次加载 | 慢 | 快 |
| 缓存效果 | 有限 | 优秀 |
| 内存使用 | 高 | 低 |
| 过渡动画 | 无 | 流畅 |
| 错误处理 | 基础 | 完善 |

## 故障排除

### 图片不显示
1. 检查图片路径是否正确
2. 确认网络连接
3. 查看控制台错误信息

### 预加载失败
1. **本地图片**: 不需要预加载，`expo-image` 会自动处理
2. **远程图片**: 确保 URL 格式正确（http:// 或 https://）
3. **网络问题**: 检查网络连接和图片服务器状态

### 缓存不生效
1. 确认使用了正确的缓存策略
2. 检查是否调用了预加载函数（仅远程图片）
3. 验证图片源是否一致

### 内存占用过高
1. 定期清理缓存
2. 使用适当的图片尺寸
3. 避免同时加载过多图片

### 常见错误

#### "Calling the 'prefetch' function has failed"
- **原因**: 尝试预加载本地 `require()` 图片
- **解决**: 本地图片不需要预加载，移除预加载代码

#### 图片加载缓慢
- **原因**: 网络问题或图片过大
- **解决**: 
  - 使用适当的图片尺寸
  - 预加载远程图片
  - 使用占位符图片

## 相关文件

- `src/components/OptimizedRenderMessage.tsx`: 优化的消息渲染组件
- `src/utils/imageCache.ts`: 图片缓存管理器
- `src/components/ImagePerformanceMonitor.tsx`: 性能监控组件
