import React, { useState } from "react";
import * as Components from "../../components/Authentication/AuthComponents";
import { SignUpForm } from "../../components/Authentication/SignUpForm";
import { SignInForm } from "../../components/Authentication/SignInForm";
import { AuthOverlay } from "../../components/Authentication/Overlay";
import { ErrorMessage } from "../../components/Authentication/ErrorMessage";
import { useAuthForm } from "../../components/Authentication/hooks/useAuthForm";
import { authService } from "../../api/authService";
import { validatePasswords, getErrorMessage, saveUserData } from "../../components/Authentication/utils/authHelpers";
import AuthHeroGeometric from "../../components/Authentication/AuthHeroGeometric";
import { TestimonialsMarquee } from "../../components/Authentication/TestimonialsMarquee";
import {
  AuthBrand,
  AuthFooter,
} from "../../components/Authentication/AuthBranding";

const pageStyle = {
  height: "100vh",
  width: "100vw",
  background: "#f0ede8",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  position: "relative",
};

const formWrapStyle = {
  flex: "1 1 0",
  minHeight: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2,
  padding: "40px 24px 8px",
};

function AuthBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background:
          "radial-gradient(circle at 50% 35%, rgba(240,237,232,0.0), rgba(240,237,232,0.55))",
      }}
    />
  );
}

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

async function submitSignUp(signUpData, setError, setLoading) {
  const passwordError = validatePasswords(
    signUpData.password,
    signUpData.password2,
  );
  if (passwordError) return setError(passwordError);
  setLoading(true);
  const result = await tryRegister(signUpData);
  if (!result) {
    setError("There has been an error, please try again...");
    setLoading(false);
    return;
  }
  if (result.response.ok) {
    await new Promise((r) => setTimeout(r, 180));
    saveUserData(result.data.token, result.data.user);
  } else setError(getErrorMessage(result.data));
  setLoading(false);
}

async function submitSignIn(signInData, setError, setLoading) {
  setLoading(true);
  const result = await tryLogin(signInData);
  if (!result) {
    setError("There has been an error, please try again...");
    setLoading(false);
    return;
  }
  if (result.response.ok) {
    await new Promise((r) => setTimeout(r, 180));
    saveUserData(result.data.token, result.data.user);
  } else setError(result.data.error || "Invalid username or password");
  setLoading(false);
}

function useAuthPage() {
  const [signIn, toggle] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { formData: signUpData, updateField: updateSignUpField } = useAuthForm({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: "",
    password2: "",
  });
  const { formData: signInData, updateField: updateSignInField } = useAuthForm({
    username: "",
    password: "",
  });
  const handleSignUp = (e) => {
    e.preventDefault();
    setError("");
    submitSignUp(signUpData, setError, setLoading);
  };
  const handleSignIn = (e) => {
    e.preventDefault();
    setError("");
    submitSignIn(signInData, setError, setLoading);
  };
  const handleToggle = (isSignIn) => {
    toggle(isSignIn);
    setError("");
  };
  return {
    signIn,
    error,
    loading,
    signUpData,
    updateSignUpField,
    signInData,
    updateSignInField,
    handleSignUp,
    handleSignIn,
    handleToggle,
  };
}

function AuthForms({
  signIn,
  error,
  loading,
  signUpData,
  updateSignUpField,
  signInData,
  updateSignInField,
  handleSignUp,
  handleSignIn,
  handleToggle,
}) {
  return (
    <Components.Container>
      <ErrorMessage error={error} />
      <SignUpForm
        signIn={signIn}
        formData={signUpData}
        updateField={updateSignUpField}
        onSubmit={handleSignUp}
        loading={loading}
        onToggle={handleToggle} // Add this
      />
      <SignInForm
        signIn={signIn}
        formData={signInData}
        updateField={updateSignInField}
        onSubmit={handleSignIn}
        loading={loading}
        onToggle={handleToggle} // Add this
      />
      <AuthOverlay signIn={signIn} onToggle={handleToggle} />
    </Components.Container>
  );
}

function AuthFormSection({ state }) {
  return (
    <div style={formWrapStyle}>
      <AuthForms {...state} />
    </div>
  );
}

function AuthTestimonialsSection() {
  return (
    <div style={{ flexShrink: 0, zIndex: 1 }}>
      <TestimonialsMarquee />
      <AuthFooter />
    </div>
  );
}

export default function AuthPage() {
  const state = useAuthPage();
  return (
    <div style={pageStyle}>
      <AuthHeroGeometric />
      <AuthBackground />
      <AuthBrand />
      <AuthFormSection state={state} />
      <AuthTestimonialsSection />
    </div>
  );
}
