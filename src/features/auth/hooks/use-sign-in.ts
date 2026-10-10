import { useSafeMutation } from "@/hooks/query/use-safe-mutation";

import { AuthService } from "../services/auth.service";
import { useSessionStore } from "../store/session.store";
import { type Session, type SignInInput } from "../types";

/** Signs in through the auth service and stores the session on success. */
export function useSignIn() {
  const setSession = useSessionStore((s) => s.setSession);
  return useSafeMutation<Session, Error, SignInInput>({
    mutationFn: (input) => AuthService.signIn(input),
    onSuccess: (session) => setSession(session),
  });
}
