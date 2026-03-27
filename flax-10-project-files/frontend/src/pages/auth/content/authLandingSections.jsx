/*
 * Auth landing page section builders.
 */

import { TestimonialsMarquee } from "../../../components/Auth/components/TestimonialsMarquee";
import { AuthForms } from "../components/AuthForms";

function createHeroDescription(styles) {
  return (
    <>
      Study Flax helps{" "}
      <span className={styles.kclAccent}>King&apos;s College London</span>{" "}
      students and teachers manage their time with one calm workflow for
      deadlines, tasks, modules, lectures, and focus sessions.
    </>
  );
}

function createGlimpseDescription(styles) {
  return (
    <>
      Keep <span className={styles.kclAccent}>KCLSU</span> events and study
      groups organised alongside your academic schedule.
    </>
  );
}

function createCampusDescription(styles) {
  return (
    <>
      Jump between study spaces across{" "}
      <span className={styles.kclAccent}>
        Strand, Guy&apos;s, Waterloo, and other campuses
      </span>{" "}
      in one place.
    </>
  );
}

function createHeroSection(showSignIn, styles) {
  return {
    id: "hero",
    badge: "Study Flax",
    title: "StudyFlax",
    subtitle: "Built for calm study.",
    pills: ["Calendar", "Tasks", "Deadlines", "Group Projects", "Uni Map", "Analytics", "Venio Insights"],
    description: createHeroDescription(styles),
    align: "left",
    actions: [{ label: "Begin Journey", variant: "primary", onClick: showSignIn }],
  };
}

function createFeatureSection() {
  return {
    id: "features",
    badge: "Workflows",
    title: "Command your academic week",
    description: "Keep deadlines, lectures, and focus blocks in one calm, clear workflow.",
    features: [
      { title: "Tasks & Priorities", description: "Turn long to-dos into clear priorities with due dates, importance levels, and progress." },
      { title: "Modules", description: "Keep each module's assessments and revision work visible in one place." },
      { title: "Focus Timer", description: "Use focused study sessions to protect momentum when assignments build up." },
      { title: "Calendar", description: "Coordinate deadlines, lectures, and commitments from one timeline." },
    ],
  };
}

function createGlimpseSection(styles) {
  return {
    id: "glimpse",
    badge: "Product Glimpse",
    title: "Built for how you work at KCL",
    subtitle: "Students, teachers, and societies",
    description: "A practical stack for academic life: assignments, events, focus blocks, and campus context in one place.",
    features: [
      { title: "Society Hub", description: createGlimpseDescription(styles) },
      { title: "Uni Map", description: createCampusDescription(styles) },
      { title: "Shared Planning", description: "Coordinate with peers and mentors through a calm, predictable planning workflow." },
      { title: "Session History", description: "Review what mattered most each week and keep your routine improving over time." },
    ],
  };
}

function createDiscoverSection() {
  return {
    id: "discover",
    badge: "Discover",
    title: "Student-built routines",
    subtitle: "Students and teachers using Study Flax",
    description: "See what others are saying.",
    align: "left",
    content: <TestimonialsMarquee />,
  };
}

function createStartSection(state) {
  return {
    id: "start",
    badge: "Get Started",
    title: "Ready when you are",
    description: "Start in under a minute with a free account, then begin planning your week.",
    align: "left",
    content: <AuthForms {...state} />,
  };
}

export function buildAuthLandingSections(state, styles, actions) {
  return [
    createHeroSection(actions.showSignIn, styles),
    createFeatureSection(),
    createGlimpseSection(styles),
    createDiscoverSection(),
    createStartSection(state),
  ];
}
