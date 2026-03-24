import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useAuthPage } from "../../pages/Auth/hooks/useAuthPage";
import { useAuthPageScroll } from "../../pages/Auth/hooks/useAuthPageScroll";
import { useAuthLandingSections } from "../../pages/Auth/hooks/useAuthLandingSections";

const useAuthFormMock = vi.fn();
const submitSignInMock = vi.fn();
const submitSignUpMock = vi.fn();
const buildAuthLandingSectionsMock = vi.fn();

vi.mock("../../components/Authentication/hooks/useAuthForm", () => ({
  useAuthForm: (...args) => useAuthFormMock(...args),
}));

vi.mock("../../pages/Auth/utils/authSubmitHandlers", () => ({
  submitSignIn: (...args) => submitSignInMock(...args),
  submitSignUp: (...args) => submitSignUpMock(...args),
}));

vi.mock("../../pages/Auth/content/authLandingSections", () => ({
  buildAuthLandingSections: (...args) => buildAuthLandingSectionsMock(...args),
}));

describe("Auth hooks", () => {
  let signUpUpdateField;
  let signInUpdateField;

  beforeEach(() => {
    useAuthFormMock.mockReset();
    submitSignInMock.mockReset();
    submitSignUpMock.mockReset();
    buildAuthLandingSectionsMock.mockReset();
    signUpUpdateField = vi.fn();
    signInUpdateField = vi.fn();

    useAuthFormMock.mockImplementation((defaults) => {
      if ("password2" in defaults) {
        return {
          formData: {
            first_name: "A",
            last_name: "",
            username: "",
            email: "",
            password: "",
            password2: "",
          },
          updateField: signUpUpdateField,
        };
      }

      return {
        formData: { username: "b", password: "" },
        updateField: signInUpdateField,
      };
    });
  });

  it("manages auth page state and submit handlers", () => {
    const { result } = renderHook(() => useAuthPage(false));
    expect(result.current.signIn).toBe(false);
    expect(result.current.error).toBe("");
    expect(result.current.loading).toBe(false);
    expect(result.current.signUpData.first_name).toBe("A");
    expect(result.current.signInData.username).toBe("b");
    expect(result.current.updateSignUpField).toBe(signUpUpdateField);
    expect(result.current.updateSignInField).toBe(signInUpdateField);

    act(() => result.current.handleToggle(true));
    expect(result.current.signIn).toBe(true);

    const preventDefault = vi.fn();
    act(() => result.current.handleSignUp({ preventDefault }));
    act(() => result.current.handleSignIn({ preventDefault }));

    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(submitSignUpMock).toHaveBeenCalled();
    expect(submitSignInMock).toHaveBeenCalled();
    expect(submitSignUpMock).toHaveBeenCalledWith(
      result.current.signUpData,
      expect.any(Function),
      expect.any(Function),
    );
    expect(submitSignInMock).toHaveBeenCalledWith(
      result.current.signInData,
      expect.any(Function),
      expect.any(Function),
    );
  });

  it("defaults to sign-in mode and clears any existing error when toggling", () => {
    const { result } = renderHook(() => useAuthPage());

    expect(result.current.signIn).toBe(true);

    act(() => result.current.handleToggle(false));
    expect(result.current.signIn).toBe(false);
    expect(result.current.error).toBe("");
  });

  it("scrolls to the auth form card when toggling sections", () => {
    const handleToggle = vi.fn();
    const scrollIntoView = vi.fn();
    vi.spyOn(document, "getElementById").mockReturnValue({ scrollIntoView });

    const { result } = renderHook(() => useAuthPageScroll(handleToggle));
    act(() => result.current.showSignIn());
    act(() => result.current.showSignUp());

    expect(handleToggle).toHaveBeenCalledWith(true);
    expect(handleToggle).toHaveBeenCalledWith(false);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it("memoizes landing section data", () => {
    buildAuthLandingSectionsMock.mockReturnValue(["section"]);
    const state = { signIn: true };
    const actions = { onToggle: vi.fn() };
    const { result } = renderHook(() => useAuthLandingSections(state, actions));
    expect(result.current).toEqual(["section"]);
    expect(buildAuthLandingSectionsMock).toHaveBeenCalled();
  });
});
