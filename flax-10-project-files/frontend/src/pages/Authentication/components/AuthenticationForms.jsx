/*
 * Combined sign-in and sign-up card content.
 */

import styles from "../AuthenticationPage.module.css";
import * as Components from "../../../components/Authentication/AuthenticationComponents";
import { ErrorMessage } from "../../../components/Authentication/ErrorMessage";
import { AuthOverlay } from "../../../components/Authentication/Overlay";
import { SignInForm } from "../../../components/Authentication/SignInForm";
import { SignUpForm } from "../../../components/Authentication/SignUpForm";

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
