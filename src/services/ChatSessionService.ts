import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '@/components/types';

// 聊天会话接口
export interface ChatSession {
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

// 聊天会话管理服务
export class ChatSessionService {
  private static readonly SESSIONS_KEY = 'chat_sessions';
  private static readonly CURRENT_SESSION_KEY = 'current_session_id';

  // 获取所有会话
  static async getAllSessions(): Promise<ChatSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.SESSIONS_KEY);
      if (sessionsJson) {
        const sessions = JSON.parse(sessionsJson);
        // 转换日期字符串为Date对象
        return sessions.map((session: any) => ({
          ...session,
          lastMessageTime: new Date(session.lastMessageTime),
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
      return [];
    } catch (error) {
      console.error('获取会话列表失败:', error);
      return [];
    }
  }

  // 创建或获取当前会话
  static async createOrCurrent(type: ChatSession['type'], title?: string): Promise<ChatSession | null> {
    const sessionId = await this.getCurrentSessionId();
    if (sessionId) {
      return await this.getSession(sessionId) as ChatSession;
    } else {
      return await this.createSession(type, title);
    }

  }
  // 创建新会话
  static async createSession(type: ChatSession['type'], title?: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: Date.now().toString(),
      title: title || this.getDefaultTitle(type),
      lastMessage: '',
      lastMessageTime: new Date(),
      messageCount: 0,
      type,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const sessions = await this.getAllSessions();
    sessions.unshift(session); // 添加到开头
    await this.saveSessions(sessions);
    await this.setCurrentSession(session.id);
    
    return session;
  }

  // 获取当前会话ID
  static async getCurrentSessionId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.CURRENT_SESSION_KEY);
    } catch (error) {
      console.error('获取当前会话ID失败:', error);
      return null;
    }
  }

  // 设置当前会话
  static async setCurrentSession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);
    } catch (error) {
      console.error('设置当前会话失败:', error);
    }
  }

  // 获取当前会话
  static async getCurrentSession(): Promise<ChatSession | null> {
    try {
      const sessionId = await this.getCurrentSessionId();
      if (!sessionId) return null;

      const sessions = await this.getAllSessions();
      return sessions.find(session => session.id === sessionId) || null;
    } catch (error) {
      console.error('获取当前会话失败:', error);
      return null;
    }
  }

  // 获取指定会话
  static async getSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const sessions = await this.getAllSessions();
      return sessions.find(session => session.id === sessionId) || null;
    } catch (error) {
      console.error('获取会话失败:', error);
      return null;
    }
  }

  // 更新会话消息
  static async updateSessionMessages(sessionId: string, messages: Message[]): Promise<void> {
    console.log('updateSessionMessages', sessionId, messages);
    try {
      const sessions = await this.getAllSessions();
      const sessionIndex = sessions.findIndex(session => session.id === sessionId);
      
      if (sessionIndex !== -1) {
        const lastMessage = messages[messages.length - 1];
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          messages,
          lastMessage: lastMessage?.text || '',
          lastMessageTime: lastMessage?.timestamp || new Date(),
          messageCount: messages.length,
          updatedAt: new Date()
        };

        await this.saveSessions(sessions);
      }
    } catch (error) {
      console.error('更新会话消息失败:', error);
    }
  }

  // 添加消息到会话
  static async addMessageToSession(sessionId: string, message: Message): Promise<void> {
    console.log('addMessageToSession', sessionId, message);
    try {
      const sessions = await this.getAllSessions();
      const sessionIndex = sessions.findIndex(session => session.id === sessionId);
      
      if (sessionIndex !== -1) {
        sessions[sessionIndex].messages.push(message);
        sessions[sessionIndex].lastMessage = message.text;
        sessions[sessionIndex].lastMessageTime = message.timestamp;
        sessions[sessionIndex].messageCount = sessions[sessionIndex].messages.length;
        sessions[sessionIndex].updatedAt = new Date();

        await this.saveSessions(sessions);
      }
    } catch (error) {
      console.error('添加消息到会话失败:', error);
    }
  }

  // 删除会话
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      await this.saveSessions(filteredSessions);

      // 如果删除的是当前会话，清除当前会话ID
      const currentSessionId = await this.getCurrentSessionId();
      if (currentSessionId === sessionId) {
        await AsyncStorage.removeItem(this.CURRENT_SESSION_KEY);
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  }

  // 清空所有会话
  static async clearAllSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSIONS_KEY);
      await AsyncStorage.removeItem(this.CURRENT_SESSION_KEY);
    } catch (error) {
      console.error('清空所有会话失败:', error);
    }
  }

  // 保存会话列表
  private static async saveSessions(sessions: ChatSession[]): Promise<void> {
    console.log('saveSessions', sessions);
    try {
      await AsyncStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('保存会话列表失败:', error);
    }
  }

  // 获取默认标题
  private static getDefaultTitle(type: ChatSession['type']): string {
    const titles = {
      style_an_item: '搭配单品',
      outfit_check: '搭配检查',
      generate_ootd: '生成穿搭',
      general: '聊天对话'
    };
    return titles[type] || '新对话';
  }

  // 格式化时间显示
  static formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  }
}
