import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none', // 禁用所有动画
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          animation: 'none',
        }} 
      />
      <Stack.Screen 
        name="subscription" 
        options={{ 
          animation: 'none',
        }} 
      />
      <Stack.Screen 
        name="credit" 
        options={{ 
          animation: 'none',
        }} 
      />
    </Stack>
  );
}
