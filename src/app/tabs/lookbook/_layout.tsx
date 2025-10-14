import { router, Stack, usePathname } from "expo-router";
import { Button, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Layout() {
  const pathname = usePathname();

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Lookbook",
        }}
      />
      <Stack.Screen
        name="one"
        options={{
          title: "MAGIC LOOKBOOK",
          headerShown: true,
          headerBackVisible: false,
          //       // 使用 replace 避免页面堆叠
          //       router.replace("/tabs/lookbook/gallery");
          //     }}
          //     className="flex-row items-center ml-4"
          //   >
          //     <Ionicons name="book-outline" size={30} color="#000000" />
          //     {/* <Text className="ml-2 text-black font-medium text-xl">Back</Text> */}
          //   </Pressable>
          // ),
        }}
      />

    </Stack>
  );
}
