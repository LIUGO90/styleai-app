# 聊天组件功能说明

## 概述

Chat 组件是一个功能完整的聊天界面，支持多种消息类型和交互功能。

## 主要功能

### 1. 消息发送
- **回车键发送**: 在输入框中按回车键即可发送消息
- **发送按钮**: 点击发送按钮发送消息
- **输入验证**: 空消息无法发送
- **键盘管理**: 发送后自动收起键盘

### 2. 消息类型支持
- **文本消息**: 普通文本内容
- **图片消息**: 支持单张或多张图片
- **卡片消息**: 包含标题、描述、图片和按钮的卡片
- **按钮消息**: 交互式按钮选项

### 3. 头像显示
- **用户头像**: 显示发送者头像
- **默认头像**: 支持用户、AI、系统三种默认头像
- **在线状态**: 显示用户在线状态

### 4. 键盘处理
- **自动调整**: 键盘弹出时自动调整布局
- **滚动到底部**: 新消息时自动滚动
- **键盘收起**: 发送消息后自动收起键盘

## 使用方法

### 基本用法

```tsx
import { Chat } from '@/components/Chat';
import { Message } from '@/components/types';

const [messages, setMessages] = useState<Message[]>([]);

const handleSendMessage = (text: string) => {
  const newMessage: Message = {
    id: Date.now().toString(),
    text,
    sender: 'user',
    timestamp: new Date(),
    showAvatars: true,
  };
  
  setMessages(prev => [...prev, newMessage]);
};

<Chat
  messages={messages}
  onSendMessage={handleSendMessage}
  placeholder="输入消息..."
/>
```

### 回车发送功能

Chat 组件通过监听输入文本中的回车符来实现回车键发送：

```tsx
const handleInputChange = (text: string) => {
  // 检查是否包含回车符
  if (text.includes('\n')) {
    // 移除回车符并发送消息
    const cleanText = text.replace(/\n/g, '').trim();
    if (cleanText && !disabled) {
      onSendMessage?.(cleanText);
      setInputText('');
      // ... 其他处理
      return;
    }
  }
  
  setInputText(text);
  // ... 其他逻辑
};
```

**工作原理**：
- 监听 `onChangeText` 事件
- 检测文本中是否包含 `\n`（回车符）
- 如果包含回车符，则发送消息并清空输入框
- 支持多行输入，但回车键会触发发送

### 键盘行为

- **iOS**: 回车键直接发送消息
- **Android**: 回车键发送消息，Shift+回车换行
- **多行输入**: 支持长文本输入
- **自动调整**: 键盘弹出时自动调整布局

## 配置选项

### ChatProps 接口

```tsx
interface ChatProps {
  messages?: Message[];           // 消息列表
  onSendMessage?: (text: string) => void;  // 发送消息回调
  onTyping?: (isTyping: boolean) => void;  // 输入状态回调
  onButtonPress?: (button: MessageButton, message: Message) => void;  // 按钮点击回调
  onImageUpload?: ImageUploadCallback;     // 图片上传回调
  placeholder?: string;           // 输入框占位符
  sendButtonText?: string;       // 发送按钮文本
  className?: string;            // 自定义样式类
  disabled?: boolean;            // 是否禁用
}
```

## 最佳实践

### 1. 消息处理
- 及时更新消息状态
- 处理发送失败的情况
- 添加消息发送状态指示

### 2. 性能优化
- 使用 `FlatList` 渲染大量消息
- 实现消息分页加载
- 优化图片加载和缓存

### 3. 用户体验
- 提供输入提示和占位符
- 支持消息撤回和编辑
- 添加消息搜索功能

### 4. 键盘处理
- 确保键盘弹出时布局正确
- 处理键盘高度变化
- 支持键盘快捷键

## 常见问题

### 回车键不发送
1. 检查 `onSubmitEditing` 是否正确设置
2. 确认 `returnKeyType="send"`
3. 验证 `handleSend` 函数是否正常工作

### 键盘遮挡输入框
1. 使用 `KeyboardAvoidingView`
2. 设置正确的 `keyboardVerticalOffset`
3. 确保布局响应键盘变化

### 消息不显示
1. 检查消息数据结构
2. 验证 `renderItem` 函数
3. 确认消息 ID 唯一性

## 测试

可以使用 `src/app/chat-test.tsx` 页面测试聊天功能：

```bash
# 访问测试页面
http://localhost:8081/chat-test
```

测试内容包括：
- 回车键发送功能
- 消息显示和滚动
- 键盘行为
- 头像显示
