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

export interface AuthUser extends User {
  // 可以在这里扩展用户信息
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithApple: (appleCredential: any) => Promise<{ error: any }>;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isClearingRef = useRef(false);

  useEffect(() => {
    // 获取初始session
    const getInitialSession = async () => {
      try {
        console.log("supabase get session");
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
      console.log("Auth state changed:", event, session?.user?.id);

      // 如果正在清除数据，跳过状态更新
      if (isClearingRef.current) {
        console.log("Skipping auth state change during data clearing");
        return;
      }

      setSession(session);
      setUser((session?.user as AuthUser) || null);
      setLoading(false);

      // 保存session到AsyncStorage
      if (session) {
        await AsyncStorage.setItem("supabase_session", JSON.stringify(session));
      } else {
        await AsyncStorage.removeItem("supabase_session");
      }
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
    console.log("supabase save apple with full credential:", appleCredential);

    try {
      // 首先尝试使用Supabase认证
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: appleCredential.identityToken,
      });

      // // 如果Supabase认证失败（通常是audience错误），我们创建本地用户
      // if (error && error.message?.includes('audience')) {
      //   console.log('Supabase authentication failed, creating local user with Apple data');

      //   // 从Apple credential中提取用户信息
      const userInfo = {
        id: appleCredential.user || "apple_user_" + Date.now(),
        email: appleCredential.email || "user@example.com",
        user_metadata: {
          full_name: appleCredential.fullName
            ? `${appleCredential.fullName.givenName || ""} ${appleCredential.fullName.familyName || ""}`.trim()
            : "Apple User",
          provider: "apple",
          avatar_url: null,
          apple_user_id: appleCredential.user,
          real_user_status: appleCredential.realUserStatus,
        },
        app_metadata: {
          provider: "apple",
          providers: ["apple"],
        },
        aud: "authenticated",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log("Creating user with Apple data:", userInfo);

      //   // 直接设置用户状态
      setUser(userInfo as unknown as AuthUser);
      setSession({
        user: userInfo as unknown as User,
        access_token: "apple_dev_token",
        refresh_token: "apple_dev_refresh_token",
        expires_in: 3600,
        expires_at: Date.now() + 3600000,
        token_type: "bearer",
      } as unknown as Session);

      // 保存到AsyncStorage
      await AsyncStorage.setItem(
        "supabase_session",
        JSON.stringify({
          user: userInfo,
          access_token: "apple_dev_token",
          refresh_token: "apple_dev_refresh_token",
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: "bearer",
        }),
      );

      // 注意：这里使用的是模拟登录，不需要调用 admin.updateUserById
      // 如果需要真实的 Supabase 集成，应该使用 supabase.auth.signInWithIdToken
      console.log("Apple user created successfully with real data");
      //   console.log('Apple user created successfully with real data');
      //   return { error: null };
      // }

      return { error };
    } catch (error) {
      console.error("Apple sign in error:", error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // 检查是否是Apple开发用户
      if (session?.access_token === "apple_dev_token") {
        console.log("Signing out Apple development user");
        setUser(null);
        setSession(null);
        await AsyncStorage.removeItem("supabase_session");
        return;
      }

      // 正常Supabase用户登出
      await supabase.auth.signOut();
      await AsyncStorage.removeItem("supabase_session");
    } catch (error) {
      console.error("Error signing out:", error);
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
      console.log("🧹 Clearing all user data...");
      isClearingRef.current = true;

      // 1. 先清除所有AsyncStorage数据
      const keysToRemove = [
        "supabase_session",
        "onboardingData",
        "user_preferences",
        "app_settings",
        "cached_data",
      ];

      for (const key of keysToRemove) {
        try {
          await AsyncStorage.removeItem(key);
          console.log(`✅ Removed ${key}`);
        } catch (error) {
          console.log(`⚠️ Failed to remove ${key}:`, error);
        }
      }

      // 2. 清除所有AsyncStorage数据（备用方法）
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(allKeys);
        console.log("✅ Cleared all AsyncStorage data");
      } catch (error) {
        console.log("⚠️ Failed to clear all AsyncStorage:", error);
      }

      // 3. 清除本地状态
      setUser(null);
      setSession(null);

      // 4. 最后清除Supabase session（这可能会触发onAuthStateChange）
      await supabase.auth.signOut();

      console.log("🎉 All user data cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing user data:", error);
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
