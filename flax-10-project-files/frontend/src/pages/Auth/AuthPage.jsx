import * as Components from "../../components/Authentication/AuthComponents";
import { SignUpForm } from "../../components/Authentication/SignUpForm";
import { SignInForm } from "../../components/Authentication/SignInForm";
import { AuthOverlay } from "../../components/Authentication/Overlay";
import { ErrorMessage } from "../../components/Authentication/ErrorMessage";
import AuthHeroGeometric from "../../components/Authentication/AuthHeroGeometric";
import { TestimonialsMarquee } from "../../components/Authentication/TestimonialsMarquee";
import { AuthBrand, AuthFooter } from "../../components/Authentication/AuthBranding";
import { useAuthPage } from "./hooks/useAuthPage";

const pageStyle = { height: "100vh", width: "100vw", background: "#f0ede8", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" };
const formWrapStyle = { flex: "1 1 0", minHeight: 0, display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2, padding: "40px 24px 8px" };

function AuthBackground() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, background: "radial-gradient(circle at 50% 35%, rgba(240,237,232,0.0), rgba(240,237,232,0.55))" }} />
  );
}

function AuthForms({ signIn, error, loading, signUpData, updateSignUpField, signInData, updateSignInField, handleSignUp, handleSignIn, handleToggle }) {
  const commonProps = { signIn, loading, onToggle: handleToggle };
  return (
    <Components.Container>
      <ErrorMessage error={error} />
      <SignUpForm {...commonProps} formData={signUpData} updateField={updateSignUpField} onSubmit={handleSignUp} />
      <SignInForm {...commonProps} formData={signInData} updateField={updateSignInField} onSubmit={handleSignIn} />
      <AuthOverlay signIn={signIn} onToggle={handleToggle} />
    </Components.Container>
  );
}

function AuthFormSection({ state }) {
  return <div style={formWrapStyle}><AuthForms {...state} /></div>;
}

function AuthTestimonialsSection() {
  return <div style={{ flexShrink: 0, zIndex: 1 }}><TestimonialsMarquee /><AuthFooter /></div>;
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