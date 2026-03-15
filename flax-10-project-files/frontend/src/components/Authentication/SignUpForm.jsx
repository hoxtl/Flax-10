import * as Components from "../Authentication/AuthComponents";

const SIGNUP_FIELDS = [
  { name: "first_name", type: "text", placeholder: "First Name" },
  { name: "last_name", type: "text", placeholder: "Last Name" },
  { name: "username", type: "text", placeholder: "Username" },
  { name: "email", type: "email", placeholder: "Email" },
  { name: "password", type: "password", placeholder: "Password", minLength: 8 },
  { name: "password2", type: "password", placeholder: "Confirm Password", minLength: 8 },
];

function SignUpFields({ formData, updateField, loading }) {
  return SIGNUP_FIELDS.map((field) => (
    <Components.Input
      key={field.name}
      type={field.type}
      placeholder={field.placeholder}
      value={formData[field.name]}
      onChange={updateField(field.name)}
      required
      minLength={field.minLength}
      disabled={loading}
    />
  ));
}

function SignUpActions({ loading, onToggle }) {
  return (
    <>
      <div style={{ height: "16px" }} />
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
      <div style={{ height: "12px" }} />
      <SignUpFields formData={formData} updateField={updateField} loading={loading} />
      <SignUpActions loading={loading} onToggle={onToggle} />
    </Components.Form>
  </Components.SignUpContainer>
);