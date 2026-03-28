import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  useReducedMotion: () => false,
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const { animate, initial, exit, transition, ...rest } = props;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
}));

vi.mock("@/components/welcome/WelcomeBackgroundPaths", () => ({
  default: () => <div data-testid="hero-paths" />,
}));

vi.mock("@/hooks/useCountUp", () => ({
  useCountUp: () => null,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
    useNavigate: () => vi.fn(),
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

vi.mock("@/pages/homepage/components/IntelligenceUtils", () => ({
  getGreeting: () => "Hello",
  getTodayLabel: () => "TODAY",
}));

vi.mock("@/components/common/stat_strip/StatStrip", () => ({
  default: () => <div data-testid="stat-strip" />,
}));

import { IntelligenceHero } from "@/pages/homepage/components/IntelligenceWidgets";

describe("IntelligenceHero motion paths", () => {
  it("runs animated banner layers when reduced motion is off", () => {
    render(
      <MemoryRouter>
        <IntelligenceHero
          courseChangeRequest
          displayName="Bo"
          liveContext={{ iconKey: "Clock3", label: "Now", meta: "M", text: "Hi", tone: "neutral" }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByTestId("hero-paths")).toBeInTheDocument();
    expect(screen.getByText("Hi")).toBeInTheDocument();
    expect(screen.getByText(/Course switch pending$/)).toBeInTheDocument();
  });
});
