import { Redirect } from "expo-router";

export default function RootIndex() {
  console.log("Redirecting to home");
  return <Redirect href="/tabs/home" />;
}
