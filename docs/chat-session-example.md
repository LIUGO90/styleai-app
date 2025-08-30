# 聊天会话管理功能使用示例

## 快速开始

### 1. 基本使用流程

1. **打开聊天页面**
   - 进入 `/ChatScreen/style_an_item` 页面
   - 系统会自动创建或加载当前会话
   - 支持通过URL参数指定会话：`/ChatScreen/style_an_item?sessionId=1703123456789`

2. **查看会话列表**
   - 点击右上角的抽屉按钮
   - 在抽屉中可以看到所有聊天会话
   - 当前会话会高亮显示

3. **切换会话**
   - 点击抽屉中的任意会话
   - 系统会自动跳转到对应的聊天页面
   - 加载该会话的所有历史消息
   - URL会自动更新为：`/ChatScreen/[page]?sessionId=[sessionId]`

4. **创建新会话**
   - 点击抽屉中的 "+" 按钮
   - 系统会创建一个新的搭配单品会话
   - 自动跳转到新会话页面
   - URL会更新为新会话的ID

5. **删除会话**
   - 长按抽屉中的会话项
   - 确认删除对话框
   - 会话及其所有消息将被删除

### 2. 代码示例

#### 创建新会话

```typescript
import { ChatSessionService } from '@/services/ChatSessionService';

// 创建搭配单品会话
const styleSession = await ChatSessionService.createSession('style_an_item', '我的搭配咨询');

// 创建搭配检查会话
const checkSession = await ChatSessionService.createSession('outfit_check', '搭配效果检查');

// 创建生成穿搭会话
const generateSession = await ChatSessionService.createSession('generate_ootd', 'AI穿搭生成');
```

#### 发送消息并自动保存

```typescript
const handleSendMessage = (text: string) => {
  const newMessage: Message = {
    id: Date.now().toString(),
    text,
    sender: 'user',
    senderName: '用户',
    timestamp: new Date(),
  };
  
  // 添加到消息列表
  setMessages(prev => [...prev, newMessage]);
  
  // 消息会自动保存到当前会话（通过 useEffect）
};
```

#### 切换会话（支持路由参数）

```typescript
const handleSessionSelect = async (session: ChatSession) => {
  // 设置当前会话
  await ChatSessionService.setCurrentSession(session.id);
  
  // 根据会话类型跳转，并传递sessionId参数
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

#### 从路由参数加载会话

```typescript
import { useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  
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
}
```

### 3. 页面结构

```
ChatScreen/
├── _layout.tsx              # 抽屉布局，包含会话列表
├── style_an_item.tsx        # 搭配单品页面（支持路由参数）
├── outfit_check.tsx         # 搭配检查页面（支持路由参数）
└── generate_ootd.tsx        # 生成穿搭页面（支持路由参数）
```

### 4. 数据存储结构

```typescript
// 会话数据结构
{
  id: "1703123456789",
  title: "搭配单品",
  lastMessage: "请上传您的单品照片",
  lastMessageTime: "2023-12-21T10:30:00.000Z",
  messageCount: 5,
  type: "style_an_item",
  messages: [
    {
      id: "1",
      text: "Style an Item",
      sender: "user",
      timestamp: "2023-12-21T10:25:00.000Z"
    },
    // ... 更多消息
  ],
  createdAt: "2023-12-21T10:25:00.000Z",
  updatedAt: "2023-12-21T10:30:00.000Z"
}
```

### 5. 功能特性演示

#### 自动保存
- 发送消息后立即保存到本地存储
- 应用重启后自动恢复会话状态
- 支持离线使用

#### 会话切换
- 点击会话列表中的任意会话
- 自动跳转到对应的功能页面
- 保持完整的消息历史
- URL自动更新为对应会话

#### 会话管理
- 支持创建、删除、清空会话
- 显示最后消息和时间
- 当前会话高亮显示

#### 路由参数支持
- 支持通过URL直接访问特定会话
- 支持书签和分享功能
- 便于调试和测试

#### 错误处理
- 网络异常时的友好提示
- 数据加载失败时的降级处理
- 操作确认对话框

### 6. 扩展功能示例

#### 添加新的会话类型

```typescript
// 1. 更新类型定义
type ChatSessionType = 'style_an_item' | 'outfit_check' | 'generate_ootd' | 'general' | 'new_type';

// 2. 添加路由
<Drawer.Screen 
  name="new_type" 
  options={{ 
    drawerLabel: '新功能',
    drawerIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="star" size={size} color={color} />
    ),
  }} 
/>

// 3. 创建页面组件
export default function NewTypeScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  
  return (
    <ChatPage
      sessionType="new_type"
      defaultTitle="新功能"
      defaultSubtitle="新功能描述"
      initialMessages={[
        // 初始消息
      ]}
    />
  );
}
```

#### 自定义会话列表样式

```typescript
// 在 ChatSessionList.tsx 中修改样式
const styles = StyleSheet.create({
  sessionItem: {
    // 自定义样式
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 16,
  },
  // ... 更多样式
});
```

#### 分享会话链接

```typescript
// 生成可分享的会话链接
const generateShareLink = (session: ChatSession) => {
  return `myapp://ChatScreen/${session.type}?sessionId=${session.id}`;
};

// 处理分享
const handleShare = async (session: ChatSession) => {
  const shareLink = generateShareLink(session);
  await Share.share({
    message: `查看我的聊天记录: ${shareLink}`,
    url: shareLink,
  });
};
```

### 7. 最佳实践

1. **会话命名**: 使用有意义的会话标题，便于用户识别
2. **消息管理**: 定期清理旧消息，避免存储空间过大
3. **错误处理**: 始终提供用户友好的错误提示
4. **性能优化**: 大量消息时考虑分页加载
5. **用户体验**: 提供加载状态和操作反馈
6. **路由参数**: 验证参数有效性，提供降级处理

### 8. 常见问题

**Q: 如何清空所有会话？**
A: 点击抽屉右上角的垃圾桶图标，确认后清空所有会话。

**Q: 如何删除单个会话？**
A: 长按会话列表中的任意会话，选择删除。

**Q: 会话数据会同步到云端吗？**
A: 当前版本使用本地存储，不会同步到云端。

**Q: 如何添加新的会话类型？**
A: 参考扩展功能示例，更新类型定义、添加路由和页面组件。

**Q: 消息会自动保存吗？**
A: 是的，发送消息后会自动保存到当前会话。

**Q: 如何通过URL直接访问特定会话？**
A: 使用格式：`/ChatScreen/[page]?sessionId=[sessionId]`，例如：`/ChatScreen/style_an_item?sessionId=1703123456789`

**Q: 如果URL中的sessionId不存在怎么办？**
A: 系统会自动创建新会话或加载当前会话，确保应用正常运行。

**Q: 支持分享会话链接吗？**
A: 是的，可以生成包含sessionId的链接，其他用户点击后可以直接访问对应会话。
