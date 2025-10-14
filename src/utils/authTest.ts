// 认证系统测试工具
import { supabase } from "./supabase";

export const testAuthSystem = async () => {

  try {
    // 测试1: 检查Supabase连接

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("❌ Supabase connection failed:", error);
      return false;
    }



    // 测试3: 检查环境变量

    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
    } else {
      console.error("❌ Environment variables missing");
      return false;
    }


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
