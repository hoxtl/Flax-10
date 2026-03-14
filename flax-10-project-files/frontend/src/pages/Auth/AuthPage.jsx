import { useAuthPage } from "./hooks/useAuthPage";
import { useCallback, useMemo } from "react";
import StudyFlaxLandingPage from "../../components/ui/landing-page";
import styles from "./AuthPage.module.css";
import StudentStoryCarousel from "../../components/ui/StudentStoryCarousel";
import * as Components from "../../components/Authentication/AuthComponents";
import { SignUpForm } from "../../components/Authentication/SignUpForm";
import { SignInForm } from "../../components/Authentication/SignInForm";
import { AuthOverlay } from "../../components/Authentication/Overlay";
import { ErrorMessage } from "../../components/Authentication/ErrorMessage";
import { AuthFooter } from "../../components/Authentication/AuthBranding";

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
        description:
          "Study Flax blends scheduling, deadlines, and task planning into one simple workspace. Move through your day with fewer jumps and more momentum.",
        align: "left",
        actions: [
          { label: "Begin Journey", variant: "primary", onClick: () => showAuthForm(true) },
          { label: "Create Account", variant: "secondary", onClick: () => showAuthForm(false) },
        ],
      },
      {
        id: "features",
        badge: "Workflows",
        title: "Courses, deadlines, reminders",
        description:
          "See all your module work in one view and keep every module, task, and deadline connected so your study plan feels built for your life, not the other way around.",
        features: [
          {
            title: "Focus on what matters",
            description:
              "Turn busy days into clear priorities with one view of tasks, calendar events, and study sessions.",
          },
          {
            title: "Fewer context switches",
            description:
              "Move from plan to timer to tasks without hunting through separate tools.",
          },
          {
            title: "Consistent progress",
            description:
              "Keep momentum with lightweight tracking and reminders that are designed to support you.",
          },
        ],
      },
      {
        id: "discover",
        badge: "Discover",
        title: "Student-built routines",
        subtitle: "What other KCL students are using",
        description:
          "A rotating selection of Study Flax setups from students balancing classes, assignments, and social life.",
        align: "left",
        content: (
          <StudentStoryCarousel
            items={[
              {
                title: "Module planner",
                copy: "“I use two 50-minute blocks a day for modules and keep distractions to one place only.”",
              },
              {
                title: "Revision sprint",
                copy: "“Deadlines used to overwhelm me; now I can see every due date and push priorities in one glance.”",
              },
              {
                title: "Group balance",
                copy: "“It links my group work and my calendar so we stop double-booking meetings at 11pm.”",
              },
              {
                title: "Calm workflow",
                copy: "“The fewer jumps between apps, the more momentum I keep through the week.”",
              },
            ]}
          />
        ),
      },
      {
        id: "start",
        badge: "Get Started",
        title: "Ready when you are",
        subtitle: "Sign in or join quickly",
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
