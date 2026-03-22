/*
 * Async submit helpers for auth page actions.
 */

import { authService } from "../../../api/authApi";
import {
  getErrorMessage,
  saveUserData,
  validatePasswords,
} from "../../../components/Authentication/utils/authHelpers";

async function tryRequest(requestAction, payload) {
  try {
    return await requestAction(payload);
  } catch {
    return null;
  }
}

function finishAuthState(setLoading, setError, error = "") {
  if (error) setError(error);
  setLoading(false);
}

async function handleAuthResult(result, setError, setLoading, getErrMsg) {
  if (!result) {
    finishAuthState(setLoading, setError, "There has been an error, please try again...");
    return;
  }

  if (result.response.ok) {
    await new Promise((r) => setTimeout(r, 180));
    saveUserData(result.data.token, result.data.user);
    finishAuthState(setLoading, setError);
    return;
  }

  finishAuthState(setLoading, setError, getErrMsg(result.data));
}

export async function submitSignUp(signUpData, setError, setLoading) {
  const passwordError = validatePasswords(
    signUpData.password,
    signUpData.password2,
  );
  if (passwordError) return setError(passwordError);
  setLoading(true);
  await handleAuthResult(
    await tryRequest(authService.register, signUpData),
    setError,
    setLoading,
    getErrorMessage,
  );
}

export async function submitSignIn(signInData, setError, setLoading) {
  setLoading(true);
  const result = await tryRequest(authService.login, signInData);

  if (!result) {
    finishAuthState(setLoading, setError, "There has been an error, please try again...");
    return;
  }

  if (result.response.status === 403 && result.data?.is_banned) {
    localStorage.setItem("banned", "1");
    localStorage.setItem("ban_reason", result.data.ban_reason || "");
    window.dispatchEvent(new Event("auth-changed"));
    finishAuthState(setLoading, setError);
    return;
  }

  const getMsg = (d) => d?.error || "Invalid username or password";
  await handleAuthResult(result, setError, setLoading, getMsg);
}
