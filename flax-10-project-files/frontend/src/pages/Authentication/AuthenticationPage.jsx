/*
 * Authentication landing page.
 */

import styles from "./AuthenticationPage.module.css";
import { useAuthPage } from "./hooks/useAuthenticationPage";
import { useAuthPageScroll } from "./hooks/useAuthenticationPageScroll";
import { useAuthLandingSections } from "./hooks/useAuthenticationLandingSections";
import { AuthFooter } from "../../components/Authentication/AuthenticationBranding";
import StudyFlaxLandingPage from "../../components/ui/landing-page";
import { PageTransition } from "../../components/common";

export default function AuthPage({ initialSignIn = true }) {
  const state = useAuthPage(initialSignIn);
  const scrollActions = useAuthPageScroll(state.handleToggle);
  const landingSections = useAuthLandingSections(state, scrollActions);

  return (
    <PageTransition>
      <div className={styles.pageWrap}>
        <StudyFlaxLandingPage sections={landingSections} />
        <div className={styles.formFooter}>
          <AuthFooter absolute />
        </div>
      </div>
    </PageTransition>
  );
}
