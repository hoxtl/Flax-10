import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

vi.mock("../../../../components/common/card/Card", () => ({
  default: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
}));

vi.mock("../../../../components/common/primary_button/PrimaryButton", () => ({
  default: ({ children, ...props }) => <button type="button" {...props}>{children}</button>,
}));

import { CommonGroundSection } from "../../../../pages/profile/components/widgets/CommonGround";
import { StudyDNA } from "../../../../pages/profile/components/widgets/StudyDNA";
import { ThisWeek } from "../../../../pages/profile/components/widgets/ThisWeek";

describe("Profile remaining widget coverage", () => {
  it("renders nothing when common ground has no shared modules or societies", () => {
    const onNavigate = vi.fn();
    const { container, rerender } = render(
      <CommonGroundSection
        viewedModules={[]} viewedSocieties={[]}
        currentUserModules={[]} currentUserSocieties={[]}
        onNavigate={onNavigate}
      />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <CommonGroundSection
        viewedModules={undefined} viewedSocieties={undefined}
        currentUserModules={undefined} currentUserSocieties={undefined}
        onNavigate={onNavigate}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("navigates to modules from common ground section", () => {
    const onNavigate = vi.fn();
    const { rerender } = render(
      <CommonGroundSection
        viewedModules={[]} viewedSocieties={[]}
        currentUserModules={[]} currentUserSocieties={[]}
        onNavigate={onNavigate}
      />,
    );

    rerender(
      <CommonGroundSection
        viewedModules={["CS101", "MA102"]} viewedSocieties={[]}
        currentUserModules={["CS101"]} currentUserSocieties={[]}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "CS101" }));
    fireEvent.click(screen.getByRole("button", { name: "MA102" }));
    expect(onNavigate).toHaveBeenCalledWith("modules_CS101");
    expect(onNavigate).toHaveBeenCalledWith("modules_MA102");
  });

  it("navigates to societies from common ground section", () => {
    const onNavigate = vi.fn();
    render(
      <CommonGroundSection
        viewedModules={["CS101"]} viewedSocieties={[{ id: 1, name: "Chess" }]}
        currentUserModules={undefined} currentUserSocieties={undefined}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "CS101" }));
    fireEvent.click(screen.getByRole("button", { name: "Chess" }));
    expect(onNavigate).toHaveBeenCalledWith("modules_CS101");
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=1");
  });

  it("distinguishes shared vs non-shared societies in common ground", () => {
    const onNavigate = vi.fn();
    render(
      <CommonGroundSection
        viewedModules={[]} viewedSocieties={[{ id: 1, name: "Chess" }, { id: 2, name: "Dance" }]}
        currentUserModules={[]} currentUserSocieties={[{ id: 1, name: "Chess" }]}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Chess" }));
    fireEvent.click(screen.getByRole("button", { name: "Dance" }));
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=1");
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=2");
  });

  it("renders nothing for null heatmap in StudyDNA", () => {
    const { container } = render(<StudyDNA heatmap={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders StudyDNA with night segment and extra className", () => {
    render(
      <StudyDNA
        className="extra-class"
        heatmap={{
          data: [Array.from({ length: 24 }, (_, hour) => (hour === 1 || hour === 6 ? 60 : 0))],
        }}
      />,
    );
    expect(screen.getByText("STUDY DNA")).toBeInTheDocument();
    expect(screen.getByText("Night")).toBeInTheDocument();
    expect(screen.getByTestId("card").className).toContain("extra-class");

    render(
      <StudyDNA heatmap={{ data: [Array.from({ length: 24 }, () => 0)] }} />,
    );
    expect(screen.getAllByText("STUDY DNA").length).toBeGreaterThan(0);
  });

  it("covers this week solo layout without streak display", async () => {
    const onGoalSave = vi.fn().mockRejectedValueOnce(new Error("nope")).mockResolvedValueOnce(undefined);
    render(
      <ThisWeek
        weekly={{ percentage: 25, hours_studied: 5, goal_hours: 20 }}
        streaks={{ current: 1, longest: 2 }}
        onGoalSave={onGoalSave}
        showStreak={false}
      />,
    );

    expect(screen.queryByText("🔥 current")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /5h\s*\/20h/i }));
    fireEvent.change(document.querySelector('input[type="range"]'), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Save goal" }));

    await waitFor(() => expect(onGoalSave).toHaveBeenCalledWith(12));
    expect(screen.getByText("tap to close")).toBeInTheDocument();
  });

  it("covers this week successful save and panel close with streak visible", async () => {
    const onGoalSave = vi.fn().mockResolvedValueOnce(undefined);
    render(
      <ThisWeek
        weekly={{ percentage: 50, hours_studied: 6, goal_hours: 24 }}
        streaks={{ current: 1, longest: 2 }}
        onGoalSave={onGoalSave}
        showStreak
      />,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: /6h\s*\/24h/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /6h\s*\/24h/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Save goal" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Save goal" }));
    await waitFor(() => expect(onGoalSave).toHaveBeenCalledWith(24));
    await waitFor(() => expect(screen.queryByText("tap to close")).not.toBeInTheDocument());
  });
});
