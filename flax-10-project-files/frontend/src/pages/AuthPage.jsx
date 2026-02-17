import React, { useState } from "react";
import * as Components from "../components/Authentication/AuthComponents";
import { SignUpForm } from "../components/Authentication/SignUpForm";
import { SignInForm } from "../components/Authentication/SignInForm";
import { AuthOverlay } from "../components/Authentication/Overlay";
import { ErrorMessage } from "../components/Authentication/ErrorMessage";
import { useAuthForm } from "../hooks/useAuthForm";
import { authService } from "../api/authService";
import { validatePasswords, getErrorMessage, saveUserData } from "../utils/authHelpers";
import AuthHeroGeometric from "../components/Authentication/AuthHeroGeometric";

function AuthBrand() {
  return (
    <div style={{ position: "absolute", top: 18, left: 20, zIndex: 3, userSelect: "none", pointerEvents: "none" }}>
      <div style={{ fontSize: 12, letterSpacing: "0.34em", fontWeight: 800, color: "rgba(43,30,20,0.62)" }}>
        STUDYFLAX
      </div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, letterSpacing: "0.02em", color: "rgba(43,30,20,0.42)" }}>
        Built for calm study.
      </div>
    </div>
  );
}

function AuthFooter() {
  return (
    <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, zIndex: 3, textAlign: "center", fontSize: 12, color: "rgba(10,7,5,0.45)", userSelect: "none", pointerEvents: "none" }}>
      Always secure. No ads. Free forever.
    </div>
  );
}

function AuthBackground() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 35%, rgba(240,237,232,0.0), rgba(240,237,232,0.55))", zIndex: 0 }} />
  );
}

async function tryRegister(signUpData) {
  try { return await authService.register(signUpData); }
  catch { return null; }
}

async function tryLogin(signInData) {
  try { return await authService.login(signInData); }
  catch { return null; }
}

async function submitSignUp(signUpData, setError, setLoading) {
  const passwordError = validatePasswords(signUpData.password, signUpData.password2);
  if (passwordError) return setError(passwordError);
  setLoading(true);
  const result = await tryRegister(signUpData);
  if (!result) { setError("There has been an error, please try again..."); setLoading(false); return; }
  if (result.response.ok) { await new Promise((r) => setTimeout(r, 180)); saveUserData(result.data.token, result.data.user); }
  else setError(getErrorMessage(result.data));
  setLoading(false);
}

async function submitSignIn(signInData, setError, setLoading) {
  setLoading(true);
  const result = await tryLogin(signInData);
  if (!result) { setError("There has been an error, please try again..."); setLoading(false); return; }
  if (result.response.ok) { await new Promise((r) => setTimeout(r, 180)); saveUserData(result.data.token, result.data.user); }
  else setError(result.data.error || "Invalid username or password");
  setLoading(false);
}

function useAuthPage() {
  const [signIn, toggle] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { formData: signUpData, updateField: updateSignUpField } = useAuthForm({ first_name: "", last_name: "", username: "", email: "", password: "", password2: "" });
  const { formData: signInData, updateField: updateSignInField } = useAuthForm({ username: "", password: "" });
  const handleSignUp = (e) => { e.preventDefault(); setError(""); submitSignUp(signUpData, setError, setLoading); };
  const handleSignIn = (e) => { e.preventDefault(); setError(""); submitSignIn(signInData, setError, setLoading); };
  const handleToggle = (isSignIn) => { toggle(isSignIn); setError(""); };
  return { signIn, error, loading, signUpData, updateSignUpField, signInData, updateSignInField, handleSignUp, handleSignIn, handleToggle };
}

function AuthForms({ signIn, error, loading, signUpData, updateSignUpField, signInData, updateSignInField, handleSignUp, handleSignIn, handleToggle }) {
  return (
    <Components.Container>
      <ErrorMessage error={error} />
      <SignUpForm signIn={signIn} formData={signUpData} updateField={updateSignUpField} onSubmit={handleSignUp} loading={loading} />
      <SignInForm signIn={signIn} formData={signInData} updateField={updateSignInField} onSubmit={handleSignIn} loading={loading} />
      <AuthOverlay signIn={signIn} onToggle={handleToggle} />
    </Components.Container>
  );
}

export default function AuthPage() {
  const state = useAuthPage();
  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <AuthHeroGeometric />
      <AuthBackground />
      <AuthBrand />
      <AuthFooter />
      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <AuthForms {...state} />
      </div>
    </div>
  );
}