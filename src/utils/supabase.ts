import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// 使用正确的环境变量名称
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Environment variables check:");
console.log("EXPO_PUBLIC_SUPABASE_URL:", process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log("Final supabaseUrl:", supabaseUrl);

if (!supabaseUrl) {
  throw new Error(
    "Missing Supabase URL. Please set EXPO_PUBLIC_SUPABASE_URL in your .env file.",
  );
}

if (!supabaseKey) {
  throw new Error(
    "Missing Supabase Key. Please set EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
