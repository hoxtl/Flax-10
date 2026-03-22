/*
 * Sign-up form for the authentication page.
 */

import * as Components from "./AuthComponents";
import PasswordStrength from "../common/PasswordStrength";
import { AuthInputField } from "./AuthInputField";

function NameRow({ formData, updateField, loading }) {
  return (
    <Components.FieldRow>
      <AuthInputField type="text" placeholder="First Name" value={formData.first_name} onChange={updateField("first_name")} disabled={loading} />
      <AuthInputField type="text" placeholder="Last Name" value={formData.last_name} onChange={updateField("last_name")} disabled={loading} />
    </Components.FieldRow>
  );
}

function CredentialInputs({ formData, updateField, loading }) {
  return (
    <>
      <AuthInputField type="text" placeholder="Username" value={formData.username} onChange={updateField("username")} disabled={loading} />
      <AuthInputField type="email" placeholder="Email" value={formData.email} onChange={updateField("email")} disabled={loading} />
    </>
  );
}

function PasswordInputs({ formData, updateField, loading }) {
  return (
    <>
      <AuthInputField type="password" placeholder="Password" value={formData.password} onChange={updateField("password")} minLength={8} disabled={loading} />
      <PasswordStrength password={formData.password} />
      <AuthInputField type="password" placeholder="Confirm Password" value={formData.password2} onChange={updateField("password2")} minLength={8} disabled={loading} />
    </>
  );
}

function SignUpFields({ formData, updateField, loading }) {
  return (
    <Components.FieldStack>
      <NameRow formData={formData} updateField={updateField} loading={loading} />
      <CredentialInputs formData={formData} updateField={updateField} loading={loading} />
      <PasswordInputs formData={formData} updateField={updateField} loading={loading} />
    </Components.FieldStack>
  );
}

function SignUpActions({ loading, onToggle }) {
  return (
    <>
      <div style={{ height: "6px" }} />
      <Components.Button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
      </Components.Button>
      <Components.MobileToggleButton>
        Already have an account?
        <span onClick={() => onToggle(true)}>Sign In</span>
      </Components.MobileToggleButton>
    </>
  );
}

export function SignUpForm(props) {
  return (
    <Components.SignUpContainer $signIn={props.signIn}>
      <Components.Form onSubmit={props.onSubmit}>
        <Components.Title>Create Account</Components.Title>
        <SignUpFields formData={props.formData} updateField={props.updateField} loading={props.loading} />
        <SignUpActions loading={props.loading} onToggle={props.onToggle} />
      </Components.Form>
    </Components.SignUpContainer>
  );
}
