import { useState } from "react";
import { useAuthForm } from "../../../components/Authentication/hooks/useAuthForm";
import { submitSignUp, submitSignIn } from "../utils/authSubmitHandlers";

const SIGNUP_DEFAULTS = { first_name: "", last_name: "", username: "", email: "", password: "", password2: "" };
const SIGNIN_DEFAULTS = { username: "", password: "" };

function useAuthFormData() {
  const { formData: signUpData, updateField: updateSignUpField } = useAuthForm(SIGNUP_DEFAULTS);
  const { formData: signInData, updateField: updateSignInField } = useAuthForm(SIGNIN_DEFAULTS);
  return { signUpData, updateSignUpField, signInData, updateSignInField };
}

function useAuthHandlers(signUpData, signInData, setError, setLoading, toggle) {
  const handleSignUp = (e) => { e.preventDefault(); setError(""); submitSignUp(signUpData, setError, setLoading); };
  const handleSignIn = (e) => { e.preventDefault(); setError(""); submitSignIn(signInData, setError, setLoading); };
  const handleToggle = (isSignIn) => { toggle(isSignIn); setError(""); };
  return { handleSignUp, handleSignIn, handleToggle };
}

export function useAuthPage(initialSignIn = true) {
  const [signIn, toggle] = useState(initialSignIn);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpData, updateSignUpField, signInData, updateSignInField } = useAuthFormData();
  const handlers = useAuthHandlers(signUpData, signInData, setError, setLoading, toggle);
  return { signIn, error, loading, signUpData, updateSignUpField, signInData, updateSignInField, ...handlers };
}
