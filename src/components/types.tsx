// 消息按钮类型定义
export interface MessageButton {
  id: string;
  text: string;
  type?: "primary" | "secondary" | "danger";
  action?: string;
  data?: any;
}

// 图片消息类型定义
export interface MessageImage {
  id: string;
  url: any; // 支持 require() 返回的数字和字符串 URI
  alt?: string;
  width?: number;
  height?: number;
  thumbnail?: string;
}

// 进度条类型定义
export interface MessageProgress {
  current: number;
  total: number;
  status: "pending" | "processing" | "completed" | "error";
  message?: string;
  percentage?: number;
}

// 卡片消息类型定义
export interface MessageCard {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  description: string;
  buttons?: MessageButton[];
  selectedButton?: string;
  isShell?: "circle" | "none";
  uploadImage?: boolean; // 是否显示图片上传功能
  commitButton?: MessageButton;
  isDeleted?: boolean;
}

// 图片上传回调类型
export interface ImageUploadCallback {
  onImageSelect?: (imageUri: string, messageId?: string) => void;
  onImageUpload?: (imageUri: string) => Promise<string>;
  onImageError?: (error: string) => void;
}

// 聊天组件属性
export interface ChatProps {
  currentSessionId: string;
  chatType: "free_chat" | "style_an_item" | "outfit_check",
  messages?: Message[];
  onSendMessage?: (message: string,imageUri?: string) => void;
  onTyping?: (isTyping: boolean) => void;
  onButtonPress?: (button: MessageButton, message: Message) => void;
  onImageUpload?: ImageUploadCallback;
  onMessageUpdate?: (messageId: string, updates: Partial<Message>) => void;
  onMessageEdit?: (messageId: string, newText: string) => void;
  onMessageDelete?: (messageId: string) => void;
  placeholder?: string;
  sendButtonText?: string;
  className?: string;
  disabled?: boolean;
  showAvatars?: boolean;
  selectedButtons?: Set<string>;
  allowMessageEdit?: boolean;
  allowMessageDelete?: boolean;
  clickHighlight?: string;
  canInput?: boolean;
  setMessages: (messages: Message[]) => void;
  getMessage: (messageId: string) => Message | undefined;
  hideMessage: (messageId: string) => void;
  updateMessage: (message: Message) => void;
  addMessage: (message: Message) => void;
  dateleMessage: (messageId: string) => void;
}

// 消息类型定义
export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai" | "system";
  timestamp: Date;
  isTyping?: boolean;
  avatar?: string;
  showAvatars?: boolean;
  senderName?: string;
  buttons?: MessageButton[];
  images?: MessageImage[];
  card?: MessageCard;
  type?: "text" | "image" | "card" | "mixed" | "progress";
  progress?: MessageProgress;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
  isEditing?: boolean;
  originalText?: string; // 用于编辑时保存原始文本
  canEdit?: boolean;
  canDelete?: boolean;
  isHidden?: boolean;
}

export interface PendingUpload {
  imageUri: string;
  messageId: string;
  timestamp: string;
}

export interface OnboardingData {
  gender: any;
  userId: string;
  hasStylingDifficulty?: boolean;
  stylePreferences: string[];
  fullBodyPhoto: string;
  skinTone: string;
  bodyType: string;
  bodyStructure: string;
  faceShape: string;
  selectedStyles: string[];
  pendingUpload?: PendingUpload; // 待上传的图片信息
}
