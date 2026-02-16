import React, { useState } from "react";
import * as Components from "../components/Authentication/AuthComponents";
import { SignUpForm } from "../components/Authentication/SignUpForm";
import { SignInForm } from "../components/Authentication/SignInForm";
import { AuthOverlay } from "../components/Authentication/Overlay";
import { ErrorMessage } from "../components/Authentication/ErrorMessage";
import { useAuthForm } from "../components/Authentication/hooks/useAuthForm";
import { authService } from "../api/authService";
import {
  validatePasswords,
  getErrorMessage,
  saveUserData,
} from "../components/Authentication/utils/authHelpers";
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

  function AuthBrand() {
    return (
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 20,
          zIndex: 3,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.34em",
            fontWeight: 800,
            color: "rgba(43,30,20,0.62)",
          }}
        >
          STUDYFLAX
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: "rgba(43,30,20,0.42)",
          }}
        >
          Built for calm study.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <AuthHeroGeometric />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 35%, rgba(240,237,232,0.0), rgba(240,237,232,0.55))",
          zIndex: 0,
        }}
      />

      <AuthBrand />

      <div
        style={{
          position: "absolute",
          bottom: 18,
          left: 0,
          right: 0,
          zIndex: 3,
          textAlign: "center",
          fontSize: 12,
          color: "rgba(10,7,5,0.45)",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        Always secure. No ads. Free forever.
      </div>

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
