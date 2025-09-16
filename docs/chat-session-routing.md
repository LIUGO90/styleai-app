# 聊天会话路由参数管理

## 概述

聊天会话管理功能现在支持通过路由参数来指定要加载的会话。这使得会话切换更加灵活，用户可以直接通过URL访问特定的聊天会话。

## 路由参数结构

### 基本格式
```
/ChatScreen/[page]?sessionId=[sessionId]
```

### 示例URL
```
/ChatScreen/style_an_item?sessionId=1703123456789
/ChatScreen/outfit_check?sessionId=1703123456790
/ChatScreen/generate_ootd?sessionId=1703123456791
```

## 实现方式

### 1. 路由参数获取

在每个聊天页面中，使用 `useLocalSearchParams` 来获取路由参数：

```typescript
import { useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  
  // 使用 sessionId 加载指定会话
  useEffect(() => {
    loadCurrentSession();
  }, [sessionId]);
}
```

### 2. 会话加载逻辑

```typescript
const loadCurrentSession = async () => {
  try {
    let session: ChatSession | null = null;
    
    if (sessionId) {
      // 如果路由参数中有sessionId，加载指定会话
      session = await ChatSessionService.getSession(sessionId);
      if (session) {
        await ChatSessionService.setCurrentSession(session.id);
      }
    }
    
    if (!session) {
      // 如果没有指定会话或会话不存在，获取当前会话
      session = await ChatSessionService.getCurrentSession();
    }
    
    if (!session) {
      // 如果仍然没有会话，创建一个新的
      session = await ChatSessionService.createSession(sessionType);
    }
    
    setCurrentSession(session);
    
    // 如果会话中有消息，加载会话消息
    if (session.messages && session.messages.length > 0) {
      setMessages(session.messages);
    }
  } catch (error) {
    console.error('加载会话失败:', error);
  }
};
```

### 3. 导航时传递参数

在抽屉布局中，点击会话时传递sessionId参数：

```typescript
const handleSessionSelect = async (session: ChatSession) => {
  await ChatSessionService.setCurrentSession(session.id);
  setCurrentSessionId(session.id);
  
  // 根据会话类型跳转到对应页面，并传递sessionId参数
  switch (session.type) {
    case 'style_an_item':
      router.push({
        pathname: '/ChatScreen/style_an_item',
        params: { sessionId: session.id }
      });
      break;
    case 'outfit_check':
      router.push({
        pathname: '/ChatScreen/outfit_check',
        params: { sessionId: session.id }
      });
      break;
    case 'generate_ootd':
      router.push({
        pathname: '/ChatScreen/generate_ootd',
        params: { sessionId: session.id }
      });
      break;
  }
};
```

## 功能特性

### 1. 直接访问特定会话
- 用户可以通过URL直接访问特定的聊天会话
- 支持书签和分享功能
- 便于调试和测试

### 2. 会话状态保持
- 路由参数变化时自动重新加载会话
- 保持会话的完整状态
- 支持会话切换时的数据同步

### 3. 降级处理
- 如果指定的sessionId不存在，自动创建新会话
- 如果没有sessionId参数，使用当前会话
- 确保应用的稳定性

### 4. 类型安全
- 使用TypeScript类型定义确保参数类型安全
- 支持可选参数处理
- 提供良好的开发体验

## 使用场景

### 1. 会话切换
```typescript
// 从会话列表切换到特定会话
router.push({
  pathname: '/ChatScreen/style_an_item',
  params: { sessionId: '1703123456789' }
});
```

### 2. 新建会话
```typescript
// 创建新会话并跳转
const newSession = await ChatSessionService.createSession('style_an_item');
router.push({
  pathname: '/ChatScreen/style_an_item',
  params: { sessionId: newSession.id }
});
```

### 3. 外部链接
```typescript
// 处理外部链接跳转到特定会话
const handleDeepLink = (url: string) => {
  const sessionId = extractSessionIdFromUrl(url);
  if (sessionId) {
    router.push({
      pathname: '/ChatScreen/style_an_item',
      params: { sessionId }
    });
  }
};
```

### 4. 分享功能
```typescript
// 生成可分享的会话链接
const generateShareLink = (session: ChatSession) => {
  return `myapp://ChatScreen/${session.type}?sessionId=${session.id}`;
};
```

## 最佳实践

### 1. 参数验证
```typescript
const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();

// 验证sessionId格式
const isValidSessionId = (id: string) => {
  return /^\d+$/.test(id) && id.length > 0;
};

if (sessionId && !isValidSessionId(sessionId)) {
  console.warn('Invalid sessionId format:', sessionId);
  // 处理无效参数
}
```

### 2. 错误处理
```typescript
const loadCurrentSession = async () => {
  try {
    // 加载会话逻辑
  } catch (error) {
    console.error('加载会话失败:', error);
    // 显示错误提示
    Alert.alert('错误', '加载会话失败，请重试');
  }
};
```

### 3. 性能优化
```typescript
// 使用 useMemo 缓存会话数据
const currentSession = useMemo(() => {
  return sessions.find(s => s.id === sessionId);
}, [sessions, sessionId]);

// 使用 useCallback 优化函数
const handleSessionSelect = useCallback(async (session: ChatSession) => {
  // 会话选择逻辑
}, [router]);
```

### 4. 用户体验
```typescript
// 显示加载状态
const [isLoading, setIsLoading] = useState(false);

const loadCurrentSession = async () => {
  setIsLoading(true);
  try {
    // 加载会话逻辑
  } finally {
    setIsLoading(false);
  }
};

// 在UI中显示加载状态
if (isLoading) {
  return <LoadingSpinner />;
}
```

## 注意事项

1. **参数类型**: sessionId 应该是字符串类型，确保类型安全
2. **参数验证**: 验证sessionId的有效性，避免无效参数导致错误
3. **错误处理**: 提供友好的错误提示和降级处理
4. **性能考虑**: 避免频繁的路由参数变化导致不必要的重新渲染
5. **用户体验**: 提供加载状态和过渡动画，提升用户体验

## 扩展功能

### 1. 多参数支持
```typescript
// 支持更多路由参数
const { sessionId, messageId, tab } = useLocalSearchParams<{
  sessionId?: string;
  messageId?: string;
  tab?: string;
}>();
```

### 2. 参数加密
```typescript
// 对敏感参数进行加密
const encryptSessionId = (id: string) => {
  return btoa(id); // 简单的base64编码
};

const decryptSessionId = (encrypted: string) => {
  return atob(encrypted);
};
```

### 3. 参数持久化
```typescript
// 将当前参数保存到本地存储
const saveCurrentParams = async (params: any) => {
  await AsyncStorage.setItem('currentRouteParams', JSON.stringify(params));
};

const loadSavedParams = async () => {
  const saved = await AsyncStorage.getItem('currentRouteParams');
  return saved ? JSON.parse(saved) : null;
};
```

通过路由参数管理聊天会话，我们实现了更加灵活和强大的会话管理功能，为用户提供了更好的使用体验。
