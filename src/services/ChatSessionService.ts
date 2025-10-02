import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message } from "@/components/types";
import { ChatBackendService } from "./ChatBackendService";
import { webWorkerAIService } from "./WebWorkerAIService";
import { Alert } from "react-native";

// 聊天会话接口
export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  type: "style_an_item" | "outfit_check" | "free_chat";
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// 聊天会话管理服务
export class ChatSessionService {
  private static readonly SESSIONS_KEY = "chat_sessions";
  private static readonly CURRENT_SESSION_KEY = "current_session_id";
  private static readonly MAX_SESSIONS = 20; // 最大会话数量

  // 获取所有会话
  static async getAllSessions(): Promise<ChatSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.SESSIONS_KEY);
      console.log('getAllSessions - sessionsJson:', sessionsJson ? 'exists' : 'null');
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
            timestamp: new Date(msg.timestamp),
          })),
        }));
      }
      console.log('getAllSessions - no sessions found');
      return [];
    } catch (error) {
      console.error("获取会话列表失败:", error);
      return [];
    }
  }

  // // 创建或获取当前会话
  // static async createOrCurrent(
  //   type: ChatSession["type"],
  //   title?: string,
  // ): Promise<ChatSession | null> {
  //   const sessionId = await this.getCurrentSessionId();
  //   if (sessionId) {
  //     return (await this.getSession(sessionId)) as ChatSession;
  //   } else {
  //     return await this.createSession(type, title);
  //   }
  // }
  // 创建新会话
  static async createSession(
    type: ChatSession["type"],
    title?: string,
  ): Promise<ChatSession | null> {
    const sessions = await this.getAllSessions();
    if (sessions.length >= this.MAX_SESSIONS) {
      Alert.alert(
        "Session Limit Reached", 
        `You have reached the maximum of ${this.MAX_SESSIONS} chat sessions.\n\nPlease delete old sessions to create new ones.`,
        [{ text: "OK", style: "default" }]
      );
      return null;
    }
    const session: ChatSession = {
      id: Date.now().toString(),
      title: title || this.getDefaultTitle(type),
      lastMessage: "",
      lastMessageTime: new Date(),
      messageCount: 0,
      type,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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
      console.error("获取当前会话ID失败:", error);
      return null;
    }
  }

  // 设置当前会话
  static async setCurrentSession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CURRENT_SESSION_KEY, sessionId);
    } catch (error) {
      console.error("设置当前会话失败:", error);
    }
  }

  // 获取当前会话
  static async getCurrentSession(): Promise<ChatSession | null> {
    try {
      const sessionId = await this.getCurrentSessionId();
      if (!sessionId) return null;

      const sessions = await this.getAllSessions();
      return sessions.find((session) => session.id === sessionId) || null;
    } catch (error) {
      console.error("获取当前会话失败:", error);
      return null;
    }
  }

  // 获取指定会话
  static async getSessionByType(type: ChatSession["type"]): Promise<ChatSession | null> {
    console.log("getSessionByType", type);
    try {
      const sessions = await this.getAllSessions();
      console.log('getSession - found sessions:', sessions.length);
      const session = sessions.find((session) => session.type === type);
      console.log('getSession - found session:', session ? 'yes' : 'no');
      if (session) {
        console.log('getSession - session messages:', session.messages?.length || 0);
      }
      return session || null;
    } catch (error) {
      console.error("获取会话失败:", error);
      return null;
    }
  }
  // 获取指定会话
  static async getSession(sessionId: string): Promise<ChatSession | null> {
    console.log("getSession", sessionId);
    try {
      const sessions = await this.getAllSessions();
      console.log('getSession - found sessions:', sessions.length);
      const session = sessions.find((session) => session.id === sessionId);
      console.log('getSession - found session:', session ? 'yes' : 'no');
      if (session) {
        console.log('getSession - session messages:', session.messages?.length || 0);
      }
      return session || null;
    } catch (error) {
      console.error("获取会话失败:", error);
      return null;
    }
  }

  // 更新会话消息
  static async updateSessionMessages(
    sessionId: string,
    messages: Message[],
  ): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      const sessionIndex = sessions.findIndex(
        (session) => session.id === sessionId,
      );

      if (sessionIndex !== -1) {
        const lastMessage = messages[messages.length - 1];
        sessions[sessionIndex] = {
          ...sessions[sessionIndex],
          messages,
          lastMessage: lastMessage?.text || "",
          lastMessageTime: lastMessage?.timestamp || new Date(),
          messageCount: messages.length,
          updatedAt: new Date(),
        };
        await this.saveSessions(sessions);
      }
    } catch (error) {
      console.error("更新会话消息失败:", error);
    }
  }

  // 添加消息到会话
  static async addMessageToSession(
    sessionId: string,
    message: Message,
  ): Promise<void> {
    console.log("addMessageToSession", sessionId, message);
    try {
      const sessions = await this.getAllSessions();
      const sessionIndex = sessions.findIndex(
        (session) => session.id === sessionId,
      );

      if (sessionIndex !== -1) {
        sessions[sessionIndex].messages.push(message);
        sessions[sessionIndex].lastMessage = message.text;
        sessions[sessionIndex].lastMessageTime = message.timestamp;
        sessions[sessionIndex].messageCount =
          sessions[sessionIndex].messages.length;
        sessions[sessionIndex].updatedAt = new Date();

        await this.saveSessions(sessions);
      }
    } catch (error) {
      console.error("添加消息到会话失败:", error);
    }
  }

  // 删除会话
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      console.log("deleteSession1", sessionId);
      // 先通知后台删除记录
      await webWorkerAIService.deleteChatRequest([sessionId], {}, new AbortController());

      // 然后删除本地记录
      const sessions = await this.getAllSessions();
      const filteredSessions = sessions.filter(
        (session) => session.id !== sessionId,
      );
      await this.saveSessions(filteredSessions);

      // 如果删除的是当前会话，清除当前会话ID
      const currentSessionId = await this.getCurrentSessionId();
      if (currentSessionId === sessionId) {
        await AsyncStorage.removeItem(this.CURRENT_SESSION_KEY);
      }
    } catch (error) {
      console.error("删除会话失败:", error);
    }
  }

  // 清空所有会话
  static async clearAllSessions(): Promise<void> {
    try {
      // 获取所有会话ID，批量通知后台删除
      const sessions = await this.getAllSessions();
      const sessionIds = sessions.map(session => session.id);
      console.log("deleteSession2", sessionIds);
      // 通知后台批量删除
      await webWorkerAIService.deleteChatRequest(sessionIds, {}, new AbortController());

      // 删除本地记录
      await AsyncStorage.removeItem(this.SESSIONS_KEY);
      await AsyncStorage.removeItem(this.CURRENT_SESSION_KEY);
    } catch (error) {
      console.error("清空所有会话失败:", error);
    }
  }


  // 保存会话列表
  private static async saveSessions(sessions: ChatSession[]): Promise<void> {
    // console.log('saveSessions', sessions);
    console.log("saveSessions");
    try {
      await AsyncStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("保存会话列表失败:", error);
    }
  }

  // 获取默认标题
  private static getDefaultTitle(type: ChatSession["type"]): string {
    const titles = {
      style_an_item: "Style an item",
      outfit_check: "Outfit Check",
      free_chat: "Free Chat",
    };
    return titles[type] + " " + this.NowTime(new Date());
  }

  // 生成 年月日 时分 格式
  static NowTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }

  // 格式化时间显示
  static formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 0) {
      return this.NowTime(date);
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return "Just now";
    }
  }
}
