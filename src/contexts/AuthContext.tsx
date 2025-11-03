import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { appInitializationService } from "@/services/AppInitializationService";

export interface AuthUser extends User {
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithApple: (appleCredential: any) => Promise<{ userId?: string, error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  clearAllUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children?: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isClearingRef = useRef(false);

  useEffect(() => {
    // 监听 AppState 变化并记录 action history
    if (!user?.id) return;

    const subscription = AppState.addEventListener(
      'change',
      async (state: AppStateStatus) => {
        console.log('App state changed:', state);
        if (state === 'active' || state === 'background') {
          const { data, error } = await supabase.from('action_history').insert({
            user_id: user.id,
            action: `app_state_changed_${state}`,
          }).select()
            .single();
          if (error) {
            console.error('Error inserting action history:', error);
          } else {
            // console.log('Action history inserted:', data);
          }
        }
      }
    );

    // 清理函数：移除监听器以防止内存泄漏
    return () => {
      subscription.remove();
    };
  }, [user?.id]);

  useEffect(() => {
    // 获取初始session
    const getInitialSession = async () => {
      try {

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
        } else {
          setSession(session);
          setUser((session?.user as AuthUser) || null);
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {

      // 如果正在清除数据，跳过状态更新
      if (isClearingRef.current) {
        return;
      }

      switch (event) {
        case "SIGNED_OUT":
          console.log("🎈user signed out:", session);
          // 清除 Amplitude 用户ID
          await appInitializationService.clearAmplitudeUserId();
          setSession(null);
          setUser(null);
          setLoading(false);
          break;
        case "SIGNED_IN":
          console.log("🎈user signed in:", event, session?.user?.id);
          setSession(session);
          await AsyncStorage.setItem("access_token", session?.access_token || "");
          if (session?.user?.id) {
            try {
              // 添加超时控制：最多等待3秒
              const profilePromise = supabase
                .from('profiles')
                .select('name, email, avatar_url')
                .eq('id', session?.user?.id)
                .single();

              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile query timeout')), 3000)
              );

              const { data: profile, error } = await Promise.race([
                profilePromise,
                timeoutPromise
              ]) as any;

              if (error) {
                console.log("⚠️ Error fetching profile (using fallback):", error.message);
              } else {
                console.log("🎈profile", profile);
              }

              // 优先从profile获取，如果没有则从user_metadata获取（Apple登录的用户信息在这里）
              const userName = profile?.name || session.user.user_metadata?.full_name || "";
              const userEmail = profile?.email || session.user.email || "";

              console.log("🎈最终获取的 userName:", userName, "userEmail:", userEmail);

              setUser({
                ...session.user,
                name: userName,
                email: userEmail,
                role: profile?.role || "",
              } as AuthUser);
              
              // 设置 Amplitude 用户ID和用户属性
              await appInitializationService.setAmplitudeUserId(session.user.id, {
                name: userName,
                email: userEmail,
                role: profile?.role || "",
              });
              
              // 保存到本地存储（保存 userName 而不是 profile?.name，因为 userName 已经包含了 fallback 逻辑）
              if (userName) {
                await AsyncStorage.setItem("userName", userName);
                console.log("✅ 已保存 name 到 AsyncStorage:", userName);
              }
              if (userEmail) {
                await AsyncStorage.setItem("userEmail", userEmail);
                console.log("✅ 已保存 userEmail 到 AsyncStorage:", userEmail);
              }
              if (profile?.images && profile.images.length > 0) {
                await AsyncStorage.setItem("newlook", profile.images);
                console.log("✅ 已保存 newlook 到 AsyncStorage:", JSON.stringify(profile.images));
              }
              console.log("🎈profile?.avatar_url", profile?.avatar_url);
              if (profile?.avatar_url) {
                await AsyncStorage.setItem("userAvatar", profile.avatar_url);
                console.log("✅ 已保存 userAvatar 到 AsyncStorage:", profile.avatar_url);
              }
              // 验证保存是否成功
              const savedName = await AsyncStorage.getItem("userName");
              const savedEmail = await AsyncStorage.getItem("userEmail");
              const savedNewlook = await AsyncStorage.getItem("newlook");
              console.log("🔍 验证 AsyncStorage - userName:", savedName, "email:", savedEmail, "newlook:", savedNewlook);
            } catch (error: any) {
              console.log("⚠️ Profile query failed (using fallback):", error.message);
              // 如果查询失败，使用 session 中的基本信息
              const userName = session.user.user_metadata?.full_name || "";
              const userEmail = session.user.email || "";

              setUser({
                ...session.user,
                name: userName,
                email: userEmail,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as AuthUser);
              
              // 设置 Amplitude 用户ID（即使 profile 查询失败）
              await appInitializationService.setAmplitudeUserId(session.user.id, {
                name: userName,
                email: userEmail,
              });
            }
          }

          setLoading(false);
          // 设置 loading 为 false，否则应用会一直显示加载状态
          // ⚠️ 非常重要：必须有 break，否则代码会继续执行到下一个 case！
          // 这是 JavaScript switch 语句的特性，叫做 "fall-through"
          break;
        case "TOKEN_REFRESHED":
        case "USER_UPDATED":
          console.log("🎈user", event, session?.user?.id);
          await AsyncStorage.setItem("access_token", session?.access_token || "");
          break;

      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signInWithApple = async (appleCredential: any) => {
    console.log("🎈用户登录信息", appleCredential);
    try {
      // 首先尝试使用Supabase认证
      const { data: { user, session }, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: appleCredential.identityToken,
      });
      return { userId: user?.id, error };
    } catch (error) {
      console.error("Apple sign in error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 开始退出登录...');
      // 清除 Amplitude 用户ID
      await appInitializationService.clearAmplitudeUserId();
      // 正常Supabase用户登出
      await supabase.auth.signOut();
      clearAllUserData();
      console.log('✅ 退出登录成功');
    } catch (error) {
      console.error("❌ 退出登录错误:", error);
      // 即使出错也要清理本地状态
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const clearAllUserData = async () => {
    try {
      console.log('🧹 开始清除所有用户数据...');
      isClearingRef.current = true;

      // 1. 先清除所有AsyncStorage数据
      const keysToRemove = [
        "supabase_session",
        "onboardingData",
        "user_preferences",
        "app_settings",
        "cached_data",
        "userName",
        "userEmail",
        "newlook",
        "access_token",
        "userAvatar",
      ];

      for (const key of keysToRemove) {
        try {
          await AsyncStorage.removeItem(key);
          console.log(`✅ 已清除: ${key}`);
        } catch (error) {
          console.error(`❌ 清除失败: ${key}`, error);
        }
      }

      // 2. 清除所有AsyncStorage数据（备用方法）
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(allKeys);
        console.log('✅ 已清除所有 AsyncStorage 数据');
      } catch (error) {
        console.error('❌ 清除 AsyncStorage 失败:', error);
      }

      // 3. 清除本地状态
      setUser(null);
      setSession(null);
      console.log('✅ 已清除本地状态');

      // 4. 最后清除Supabase session（这可能会触发onAuthStateChange）
      await supabase.auth.signOut();
      console.log('✅ 已清除 Supabase session');

      console.log('🎉 所有用户数据清除完成');
    } catch (error) {
      console.error("❌ 清除用户数据错误:", error);
      // 即使出错也要清理本地状态
      setUser(null);
      setSession(null);
    } finally {
      isClearingRef.current = false;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithApple,
    signOut,
    resetPassword,
    clearAllUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
