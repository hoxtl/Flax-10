import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  authService,
  getErrorMessage,
  saveUserData,
  validatePasswords,
} = vi.hoisted(() => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
  },
  getErrorMessage: vi.fn((data) => data?.error || "signup error"),
  saveUserData: vi.fn(),
  validatePasswords: vi.fn(() => null),
}));

vi.mock("../../../api/authApi", () => ({ authService }));
vi.mock("../../../components/Auth/utils/authHelpers", () => ({
  getErrorMessage,
  saveUserData,
  validatePasswords,
}));

import { submitSignIn, submitSignUp } from "../../../pages/auth/utils/authSubmitHandlers";

describe("authSubmitHandlers", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    const store = new Map();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        clear: () => store.clear(),
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key),
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { dispatchEvent: vi.fn() },
    });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns password validation errors without toggling loading", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    validatePasswords.mockReturnValueOnce("Mismatch");

    await submitSignUp({ password: "a", password2: "b" }, setError, setLoading);

    expect(setError).toHaveBeenCalledWith("Mismatch");
    expect(setLoading).not.toHaveBeenCalled();
  });

  it("saves user data after successful sign up", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    authService.register.mockResolvedValue({
      response: { ok: true },
      data: { token: "token-1", user: { id: 1 } },
    });

    const promise = submitSignUp({ password: "a", password2: "a" }, setError, setLoading);
    await vi.advanceTimersByTimeAsync(180);
    await promise;

    expect(saveUserData).toHaveBeenCalledWith("token-1", { id: 1 });
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(setError).not.toHaveBeenCalledWith(expect.stringContaining("error"));
  });

  it("uses the signup error helper when the backend rejects the request", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    authService.register.mockResolvedValue({ response: { ok: false }, data: { error: "Taken" } });

    await submitSignUp({ password: "a", password2: "a" }, setError, setLoading);

    expect(getErrorMessage).toHaveBeenCalledWith({ error: "Taken" });
    expect(setError).toHaveBeenCalledWith("Taken");
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it("handles banned sign-in responses by persisting the ban state and dispatching auth-changed", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    authService.login.mockResolvedValue({
      response: { status: 403, ok: false },
      data: { is_banned: true, ban_reason: "Abuse" },
    });

    await submitSignIn({ username: "u", password: "p" }, setError, setLoading);

    expect(localStorage.getItem("banned")).toBe("1");
    expect(localStorage.getItem("ban_reason")).toBe("Abuse");
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "auth-changed" }));
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(setError).not.toHaveBeenCalled();
  });

  it("stores an empty ban reason when the backend omits it", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    authService.login.mockResolvedValue({
      response: { status: 403, ok: false },
      data: { is_banned: true },
    });

    await submitSignIn({ username: "u", password: "p" }, setError, setLoading);

    expect(localStorage.getItem("ban_reason")).toBe("");
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("handles rejected signup requests with the generic error message", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    authService.register.mockRejectedValueOnce(new Error("offline"));

    await submitSignUp({ password: "a", password2: "a" }, setError, setLoading);

    expect(setError).toHaveBeenCalledWith("There has been an error, please try again...");
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("saves user data after a successful sign in", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    authService.login.mockResolvedValueOnce({
      response: { ok: true, status: 200 },
      data: { token: "token-2", user: { id: 2 } },
    });

    const promise = submitSignIn({ username: "u", password: "p" }, setError, setLoading);
    await vi.advanceTimersByTimeAsync(180);
    await promise;

    expect(saveUserData).toHaveBeenCalledWith("token-2", { id: 2 });
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("shows backend sign-in errors and falls back when the backend omits the message", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    authService.login.mockResolvedValueOnce({
      response: { ok: false, status: 401 },
      data: { error: "Wrong password" },
    });

    await submitSignIn({ username: "u", password: "p" }, setError, setLoading);
    expect(setError).toHaveBeenCalledWith("Wrong password");

    setError.mockClear();
    authService.login.mockResolvedValueOnce({
      response: { ok: false, status: 401 },
      data: {},
    });

    await submitSignIn({ username: "u", password: "p" }, setError, setLoading);
    expect(setError).toHaveBeenCalledWith("Invalid username or password");
  });

  it("handles rejected sign-in requests with the generic error message", async () => {
    const setError = vi.fn();
    const setLoading = vi.fn();
    authService.login.mockRejectedValueOnce(new Error("offline"));

    await submitSignIn({ username: "u", password: "p" }, setError, setLoading);

    expect(setError).toHaveBeenCalledWith("There has been an error, please try again...");
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });
});
