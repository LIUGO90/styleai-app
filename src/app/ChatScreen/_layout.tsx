import { Drawer } from "expo-router/drawer";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ChatSessionList } from '@/components/ChatSessionList';
import { ChatSession, ChatSessionService } from '@/services/ChatSessionService';
import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ChatScreenLayout() {
    const router = useRouter();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();

    // 加载会话列表
    const loadSessions = async () => {
        const allSessions = await ChatSessionService.getAllSessions();
        setSessions(allSessions);
        
        const currentId = await ChatSessionService.getCurrentSessionId();
        setCurrentSessionId(currentId || undefined);
    };

    // 处理会话选择
    const handleSessionSelect = async (session: ChatSession) => {
        await ChatSessionService.setCurrentSession(session.id);
        setCurrentSessionId(session.id);
        
        // 根据会话类型跳转到对应页面
        switch (session.type) {
            case 'style_an_item':
                router.push({
                    pathname: '/ChatScreen/style_an_item',
                    params: { sessionId: session.id }
                });
                break;
            case 'outfit_check':
                router.push('/ChatScreen/outfit_check');
                break;
            case 'generate_ootd':
                router.push('/ChatScreen/generate_ootd');
                break;
            default:
                router.push('/ChatScreen/style_an_item');
                break;
        }
    };

    // 处理新建会话
    const handleNewSession = async () => {
        const newSession = await ChatSessionService.createSession('style_an_item');
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        
        // 跳转到新会话页面
        router.push({
            pathname: '/ChatScreen/style_an_item',
            params: { sessionId: newSession.id }
        });
    };

    // 处理删除会话
    const handleDeleteSession = async (sessionId: string) => {
        await ChatSessionService.deleteSession(sessionId);
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        
        if (currentSessionId === sessionId) {
            ChatSessionService.getAllSessions().then(async sessions => {
                if(sessions.length > 0) {
                    setCurrentSessionId(sessions[0].id);
                    ChatSessionService.setCurrentSession(sessions[0].id);
                    router.push({
                        pathname: '/ChatScreen/style_an_item',
                        params: { sessionId: sessions[0].id }
                    });
                } else {
                    const newSession = await ChatSessionService.createSession('style_an_item');
                    setCurrentSessionId(newSession?.id);
                    ChatSessionService.setCurrentSession(newSession?.id);
                    router.push({
                        pathname: '/ChatScreen/style_an_item',
                        params: { sessionId: newSession?.id }
                    });
                }
            })
        }else{
            router.push({
                pathname: '/ChatScreen/style_an_item',
                params: { sessionId: currentSessionId }
            });
        }
    };

    // 清空所有会话
    const handleClearAllSessions = () => {
        Alert.alert(
            '清空所有会话',
            '确定要清空所有聊天记录吗？此操作无法撤销。',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '清空',
                    style: 'destructive',
                    onPress: async () => {
                        await ChatSessionService.clearAllSessions();
                        setSessions([]);
                        setCurrentSessionId(undefined);
                        // 跳转到默认页面
                        router.push('/ChatScreen/style_an_item');
                    },
                },
            ]
        );
    };

    useEffect(() => {
        loadSessions();
    }, []);

    return (
        <Drawer
            screenOptions={{
                headerShown: false,
                drawerActiveTintColor: '#007AFF',
                drawerInactiveTintColor: '#666666',
                drawerStyle: {
                    backgroundColor: '#ffffff',
                    width: 320,
                },
                drawerLabelStyle: {
                    fontSize: 16,
                    fontWeight: '500',
                },
                drawerItemStyle: {
                    borderRadius: 8,
                    marginHorizontal: 8,
                    marginVertical: 2,
                },
                swipeEnabled: false,
                swipeEdgeWidth: 0,
            }}
            drawerContent={(props) => (
                <View style={styles.drawerContainer}>
                    <View style={styles.drawerHeader}>
                        <Text style={styles.drawerTitle}>聊天助手</Text>
                        <Pressable
                            style={styles.clearButton}
                            onPress={handleClearAllSessions}
                        >
                            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                        </Pressable>
                    </View>
                    
                    <ChatSessionList
                        sessions={sessions}
                        currentSessionId={currentSessionId}
                        onSessionSelect={handleSessionSelect}
                        onNewSession={handleNewSession}
                        onDeleteSession={handleDeleteSession}
                    />
                </View>
            )}
        >
            <Drawer.Screen 
                name="style_an_item" 
                options={{ 
                    drawerLabel: '搭配单品',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="tshirt-crew" size={size} color={color} />
                    ),
                }} 
            />
            <Drawer.Screen 
                name="outfit_check" 
                options={{ 
                    drawerLabel: '搭配检查',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="check-circle-outline" size={size} color={color} />
                    ),
                }} 
            />
            <Drawer.Screen 
                name="generate_ootd" 
                options={{ 
                    drawerLabel: '生成穿搭',
                    drawerIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="magic-staff" size={size} color={color} />
                    ),
                }} 
            />
        </Drawer>
    );
}

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    drawerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#f8f9fa',
    },
    drawerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
});
