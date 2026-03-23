/*
 * Authentication landing page.
 */

import styles from "./AuthPage.module.css";
import { useAuthPage } from "./hooks/useAuthPage";
import { useAuthPageScroll } from "./hooks/useAuthPageScroll";
import { useAuthLandingSections } from "./hooks/useAuthLandingSections";
import { AuthFooter } from "../../components/Authentication/AuthBranding";
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
