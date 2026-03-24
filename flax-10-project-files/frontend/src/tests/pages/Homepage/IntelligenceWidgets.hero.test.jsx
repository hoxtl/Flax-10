import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const navigateMock = vi.fn();

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const { animate, initial, exit, transition, ...rest } = props;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
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
  it("renders live context, metrics, suggestion text, and analytics link", () => {
    render(
      <MemoryRouter>
        <IntelligenceHero
          currentStreak="4 day streak"
          displayName="Ava"
          eventsCount={2}
          liveContext={{ iconKey: "Train", label: "Travel", text: "Minor delays", meta: "Northern · Strand", tone: "warning" }}
          nextStep="Review flashcards"
          nextStepMeta="20 minutes"
          tasksCount={3}
          weeklyProgress="60%"
          courseChangeRequest={null}
          teacherRequestPending={false}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("MONDAY · 24 MAR")).toBeInTheDocument();
    expect(screen.getByText("Hello Ava")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("Minor delays")).toBeInTheDocument();
    expect(screen.getByText("Northern · Strand")).toBeInTheDocument();
    expect(screen.getByText("Review flashcards")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("View Stats →")).toHaveAttribute("href", "/analytics?period=7&tab=Overview&from=homepage-banner");
  });

  it("renders banners and analytics pills and handles dismiss/view actions", () => {
    const onDismissCourseChange = vi.fn();
    const onDismissTeacherRequest = vi.fn();
    render(
      <MemoryRouter>
        <IntelligenceHero
          currentStreak="7 day streak"
          displayName=""
          eventsCount={1}
          liveContext={{ iconKey: "Clock3", label: "Status", text: "You have breathing room", meta: null, tone: "neutral" }}
          nextStep="Keep going"
          nextStepMeta=""
          tasksCount={0}
          weeklyProgress="80%"
          courseChangeRequest={{ requested_course: "Physics BSc" }}
          teacherRequestPending
          onDismissCourseChange={onDismissCourseChange}
          onDismissTeacherRequest={onDismissTeacherRequest}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Course switch pending to/)).toBeInTheDocument();
    expect(screen.getByText("Teacher application is under review")).toBeInTheDocument();
    expect(screen.getByText("7 day streak")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("View")[0]);
    fireEvent.click(screen.getAllByText("View")[1]);
    expect(navigateMock).toHaveBeenCalledWith("/settings?tab=account");
    expect(navigateMock).toHaveBeenCalledWith("/settings?tab=course");

    fireEvent.click(screen.getAllByText("×")[0]);
    fireEvent.click(screen.getAllByText("×")[1]);
    expect(onDismissCourseChange).toHaveBeenCalledOnce();
    expect(onDismissTeacherRequest).toHaveBeenCalledOnce();
  });
});
