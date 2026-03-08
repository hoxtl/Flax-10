import * as Components from "../Authentication/AuthComponents";

function SignInFields({ formData, updateField, loading }) {
  return (
    <>
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
    </>);}

export const SignInForm = ({ signIn, formData, updateField, onSubmit, loading, onToggle }) => (
  <Components.SignInContainer $signIn={signIn}>
    <Components.Form onSubmit={onSubmit}>
      <Components.Title>Sign in</Components.Title>
      <SignInFields formData={formData} updateField={updateField} loading={loading} />
      <SignInActions loading={loading} onToggle={onToggle} />
    </Components.Form>
  </Components.SignInContainer>
);