/*
 * Auth page state and submit handlers.
 */

import { useState } from "react";
import { useAuthForm } from "../../../components/auth/hooks/useAuthForm";
import { submitSignIn, submitSignUp } from "../utils/authSubmitHandlers";

const SIGNUP_DEFAULTS = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  password2: "",
};

const SIGNIN_DEFAULTS = { username: "", password: "" };

function useAuthFormData() {
  const signUpForm = useAuthForm(SIGNUP_DEFAULTS);
  const signInForm = useAuthForm(SIGNIN_DEFAULTS);

  return {
    signUpData: signUpForm.formData,
    updateSignUpField: signUpForm.updateField,
    signInData: signInForm.formData,
    updateSignInField: signInForm.updateField,
  };
}

function createSubmitHandler(action, payload, setError, setLoading) {
  return (event) => {
    event.preventDefault();
    setError("");
    action(payload, setError, setLoading);
  };
}

function useAuthHandlers(signUpData, signInData, setError, setLoading, toggle) {
  const handleSignUp = createSubmitHandler(
    submitSignUp,
    signUpData,
    setError,
    setLoading,
  );
  const handleSignIn = createSubmitHandler(
    submitSignIn,
    signInData,
    setError,
    setLoading,
  );
  const handleToggle = (isSignIn) => {
    toggle(isSignIn);
    setError("");
  };

  return { handleSignUp, handleSignIn, handleToggle };
}

export function useAuthPage(initialSignIn = true) {
  const [signIn, toggle] = useState(initialSignIn);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUpData, updateSignUpField, signInData, updateSignInField } = useAuthFormData();
  const handlers = useAuthHandlers(signUpData, signInData, setError, setLoading, toggle);
<<<<<<< HEAD

  return {
    signIn,
    error,
    loading,
    signUpData,
    updateSignUpField,
    signInData,
    updateSignInField,
    ...handlers,
  };
=======
  return { signIn, error, loading, signUpData, updateSignUpField, signInData, updateSignInField, ...handlers };
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
