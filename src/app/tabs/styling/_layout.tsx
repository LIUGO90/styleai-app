import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Styling", headerShown: false }}
      />
      <Stack.Screen
        name="style_an_item"
        options={{ title: "Style an Item", headerShown: false }}
      />
      <Stack.Screen
        name="outfit_check"
        options={{ title: "Outfit Check", headerShown: false }}
      />
      <Stack.Screen
        name="generate_ootd"
        options={{ title: "Generate OOTD", headerShown: false }}
      />
    </Stack>
  );
}
