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
        description: (
          <>
            Study Flax turns your academic routine into one calm planning space,
            designed for{" "}
            <span style={{ fontStyle: "italic", color: "#c40000" }}>
              King&apos;s College London
            </span>{" "}
            students balancing study, societies, and life.
          </>
        ),
        align: "left",
        actions: [
          { label: "Begin Journey", variant: "primary", onClick: () => showAuthForm(true) },
          { label: "Create Account", variant: "secondary", onClick: () => showAuthForm(false) },
        ],
      },
      {
        id: "features",
        badge: "Workflows",
        title: "Tasks, modules, reminders—everything in one place",
        description:
          "Study Flax brings your whole week into one clear workflow.",
        features: [
          {
            title: "Tasks",
            description:
              "Turn long to-dos into clear priorities with due dates, importance levels, and progress at a glance.",
          },
          {
            title: "Modules",
            description:
              "Track course and module goals from one hub so everything stays visible instead of disappearing into another app.",
          },
          {
            title: "Focus Timer",
            description:
              "Use session-first study blocks to stay steady, reduce overwhelm, and build sustainable momentum.",
          },
        ],
      },
      {
        id: "glimpse",
        badge: "Product Glimpse",
        title: "Built for how you work at KCL",
        subtitle: "Students, teachers, and societies",
        description:
          "A practical stack for academic life: assignments, events, focus blocks, and campus context.",
        features: [
          {
            title: "Society Hub",
            description:
              "Keep society events and study groups organized alongside your academic schedule.",
          },
          {
            title: "Uni Map",
            description:
              "Jump between study spaces, lecture buildings, and event locations from one place.",
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
        subtitle: "What other students and teachers are using",
        description:
          "A rotating selection of Study Flax setups from students balancing classes, assignments, and social life.",
        align: "left",
        content: <TestimonialsMarquee />,
      },
      {
        id: "start",
        badge: "Get Started",
        title: "Ready when you are",
        description:
          "Sign in with your username and password, or create your free account to start planning tonight.",
        align: "center",
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
    <div className={styles.pageWrap}>
      <StudyFlaxLandingPage sections={landingSections} />
      <div className={styles.formFooter}>
        <AuthFooter absolute />
      </div>
    </div>
  );
}
