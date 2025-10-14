import { View } from "react-native";
import { AppText } from "@/components/AppText";
import { Link, Redirect, useRouter } from "expo-router";
import { Button } from "@/components/Button";

export default function SecondScreen() {
  const router = useRouter();

  // // 示例参数
  // const params = {
  //   userId: "12345",
  // };


  // 将参数作为查询字符串传递
  // const queryString = new URLSearchParams(params).toString();
  // return <Redirect href={`/tabs/lookbook/one?${queryString}`} />;

  return <Redirect href={`/tabs/lookbook/one`} />;
}
