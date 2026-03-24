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

vi.mock("../../../components/Welcome/WelcomeBackgroundPaths", () => ({
  default: () => <div data-testid="hero-paths" />,
}));

vi.mock("../../../hooks/useCountUp", () => ({
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

vi.mock("../../../pages/Homepage/components/IntelligenceUtils", () => ({
  getGreeting: (name) => `Hello ${name || "there"}`,
  getTodayLabel: () => "MONDAY · 24 MAR",
}));

import { IntelligenceHero } from "../../../pages/Homepage/components/IntelligenceWidgets";

describe("IntelligenceHero", () => {
  it("renders the live context and homepage stat links", () => {
    render(
      <MemoryRouter>
        <IntelligenceHero
          displayName="Ava"
          attendancePct={88}
          classesCount={2}
          deadlinesCount={1}
          liveContext={{ iconKey: "Train", label: "Travel", text: "Minor delays", meta: "Northern · Strand", tone: "warning" }}
          upcomingSocietyEventsCount={4}
          tasksCount={3}
          courseChangeRequest={null}
          isTeacher={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("MONDAY · 24 MAR")).toBeInTheDocument();
    expect(screen.getByText("Hello Ava")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("Minor delays")).toBeInTheDocument();
    expect(screen.getByText("Northern · Strand")).toBeInTheDocument();
    expect(screen.getByText("Classes today")).toBeInTheDocument();
    expect(screen.getByText("Tasks to do")).toBeInTheDocument();
    expect(screen.getByText("Upcoming deadlines")).toBeInTheDocument();
    expect(screen.getByText("Upcoming societies")).toBeInTheDocument();
    expect(screen.getByText("Attendance")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tasks to do/i })).toHaveAttribute("href", "/tasks?filter=today");
    expect(screen.getByRole("link", { name: /upcoming deadlines/i })).toHaveAttribute("href", "/modules?filter=enrolled");
    expect(screen.getByRole("link", { name: /society events coming up/i })).toHaveAttribute("href", "/societies");
    expect(screen.getByRole("link", { name: /view my attendance/i })).toHaveAttribute("href", "/attendance");
  });

  it("renders the course change banner and teacher stat labels", () => {
    const onDismissCourseChange = vi.fn();
    render(
      <MemoryRouter>
        <IntelligenceHero
          displayName=""
          attendancePct={92}
          classesCount={1}
          deadlinesCount={5}
          liveContext={{ iconKey: "Clock3", label: "Status", text: "You have breathing room", meta: null, tone: "neutral" }}
          upcomingSocietyEventsCount={0}
          tasksCount={0}
          courseChangeRequest={{ requested_course: "Physics BSc" }}
          isTeacher
          onDismissCourseChange={onDismissCourseChange}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Course switch pending to/)).toBeInTheDocument();
    expect(screen.getByText("Teaching today")).toBeInTheDocument();
    expect(screen.getByText("Teaching deadlines")).toBeInTheDocument();

    fireEvent.click(screen.getByText("View"));
    expect(navigateMock).toHaveBeenCalledWith("/settings?tab=account");

    fireEvent.click(screen.getByText("×"));
    expect(onDismissCourseChange).toHaveBeenCalledOnce();
  });
});
