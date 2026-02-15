import React, { useState } from "react";
import * as Components from "../components/Authentication/AuthComponents";
import { SignUpForm } from "../components/Authentication/SignUpForm";
import { SignInForm } from "../components/Authentication/SignInForm";
import { AuthOverlay } from "../components/Authentication/Overlay";
import { ErrorMessage } from "../components/Authentication/ErrorMessage";
import { useAuthForm } from "../hooks/useAuthForm";
import { authService } from "../api/authService";
import {
  validatePasswords,
  getErrorMessage,
  saveUserData,
} from "../utils/authHelpers";
import AuthHeroGeometric from "../components/Authentication/AuthHeroGeometric";

export default function AuthPage() {
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");

    const passwordError = validatePasswords(
      signUpData.password,
      signUpData.password2
    );
    if (passwordError) return setError(passwordError);

    setLoading(true);
    try {
      const { response, data } = await authService.register(signUpData);

      if (response.ok) {
        await new Promise((r) => setTimeout(r, 180));
        saveUserData(data.token, data.user); 
      } else {
        setError(getErrorMessage(data));
      }
    } catch {
      setError("There has been an error, please try again...");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { response, data } = await authService.login(signInData);

      if (response.ok) {
        await new Promise((r) => setTimeout(r, 180));
        saveUserData(data.token, data.user);
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch {
      setError("There has been an error, please try again...");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <AuthHeroGeometric />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Components.Container>
          <ErrorMessage error={error} />

          <SignUpForm
            signIn={signIn}
            formData={signUpData}
            updateField={updateSignUpField}
            onSubmit={handleSignUp}
            loading={loading}
          />

          <SignInForm
            signIn={signIn}
            formData={signInData}
            updateField={updateSignInField}
            onSubmit={handleSignIn}
            loading={loading}
          />

          <AuthOverlay
            signIn={signIn}
            onToggle={(isSignIn) => {
              toggle(isSignIn);
              setError("");
            }}
          />
        </Components.Container>
      </div>
    </div>
  );
}
