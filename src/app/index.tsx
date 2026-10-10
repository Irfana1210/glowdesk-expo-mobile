import { Redirect } from "expo-router";

import {
  selectSessionStatus,
  useSessionStore,
} from "@/features/auth/store/session.store";

/** Launch lands on the dashboard when signed in, otherwise on the sign-in screen. */
export default function Index() {
  const status = useSessionStore(selectSessionStatus);
  return <Redirect href={status === "signedIn" ? "/dashboard" : "/sign-in"} />;
}
