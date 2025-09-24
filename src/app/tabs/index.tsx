import { Redirect } from "expo-router";

export default function RootIndex() {
  console.log("Redirecting to styling");
  return <Redirect href="/tabs/styling" />;
}
