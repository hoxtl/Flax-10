/*
 * Combined sign-in and sign-up card content.
 */

import styles from "../styles/AuthPage.module.css";
import * as Components from "../../../components/Auth/AuthComponents";
import { ErrorMessage } from "../../../components/Auth/ErrorMessage";
import { AuthOverlay } from "../../../components/Auth/Overlay";
import { SignInForm } from "../../../components/Auth/SignInForm";
import { SignUpForm } from "../../../components/Auth/SignUpForm";

export function AuthForms(props) {
  const commonProps = {
    signIn: props.signIn,
    loading: props.loading,
    onToggle: props.handleToggle,
  };

  return (
    <div id="auth-form-card" className={styles.authFormCard}>
      <div className={styles.authPanelCard}>
        <Components.Container>
          <ErrorMessage error={props.error} />
          <SignUpForm {...commonProps} formData={props.signUpData} updateField={props.updateSignUpField} onSubmit={props.handleSignUp} />
          <SignInForm {...commonProps} formData={props.signInData} updateField={props.updateSignInField} onSubmit={props.handleSignIn} />
          <AuthOverlay signIn={props.signIn} onToggle={props.handleToggle} />
        </Components.Container>
      </div>
    </div>
  );
}
