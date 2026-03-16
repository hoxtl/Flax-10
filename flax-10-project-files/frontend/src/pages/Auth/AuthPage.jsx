import { useAuthPage } from "./hooks/useAuthPage";
import { useCallback, useMemo } from "react";
import StudyFlaxLandingPage from "../../components/ui/landing-page";
import styles from "./AuthPage.module.css";
import * as Components from "../../components/Authentication/AuthComponents";
import { SignUpForm } from "../../components/Authentication/SignUpForm";
import { SignInForm } from "../../components/Authentication/SignInForm";
import { AuthOverlay } from "../../components/Authentication/Overlay";
import { ErrorMessage } from "../../components/Authentication/ErrorMessage";
import { AuthFooter } from "../../components/Authentication/AuthBranding";
import { TestimonialsMarquee } from "../../components/Authentication/TestimonialsMarquee";
import { PageTransition } from "../../components/common";

function AuthForms({
  signIn,
  error,
  loading,
  signUpData,
  updateSignUpField,
  signInData,
  updateSignInField,
  handleSignUp,
  handleSignIn,
  handleToggle,
}) {
  const commonProps = { signIn, loading, onToggle: handleToggle };

  return (
    <div className={styles.authPanelCard}>
      <Components.Container>
        <ErrorMessage error={error} />
        <SignUpForm
          {...commonProps}
          formData={signUpData}
          updateField={updateSignUpField}
          onSubmit={handleSignUp}
        />
        <SignInForm
          {...commonProps}
          formData={signInData}
          updateField={updateSignInField}
          onSubmit={handleSignIn}
        />
        <AuthOverlay signIn={signIn} onToggle={handleToggle} />
      </Components.Container>
    </div>
  );
}

export default function AuthPage({ initialSignIn = true }) {
  const state = useAuthPage(initialSignIn);
  const scrollToFormCard = useCallback(() => {
    const formCard = document.getElementById("auth-form-card");
    if (formCard) {
      formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const showSignIn = useCallback(() => {
    state.handleToggle(true);
    scrollToFormCard();
  }, [state.handleToggle, scrollToFormCard]);

  const showSignUp = useCallback(() => {
    state.handleToggle(false);
    scrollToFormCard();
  }, [state.handleToggle, scrollToFormCard]);

  const showAuthForm = useCallback(
    (shouldSignIn) => {
      if (shouldSignIn) {
        showSignIn();
      } else {
        showSignUp();
      }
    },
    [showSignIn, showSignUp],
  );

  const landingSections = useMemo(
    () => [
      {
        id: "hero",
        badge: "Study Flax",
        title: "StudyFlax",
        subtitle: "Built for calm study.",
        pills: ["Calendar", "Tasks", "Deadlines", "Group Study", "Uni Map"],
        description: (
          <>
            Study Flax helps{" "}
            <span className={styles.kclAccent}>
              King&apos;s College London
            </span>{" "}
            students and teachers manage their time with one calm workflow for deadlines, tasks,
            modules, lectures, and focus sessions.
          </>
        ),
        align: "left",
        actions: [
          { label: "Begin Journey", variant: "primary", onClick: () => showAuthForm(true) },
        ],
      },
      {
        id: "features",
        badge: "Workflows",
        title: "Command your academic week",
        description:
          "Keep deadlines, lectures, and focus blocks in one calm, clear workflow.",
        features: [
          {
            title: "Tasks & Priorities",
            description:
              "Turn long to-dos into clear priorities with due dates, importance levels, and progress.",
          },
          {
            title: "Modules",
            description:
              "Keep each module's assessments and revision work visible in one place.",
          },
          {
            title: "Focus Timer",
            description:
              "Use focused study sessions to protect momentum when assignments build up.",
          },
          {
            title: "Calendar",
            description:
              "Coordinate deadlines, lectures, and commitments from one timeline.",
          },
        ],
      },
      {
        id: "glimpse",
        badge: "Product Glimpse",
        title: "Built for how you work at KCL",
        subtitle: "Students, teachers, and societies",
        description:
          "A practical stack for academic life: assignments, events, focus blocks, and campus context in one place.",
        features: [
          {
            title: "Society Hub",
            description: (
              <>
                Keep{" "}
                <span className={styles.kclAccent}>
                  KCLSU
                </span>{" "}
                events and study groups organised alongside your academic schedule.
              </>
            ),
          },
          {
            title: "Uni Map",
            description: (
              <>
                Jump between study spaces across{" "}
                <span className={styles.kclAccent}>
                  Strand, Guy&apos;s, Waterloo, and other campuses
                </span>{" "}
                in one place.
              </>
            ),
          },
          {
            title: "Shared Planning",
            description:
              "Coordinate with peers and mentors through a calm, predictable planning workflow.",
          },
          {
            title: "Session History",
            description:
              "Review what mattered most each week and keep your routine improving over time.",
          },
        ],
      },
      {
        id: "discover",
        badge: "Discover",
        title: "Student-built routines",
        subtitle: "Students and teachers using Study Flax",
        description:
          "See what others are saying.",
        align: "left",
        content: <TestimonialsMarquee />,
      },
      {
        id: "start",
        badge: "Get Started",
        title: "Ready when you are",
        description:
          "Start in under a minute with a free account, then begin planning your week.",
        align: "left",
        content: (
          <div id="auth-form-card" className={styles.authFormCard}>
            <AuthForms {...state} handleToggle={state.handleToggle} />
          </div>
        ),
      },
    ],
    [showAuthForm, state],
  );

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
