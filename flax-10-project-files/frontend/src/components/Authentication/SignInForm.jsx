/*
 * Sign-in form for the authentication page.
 */

import * as Components from "./AuthComponents";
import { AuthInputField } from "./AuthInputField";

function SignInFields({ formData, updateField, loading }) {
  return (
    <>
      <AuthInputField type="text" placeholder="Username" value={formData.username} onChange={updateField("username")} disabled={loading} />
      <AuthInputField type="password" placeholder="Password" value={formData.password} onChange={updateField("password")} disabled={loading} />
    </>
  );
}

function SignInActions({ loading, onToggle }) {
  return (
    <>
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
    </>
  );
}

export function SignInForm(props) {
  return (
    <Components.SignInContainer $signIn={props.signIn}>
      <Components.Form onSubmit={props.onSubmit}>
        <Components.Title>Sign in</Components.Title>
        <SignInFields formData={props.formData} updateField={props.updateField} loading={props.loading} />
        <SignInActions loading={props.loading} onToggle={props.onToggle} />
      </Components.Form>
    </Components.SignInContainer>
  );
}
