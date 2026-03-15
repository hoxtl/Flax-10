import * as Components from "../Authentication/AuthComponents";
import PasswordStrength from "../common/PasswordStrength";

function SignUpFields({ formData, updateField, loading }) {
  return (
    <Components.FieldStack>
      <Components.FieldRow>
        <Components.Input
          type="text"
          placeholder="First Name"
          value={formData.first_name}
          onChange={updateField("first_name")}
          required
          disabled={loading}
        />
        <Components.Input
          type="text"
          placeholder="Last Name"
          value={formData.last_name}
          onChange={updateField("last_name")}
          required
          disabled={loading}
        />
      </Components.FieldRow>

      <Components.Input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={updateField("username")}
        required
        disabled={loading}
      />
      <Components.Input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={updateField("email")}
        required
        disabled={loading}
      />

      <Components.Input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={updateField("password")}
        required
        minLength={8}
        disabled={loading}
      />

      <PasswordStrength password={formData.password} />

      <Components.Input
        type="password"
        placeholder="Confirm Password"
        value={formData.password2}
        onChange={updateField("password2")}
        required
        minLength={8}
        disabled={loading}
      />
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

export const SignUpForm = ({ signIn, formData, updateField, onSubmit, loading, onToggle }) => (
  <Components.SignUpContainer $signIn={signIn}>
    <Components.Form onSubmit={onSubmit}>
      <Components.Title>Create Account</Components.Title>
      <SignUpFields formData={formData} updateField={updateField} loading={loading} />
      <SignUpActions loading={loading} onToggle={onToggle} />
    </Components.Form>
  </Components.SignUpContainer>
);
