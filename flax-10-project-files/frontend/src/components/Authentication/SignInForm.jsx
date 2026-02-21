import React from "react";
import * as Components from "../Authentication/AuthComponents";

export const SignInForm = ({
  signIn,
  formData,
  updateField,
  onSubmit,
  loading,
  onToggle,
}) => {
  return (
    <Components.SignInContainer $signIn={signIn}>
      <Components.Form onSubmit={onSubmit}>
        <Components.Title>Sign in</Components.Title>

        <Components.Input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={updateField("username")}
          required
          disabled={loading}
        />

        <Components.Input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={updateField("password")}
          required
          disabled={loading}
        />

        <div style={{ height: "12px" }} />

        <Components.Button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Components.Button>

        <Components.PasswordResetLink to="/reset-password">
          Forgot password?
        </Components.PasswordResetLink>

        <Components.MobileToggleButton>
          Don't have an account?
          <span onClick={() => onToggle(false)}>Sign Up</span>
        </Components.MobileToggleButton>
      </Components.Form>
    </Components.SignInContainer>
  );
};
