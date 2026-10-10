import { Redirect } from "expo-router";

/** Demo mode: no sign-in yet, so launch goes straight to the dashboard (brief §5). */
export default function Index() {
  return <Redirect href="/dashboard" />;
}
