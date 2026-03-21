import { authService } from "../../../api/authApi";
import {
  validatePasswords,
  getErrorMessage,
  saveUserData,
} from "../../../components/Authentication/utils/authHelpers";

async function tryRegister(signUpData) {
  try {
    return await authService.register(signUpData);
  } catch {
    return null;
  }
}

async function tryLogin(signInData) {
  try {
    return await authService.login(signInData);
  } catch {
    return null;
  }
}

async function handleAuthResult(result, setError, setLoading, getErrMsg) {
  if (!result) {
    setError("There has been an error, please try again...");
    setLoading(false);
    return;
  }
  if (result.response.ok) {
    await new Promise((r) => setTimeout(r, 180));
    saveUserData(result.data.token, result.data.user);
  } else setError(getErrMsg(result.data));
  setLoading(false);
}

export async function submitSignUp(signUpData, setError, setLoading) {
  const passwordError = validatePasswords(
    signUpData.password,
    signUpData.password2,
  );
  if (passwordError) return setError(passwordError);
  setLoading(true);
  await handleAuthResult(
    await tryRegister(signUpData),
    setError,
    setLoading,
    getErrorMessage,
  );
}

export async function submitSignIn(signInData, setError, setLoading) {
  setLoading(true);
  const result = await tryLogin(signInData);
  if (!result) {
    setError("There has been an error, please try again...");
    setLoading(false);
    return;
  }
  if (result.response.status === 403 && result.data?.is_banned) {
    localStorage.setItem("banned", "1");
    localStorage.setItem("ban_reason", result.data.ban_reason || "");
    window.dispatchEvent(new Event("auth-changed"));
    setLoading(false);
    return;
  }
  const getMsg = (d) => d?.error || "Invalid username or password";
  await handleAuthResult(result, setError, setLoading, getMsg);
}
