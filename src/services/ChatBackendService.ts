import { webWorkerAIService } from "./WebWorkerAIService";
// 聊天后台服务 - 处理与后台的聊天记录同步
export class ChatBackendService {

  // 发送聊天消息 (对应 POST /api/apple/chat)
  static async sendChatMessage(data: {
    jobId: string;
    message: string;
    sessionId?: string;
    includeJobContext?: boolean;
  }): Promise<{ success: boolean; message?: string; sessionId?: string; error?: string }> {
    try {

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();

        return result;
      } else {
        const errorResult = await response.json();
        console.error('发送聊天消息失败，状态码:', response.status);
        return {
          success: false,
          error: errorResult.error || 'Failed to send message'
        };
      }
    } catch (error) {
      console.error('发送聊天消息到后台失败:', error);
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  // 获取聊天历史 (对应 GET /api/apple/chat)
  static async getChatHistory(sessionId: string): Promise<any[]> {
    try {

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/chat?sessionId=${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();

        return result.messages || [];
      } else {
        console.error('获取聊天历史失败，状态码:', response.status);
        return [];
      }
    } catch (error) {
      console.error('从后台获取聊天历史失败:', error);
      return [];
    }
  }

  // 清空特定会话的聊天记录 (对应 DELETE /api/apple/chat)
  static async clearChatHistory(sessionId: string): Promise<boolean> {
    try {

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/apple/chat?sessionId=${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {

        return true;
      } else {
        console.error('清空聊天记录失败，状态码:', response.status);
        return false;
      }
    } catch (error) {
      console.error('清空聊天记录失败:', error);
      return false;
    }
  }
}
