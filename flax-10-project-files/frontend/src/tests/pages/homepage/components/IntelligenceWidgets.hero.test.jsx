import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => true,
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const { animate, initial, exit, transition, ...rest } = props;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
}));

<<<<<<< HEAD
vi.mock("@/components/welcome/WelcomeBackgroundPaths", () => ({
  default: () => <div data-testid="hero-paths" />,
}));

vi.mock("@/hooks/useCountUp", () => ({
=======
vi.mock("../../../../components/welcome/WelcomeBackgroundPaths", () => ({
  default: () => <div data-testid="hero-paths" />,
}));

vi.mock("../../../../hooks/useCountUp", () => ({
>>>>>>> main
  useCountUp: () => null,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
    useNavigate: () => navigateMock,
  };
});

vi.mock("lucide-react", () => {
  const Icon = () => <svg aria-hidden="true" />;
  return {
    AlertTriangle: Icon,
    BookOpen: Icon,
    Calendar: Icon,
    Clock3: Icon,
    GraduationCap: Icon,
    Train: Icon,
  };
});

<<<<<<< HEAD
vi.mock("@/pages/homepage/components/IntelligenceUtils", () => ({
=======
vi.mock("../../../../pages/homepage/components/IntelligenceUtils", () => ({
>>>>>>> main
  getGreeting: (name) => `Hello ${name || "there"}`,
  getTodayLabel: () => "MONDAY · 24 MAR",
}));

<<<<<<< HEAD
import { IntelligenceHero, StatusBanner } from "@/pages/homepage/components/IntelligenceWidgets";
=======
import { IntelligenceHero } from "../../../../pages/homepage/components/IntelligenceWidgets";
>>>>>>> main

describe("IntelligenceHero", () => {
  it("renders the greeting, live context, and basic stats", () => {
    render(
      <MemoryRouter>
        <IntelligenceHero
          displayName="Ava"
          attendancePct={88}
          classesCount={2}
          liveContext={{ iconKey: "Train", label: "Travel", text: "Minor delays", meta: "Northern · Strand", tone: "warning" }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("MONDAY · 24 MAR")).toBeInTheDocument();
    expect(screen.getByText("Hello Ava")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("Minor delays")).toBeInTheDocument();
  });

  it("links to correct internal pages from stat shortcuts", () => {
    render(
      <MemoryRouter>
        <IntelligenceHero
          upcomingSocietyEventsCount={4}
          tasksCount={3}
          deadlinesCount={1}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /tasks to do/i })).toHaveAttribute("href", "/tasks?filter=today");
    expect(screen.getByRole("link", { name: /upcoming deadlines/i })).toHaveAttribute("href", "/modules?filter=enrolled");
    expect(screen.getByRole("link", { name: /society events coming up/i })).toHaveAttribute("href", "/societies");
    expect(screen.getByRole("link", { name: /view my attendance/i })).toHaveAttribute("href", "/attendance");
  });

  it("renders the course change banner and handles navigation", () => {
    render(<MemoryRouter><IntelligenceHero isTeacher courseChangeRequest={{ requested_course: "Physics" }} /></MemoryRouter>);
    expect(screen.getByText(/Course switch pending/)).toBeInTheDocument();
    fireEvent.click(screen.getByText("View"));
    expect(navigateMock).toHaveBeenCalledWith("/settings?tab=account");
  });

  it("handles course change request dismissal", () => {
    const onDismiss = vi.fn();
    render(<MemoryRouter><IntelligenceHero isTeacher courseChangeRequest={{ requested_course: "P" }} onDismissCourseChange={onDismiss} /></MemoryRouter>);
    fireEvent.click(screen.getByText("×"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders teacher-specific stat labels", () => {
    render(<MemoryRouter><IntelligenceHero isTeacher /></MemoryRouter>);
    expect(screen.getByText("Teaching today")).toBeInTheDocument();
    expect(screen.getByText("Teaching deadlines")).toBeInTheDocument();
  });

  it("renders status banner text without an icon when icon is omitted", () => {
    render(
      <MemoryRouter>
        <StatusBanner cta="/tasks" icon={null} onDismiss={vi.fn()} text="Banner only" />
      </MemoryRouter>,
    );
    expect(screen.getByText("Banner only")).toBeInTheDocument();
  });

  it("applies warning styling to teacher deadline stats when counts are positive", () => {
    const { container } = render(
      <MemoryRouter>
        <IntelligenceHero isTeacher deadlinesCount={2} />
      </MemoryRouter>,
    );
    expect(container.querySelector('[class*="valueWarning"]')).toBeTruthy();
  });
});
