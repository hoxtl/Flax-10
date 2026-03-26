/*
 * Shared hero page shell for password reset screens.
 */

import styles from "./PasswordReset.module.css";
import AuthHeroGeometric from "../../components/Auth/AuthHeroGeometric";
import { AuthBrand, AuthFooter } from "../../components/Auth/AuthBranding";
import { PageTransition } from "../../components/common";

export default function PasswordResetPageLayout({ children }) {
  return (
    <PageTransition>
      <div className={styles.heroPage}>
        <AuthHeroGeometric />
        <div aria-hidden="true" className={styles.heroOverlay} />
        <AuthBrand />
        <AuthFooter absolute />
        <div className={styles.centerContent}>{children}</div>
      </div>
    </PageTransition>
  );
}
