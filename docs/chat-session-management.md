# 聊天会话管理功能

## 功能概述

聊天会话管理功能允许用户创建、管理和切换不同的聊天会话，每个会话都有独立的聊天记录。用户可以通过抽屉菜单查看所有会话，并在不同会话之间切换。

## 主要功能

### 1. 会话管理
- **创建新会话**: 用户可以创建不同类型的聊天会话
- **会话列表**: 在抽屉中显示所有聊天会话
- **会话切换**: 点击会话可以切换到对应的聊天页面
- **会话删除**: 长按会话可以删除（带确认对话框）
- **清空所有会话**: 一键清空所有聊天记录

### 2. 会话类型
- **搭配单品** (`style_an_item`): 用于单品搭配建议
- **搭配检查** (`outfit_check`): 用于检查整体搭配效果
- **生成穿搭** (`generate_ootd`): 用于生成完整穿搭方案
- **通用聊天** (`general`): 用于一般对话

### 3. 数据持久化
- 使用 AsyncStorage 本地存储会话数据
- 自动保存聊天消息到对应会话
- 应用重启后自动恢复会话状态

## 文件结构

```
src/
├── services/
│   └── ChatSessionService.ts          # 会话管理服务
├── components/
│   ├── ChatSessionList.tsx            # 会话列表组件
│   └── ChatPage.tsx                   # 通用聊天页面组件
└── app/
    └── ChatScreen/
        ├── _layout.tsx                # 抽屉布局配置
        ├── style_an_item.tsx          # 搭配单品页面
        ├── outfit_check.tsx           # 搭配检查页面
        └── generate_ootd.tsx          # 生成穿搭页面
```

## 使用方法

### 1. 基本使用

```typescript
import { ChatSessionService } from '@/services/ChatSessionService';

// 创建新会话
const session = await ChatSessionService.createSession('style_an_item');

// 获取所有会话
const sessions = await ChatSessionService.getAllSessions();

// 获取当前会话
const currentSession = await ChatSessionService.getCurrentSession();

// 切换会话
await ChatSessionService.setCurrentSession(sessionId);
```

### 2. 在组件中使用

```typescript
import { ChatPage } from '@/components/ChatPage';

function MyChatScreen() {
  const initialMessages = [
    // 初始消息...
  ];

  return (
    <ChatPage
      sessionType="style_an_item"
      defaultTitle="搭配单品"
      defaultSubtitle="AI帮您搭配单品"
      initialMessages={initialMessages}
      onButtonPress={handleButtonPress}
    />
  );
}
```

### 3. 自定义会话列表

```typescript
import { ChatSessionList } from '@/components/ChatSessionList';

function MyDrawer() {
  return (
    <ChatSessionList
      sessions={sessions}
      currentSessionId={currentSessionId}
      onSessionSelect={handleSessionSelect}
      onNewSession={handleNewSession}
      onDeleteSession={handleDeleteSession}
    />
  );
}
```

## API 参考

### ChatSessionService

#### 方法

- `getAllSessions()`: 获取所有会话
- `createSession(type, title?)`: 创建新会话
- `getCurrentSession()`: 获取当前会话
- `setCurrentSession(sessionId)`: 设置当前会话
- `updateSessionMessages(sessionId, messages)`: 更新会话消息
- `addMessageToSession(sessionId, message)`: 添加消息到会话
- `deleteSession(sessionId)`: 删除会话
- `clearAllSessions()`: 清空所有会话
- `formatTime(date)`: 格式化时间显示

#### 数据类型

```typescript
interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  type: 'style_an_item' | 'outfit_check' | 'generate_ootd' | 'general';
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

## 功能特性

### 1. 自动保存
- 消息发送后自动保存到当前会话
- 应用重启后自动恢复会话状态
- 支持离线存储

### 2. 会话切换
- 点击抽屉中的会话可以切换到对应页面
- 根据会话类型自动跳转到正确的页面
- 保持会话状态和消息历史

### 3. 用户体验
- 当前会话高亮显示
- 显示最后消息和时间
- 支持长按删除会话
- 清空所有会话的确认对话框

### 4. 错误处理
- 网络错误时的友好提示
- 数据加载失败时的降级处理
- 会话操作失败时的错误恢复

## 扩展功能

### 1. 添加新的会话类型
1. 在 `ChatSessionService.ts` 中更新类型定义
2. 在 `_layout.tsx` 中添加新的路由
3. 创建对应的页面组件

### 2. 自定义会话列表样式
- 修改 `ChatSessionList.tsx` 中的样式
- 添加自定义的会话项组件
- 支持不同的布局模式

### 3. 添加搜索功能
- 在会话列表中添加搜索框
- 支持按标题或消息内容搜索
- 实时过滤搜索结果

### 4. 添加会话分组
- 按时间或类型分组会话
- 支持折叠/展开分组
- 显示分组统计信息

## 注意事项

1. **数据同步**: 当前版本使用本地存储，多设备间不会同步
2. **存储限制**: AsyncStorage 有存储大小限制，大量会话时需要注意
3. **性能优化**: 大量消息时考虑分页加载
4. **错误处理**: 网络异常时提供离线模式支持

## 未来改进

1. **云端同步**: 添加用户账户和云端数据同步
2. **消息搜索**: 在会话内搜索特定消息
3. **会话导出**: 支持导出聊天记录
4. **消息编辑**: 支持编辑和删除消息
5. **多媒体支持**: 支持语音、视频等多媒体消息
