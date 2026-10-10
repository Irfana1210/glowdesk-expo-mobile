import { z } from "zod";

import { LOCALE } from "@/constants/locale";

const L = LOCALE.auth.validation;

const STAFF_ID_PATTERN = /^RO\d{4}$/;
const PIN_PATTERN = /^\d{4}$/;

export const signInSchema = z.object({
  pin: z.string().regex(PIN_PATTERN, L.pin),
  staffId: z.string().trim().toUpperCase().regex(STAFF_ID_PATTERN, L.staffId),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const DEFAULT_SIGN_IN_VALUES: SignInFormValues = {
  pin: "",
  staffId: "",
};
