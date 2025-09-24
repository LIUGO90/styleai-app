// 认证系统测试工具
import { supabase } from "./supabase";

export const testAuthSystem = async () => {
  console.log("🧪 Testing Auth System...");

  try {
    // 测试1: 检查Supabase连接
    console.log("1. Testing Supabase connection...");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Supabase connection failed:", error);
      return false;
    }
    console.log("✅ Supabase connection successful");

    // 测试2: 检查当前session
    console.log("2. Checking current session...");
    if (data.session) {
      console.log("✅ User is authenticated:", data.session.user.email);
    } else {
      console.log("ℹ️  No active session (user not logged in)");
    }

    // 测试3: 检查环境变量
    console.log("3. Checking environment variables...");
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      console.log("✅ Environment variables loaded");
      console.log("   URL:", supabaseUrl.substring(0, 30) + "...");
      console.log("   Key:", supabaseKey.substring(0, 20) + "...");
    } else {
      console.error("❌ Environment variables missing");
      return false;
    }

    console.log("🎉 Auth system test completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Auth system test failed:", error);
    return false;
  }
};

// 在开发环境中自动运行测试
if (__DEV__) {
  // 延迟执行，确保应用完全加载
  setTimeout(() => {
    testAuthSystem();
  }, 2000);
}
