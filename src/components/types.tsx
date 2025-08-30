

// 消息按钮类型定义
export interface MessageButton {
    id: string;
    text: string;
    type?: 'primary' | 'secondary' | 'danger';
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
    status: 'pending' | 'processing' | 'completed' | 'error';
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
    isShell?: 'circle' | 'none';
    uploadImage?: boolean; // 是否显示图片上传功能
    commitButton?: MessageButton
}

// 图片上传回调类型
export interface ImageUploadCallback {
    onImageSelect?: (imageUri: string, messageId?: string) => void;
    onImageUpload?: (imageUri: string) => Promise<string>;
    onImageError?: (error: string) => void;
}

// 聊天组件属性
export interface ChatProps {
    messages?: Message[];
    onSendMessage?: (message: string) => void;
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
}

// 消息类型定义
export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai' | 'system';
    timestamp: Date;
    isTyping?: boolean;
    avatar?: string;
    showAvatars?: boolean;
    senderName?: string;
    buttons?: MessageButton[];
    images?: MessageImage[];
    card?: MessageCard;
    type?: 'text' | 'image' | 'card' | 'mixed' | 'progress';
    progress?: MessageProgress;
    status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
    isEditing?: boolean;
    originalText?: string; // 用于编辑时保存原始文本
    canEdit?: boolean;
    canDelete?: boolean;
}

export interface OnboardingData {
    userId: string;
    hasStylingDifficulty?: boolean;
    stylePreferences: string[];
    fullBodyPhoto: string;
    skinTone: string;
    bodyType: string;
    bodyStructure: string;
    faceShape: string;
    selectedStyles: string[];
}