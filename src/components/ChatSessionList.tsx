import React from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { ChatSession, ChatSessionService } from "@/services/ChatSessionService";
import { cn } from "../utils/cn";

interface ChatSessionListProps {
  sessions: ChatSession[];
  currentSessionId?: string;
  onSessionSelect: (session: ChatSession) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function ChatSessionList({
  sessions,
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
}: ChatSessionListProps) {
  const renderSessionItem = ({ item }: { item: ChatSession }) => {
    const isCurrentSession = item.id === currentSessionId;
    const isLastMessageEmpty =
      !item.lastMessage || item.lastMessage.trim() === "";

    return (
      <Pressable
        style={[
          styles.sessionItem,
          isCurrentSession && styles.currentSessionItem,
        ]}
        onPress={() => onSessionSelect(item)}
        onLongPress={() => {
          Alert.alert("删除会话", "确定要删除这个会话吗？删除后无法恢复。", [
            { text: "取消", style: "cancel" },
            {
              text: "删除",
              style: "destructive",
              onPress: () => onDeleteSession(item.id),
            },
          ]);
        }}
      >
        <View style={styles.sessionContent}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text
                style={[
                  styles.sessionTitle,
                  isCurrentSession && styles.currentSessionTitle,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.sessionTime}>
                {ChatSessionService.formatTime(item.lastMessageTime)}
              </Text>
            </View>
            <View style={styles.sessionActions}>
              <Text style={styles.messageCount}>{item.messageCount}</Text>
              <MaterialIcons
                name="more-vert"
                size={20}
                color="#999"
                style={styles.moreIcon}
              />
            </View>
          </View>

          <Text
            style={[
              styles.lastMessage,
              isLastMessageEmpty && styles.emptyMessage,
            ]}
            numberOfLines={2}
          >
            {isLastMessageEmpty ? "暂无消息" : item.lastMessage}
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>聊天记录</Text>
      <Pressable style={styles.newSessionButton} onPress={onNewSession}>
        <Ionicons name="add" size={24} color="#007AFF" />
      </Pressable>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
      <Text style={styles.emptyText}>暂无聊天记录</Text>
      <Text style={styles.emptySubtext}>开始新的对话吧</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  newSessionButton: {
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  sessionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  currentSessionItem: {
    backgroundColor: "#f0f8ff",
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  sessionContent: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 8,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  currentSessionTitle: {
    color: "#007AFF",
    fontWeight: "600",
  },
  sessionTime: {
    fontSize: 12,
    color: "#999",
  },
  sessionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  messageCount: {
    fontSize: 12,
    color: "#999",
    marginRight: 4,
  },
  moreIcon: {
    opacity: 0.6,
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 18,
  },
  emptyMessage: {
    color: "#ccc",
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
  },
});
