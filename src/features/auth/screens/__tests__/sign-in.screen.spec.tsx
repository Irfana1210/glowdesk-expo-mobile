import { fireEvent, screen, waitFor } from "@testing-library/react-native";

import { LOCALE } from "@/constants/locale";

import { SignInScreen } from "@/features/auth/screens/sign-in.screen";
import { AuthService } from "@/features/auth/services/auth.service";
import { useSessionStore } from "@/features/auth/store/session.store";

import { ApiError } from "@/types/api-error";

import { renderWithQuery } from "@test/render-with-query";
import { signOutForTest, TEST_SESSIONS } from "@test/session-test-utils";

jest.mock("@/features/auth/services/auth.service", () => ({
  AuthService: { signIn: jest.fn(), signOut: jest.fn() },
}));

const L = LOCALE.auth;
const mockedSignIn = jest.mocked(AuthService.signIn);

beforeEach(() => {
  jest.clearAllMocks();
  signOutForTest();
  mockedSignIn.mockResolvedValue(TEST_SESSIONS.manager);
});

async function typeCredentials(staffId: string, pin: string) {
  await fireEvent.changeText(
    screen.getByTestId("SIGN_IN.FORM.STAFF_ID"),
    staffId,
  );
  await fireEvent.changeText(screen.getByTestId("SIGN_IN.FORM.PIN"), pin);
}

describe("SignInScreen", () => {
  it("shows the welcome copy and the quick sign-in cards", async () => {
    await renderWithQuery(<SignInScreen />);

    expect(
      screen.getByRole("header", { name: L.signIn.title }),
    ).toBeOnTheScreen();
    expect(screen.getByText(L.signIn.subtitle)).toBeOnTheScreen();
    expect(screen.getByTestId("SIGN_IN.QUICK.RO1001")).toHaveTextContent(
      /Alex Morgan.*RO1001 · PIN 1111.*Store Manager/,
    );
    expect(screen.getByTestId("SIGN_IN.QUICK.RO1002")).toHaveTextContent(
      /Jordan Lee.*RO1002 · PIN 2222.*Shift Leader/,
    );
  });

  it("validates before calling the service", async () => {
    await renderWithQuery(<SignInScreen />);

    await fireEvent.press(screen.getByTestId("SIGN_IN.FORM.SUBMIT"));

    expect(await screen.findByText(L.validation.staffId)).toBeOnTheScreen();
    expect(screen.getByText(L.validation.pin)).toBeOnTheScreen();
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it("signs in with typed credentials and stores the session", async () => {
    await renderWithQuery(<SignInScreen />);

    await typeCredentials("ro1001", "1111");
    await fireEvent.press(screen.getByTestId("SIGN_IN.FORM.SUBMIT"));

    await waitFor(() =>
      expect(useSessionStore.getState().status).toBe("signedIn"),
    );
    expect(mockedSignIn).toHaveBeenCalledWith({
      staffId: "RO1001",
      pin: "1111",
    });
    expect(useSessionStore.getState().session?.name).toBe("Alex Morgan");
  });

  it("signs in from a quick sign-in card", async () => {
    mockedSignIn.mockResolvedValue(TEST_SESSIONS.shiftLeader);
    await renderWithQuery(<SignInScreen />);

    await fireEvent.press(screen.getByTestId("SIGN_IN.QUICK.RO1002"));

    await waitFor(() =>
      expect(useSessionStore.getState().session?.staffId).toBe("RO1002"),
    );
    expect(mockedSignIn).toHaveBeenCalledWith({
      staffId: "RO1002",
      pin: "2222",
    });
  });

  it("shows the matching message when the credentials are wrong", async () => {
    mockedSignIn.mockRejectedValue(
      new ApiError("INVALID_CREDENTIALS", "nope", 401),
    );
    await renderWithQuery(<SignInScreen />);

    await typeCredentials("RO1001", "0000");
    await fireEvent.press(screen.getByTestId("SIGN_IN.FORM.SUBMIT"));

    expect(await screen.findByTestId("SIGN_IN.ERROR")).toBeOnTheScreen();
    expect(
      screen.getByText(LOCALE.errors.byCode.INVALID_CREDENTIALS ?? ""),
    ).toBeOnTheScreen();
    expect(useSessionStore.getState().status).toBe("signedOut");
  });

  it("falls back to the generic message for unexpected failures", async () => {
    mockedSignIn.mockRejectedValue(new Error("socket hang up"));
    await renderWithQuery(<SignInScreen />);

    await fireEvent.press(screen.getByTestId("SIGN_IN.QUICK.RO1001"));

    expect(await screen.findByTestId("SIGN_IN.ERROR")).toBeOnTheScreen();
    expect(screen.getByText(LOCALE.errors.generic)).toBeOnTheScreen();
  });

  it("disables the form while a sign-in is in flight", async () => {
    mockedSignIn.mockReturnValue(new Promise(() => undefined));
    await renderWithQuery(<SignInScreen />);

    await fireEvent.press(screen.getByTestId("SIGN_IN.QUICK.RO1001"));

    await waitFor(() =>
      expect(screen.getByTestId("SIGN_IN.FORM.SUBMIT")).toBeBusy(),
    );
    expect(screen.getByTestId("SIGN_IN.QUICK.RO1002")).toBeDisabled();
  });
});
