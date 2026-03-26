<<<<<<< HEAD
/*
 * Async submit helpers for auth page actions.
 */

import { authService } from "../../../api/authApi";
import {
  getErrorMessage,
  saveUserData,
  validatePasswords,
} from "../../../components/Auth/utils/authHelpers";

async function tryRequest(requestAction, payload) {
  try {
    return await requestAction(payload);
=======
import { authService } from "../../../api/authApi";
import {
  validatePasswords,
  getErrorMessage,
  saveUserData,
} from "../../../components/Authentication/utils/authHelpers";

async function tryRegister(signUpData) {
  try {
    return await authService.register(signUpData);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  } catch {
    return null;
  }
}

<<<<<<< HEAD
function finishAuthState(setLoading, setError, error = "") {
  if (error) setError(error);
  setLoading(false);
=======
async function tryLogin(signInData) {
  try {
    return await authService.login(signInData);
  } catch {
    return null;
  }
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
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
<<<<<<< HEAD
    await tryRequest(authService.register, signUpData),
=======
    await tryRegister(signUpData),
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    setError,
    setLoading,
    getErrorMessage,
  );
}

export async function submitSignIn(signInData, setError, setLoading) {
  setLoading(true);
<<<<<<< HEAD
  const result = await tryRequest(authService.login, signInData);

  if (!result) {
    finishAuthState(setLoading, setError, "There has been an error, please try again...");
    return;
  }

=======
  const result = await tryLogin(signInData);
  if (!result) {
    setError("There has been an error, please try again...");
    setLoading(false);
    return;
  }
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  if (result.response.status === 403 && result.data?.is_banned) {
    localStorage.setItem("banned", "1");
    localStorage.setItem("ban_reason", result.data.ban_reason || "");
    window.dispatchEvent(new Event("auth-changed"));
<<<<<<< HEAD
    finishAuthState(setLoading, setError);
    return;
  }

=======
    setLoading(false);
    return;
  }
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  const getMsg = (d) => d?.error || "Invalid username or password";
  await handleAuthResult(result, setError, setLoading, getMsg);
}
