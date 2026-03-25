import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, waitFor } from "@testing-library/react";

const getModulesMock = vi.fn();
const useCountUpMock = vi.fn((value) => ({ current: value }));

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

vi.mock("../../../../api/moduleApi", () => ({
  getModules: (...args) => getModulesMock(...args),
}));

vi.mock("../../../../hooks/useCountUp", () => ({
  useCountUp: (...args) => useCountUpMock(...args),
}));

import {
  BadgesBanner,
  ModulesSection,
  ModulesSocietiesWidget,
  PersonaCard,
  QuickStatsRail,
  SocietiesSection,
  StudyDNA,
} from "../../../../pages/Profile/components/ProfileWidgets";
import { CommonGroundSection } from "../../../../pages/Profile/components/widgets/CommonGround";
import ProfileWidget from "../../../../pages/Profile/components/widgets/ProfileWidget";
import { buildButtonActionProps, buildNavigateAction } from "../../../../pages/Profile/components/widgets/widgetActionProps";
import { useModuleNameMap } from "../../../../pages/Profile/components/widgets/ModulesSocieties";

describe("profile widget extras", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getModulesMock.mockResolvedValue([
      { module_code: "CS101", module_name: "Intro to CS" },
      { module_code: "MA102", module_name: "Calculus" },
    ]);
  });

  it("shared profile widgets render from their public modules", () => {
    render(
      <>
        <ProfileWidget title="Widget">Child</ProfileWidget>
        <PersonaCard persona={{ label: "Night Owl", emoji: "🦉", description: "Learns late." }} peakHour={0} />
        <StudyDNA heatmap={{ data: [Array(24).fill(1)] }} />
      </>
    );

    expect(screen.getByText("Widget")).toBeInTheDocument();
    expect(screen.getByText("Based on your 12am peak")).toBeInTheDocument();
    expect(screen.getByText("STUDY DNA")).toBeInTheDocument();
  });

  it("quick stats rounds hours and hides zero items when requested", () => {
    const { rerender, container } = render(
      <QuickStatsRail totalHours={3.6} sessionCount={0} moduleCount={2} hideZeroItems />
    );

    expect(useCountUpMock).toHaveBeenCalledWith(4, 1200);
    expect(screen.getByText("Total Focus")).toBeInTheDocument();
    expect(screen.queryByText("Sessions")).not.toBeInTheDocument();
    expect(screen.getByText("Modules")).toBeInTheDocument();

    rerender(<QuickStatsRail totalHours={0} sessionCount={0} moduleCount={0} hideZeroItems />);
    expect(container.firstChild).toBeNull();
  });

  it("renders zero-value items when hideZeroItems is omitted", () => {
    render(<QuickStatsRail totalHours={1.2} sessionCount={0} moduleCount={0} />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
  });

  it("badges banner supports click and keyboard activation", () => {
    const onOpen = vi.fn();
    const badges = Array.from({ length: 11 }, (_, index) => ({
      id: index + 1,
      tier: index % 2 ? "gold" : "silver",
      emoji: "🏅",
      label: `Badge ${index + 1}`,
      description: `Badge ${index + 1} description`,
    }));

    const { rerender, container } = render(<BadgesBanner badges={[]} onOpen={onOpen} />);
    expect(container.firstChild).toBeNull();

    rerender(<BadgesBanner badges={badges} onOpen={onOpen} />);
    const banner = screen.getByRole("button");
    fireEvent.click(banner);
    fireEvent.keyDown(banner, { key: "Enter" });
    fireEvent.keyDown(banner, { key: " " });

    expect(onOpen).toHaveBeenCalledTimes(3);
    expect(screen.getByText("Badge 10")).toBeInTheDocument();
    expect(screen.queryByText("Badge 11")).not.toBeInTheDocument();
  });

  it("loads module names for widgets and supports society tabs", async () => {
    const onNavigate = vi.fn();
    render(
      <ModulesSocietiesWidget
        modules={["CS101"]}
        societies={[{ id: 7, name: "Tech Society" }]}
        onNavigate={onNavigate}
        role="student"
        canViewSocieties
      />
    );

    await screen.findByText("Intro to CS");
    fireEvent.click(screen.getByRole("button", { name: "Societies" }));
    fireEvent.click(screen.getByText("Tech Society"));
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=7");
  });

  it("covers hidden tabs, tab resets, and society fallback avatars", async () => {
    const onNavigate = vi.fn();
    const { rerender } = render(
      <ModulesSocietiesWidget
        modules={["CS101"]}
        societies={[{ name: "No Id Society" }]}
        onNavigate={onNavigate}
        role="student"
        canViewSocieties={false}
      />
    );

    await screen.findByText("Intro to CS");
    expect(screen.queryByRole("button", { name: "Societies" })).toBeNull();

    rerender(
      <ModulesSocietiesWidget
        modules={["CS101"]}
        societies={[{ id: 9, name: "Fallback Society" }]}
        onNavigate={onNavigate}
        role="student"
        canViewSocieties
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Societies" }));
    fireEvent.click(screen.getByRole("button", { name: "Modules" }));
    expect(screen.getByText("CS101")).toBeInTheDocument();

    rerender(
      <ModulesSocietiesWidget
        modules={["CS101"]}
        societies={null}
        onNavigate={onNavigate}
        role="student"
        canViewSocieties
      />
    );
    expect(screen.queryByText("Fallback Society")).toBeNull();
  });

  it("keeps the societies tab stable when societies become null", async () => {
    const onNavigate = vi.fn();
    const { rerender } = render(
      <ModulesSocietiesWidget
        modules={["CS101"]}
        societies={[{ id: 4, name: "Music Society" }]}
        onNavigate={onNavigate}
        role="student"
        canViewSocieties
      />
    );

    await screen.findByText("Intro to CS");
    fireEvent.click(screen.getByRole("button", { name: "Societies" }));
    expect(screen.getByText("Music Society")).toBeInTheDocument();

    rerender(
      <ModulesSocietiesWidget
        modules={["CS101"]}
        societies={null}
        onNavigate={onNavigate}
        role="student"
        canViewSocieties
      />
    );

    expect(screen.queryByText("Music Society")).toBeNull();
  });

  it("renders teacher modules directly and returns null for students without modules", async () => {
    const onNavigate = vi.fn();
    const { rerender, container } = render(
      <ModulesSocietiesWidget modules={["CS101"]} societies={[]} onNavigate={onNavigate} role="teacher" />
    );

    await screen.findByText("Modules I Teach");
    fireEvent.click(screen.getByText("CS101"));
    expect(onNavigate).toHaveBeenCalledWith("modules_CS101");

    rerender(<ModulesSocietiesWidget modules={[]} societies={[]} onNavigate={onNavigate} role="student" />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("renders teacher cards without names and society initials without navigation ids", async () => {
    const onNavigate = vi.fn();
    getModulesMock.mockResolvedValueOnce([{ module_code: "CS101", module_name: null }]);
    const { rerender } = render(<ModulesSocietiesWidget modules={["CS101"]} societies={[]} onNavigate={onNavigate} role="teacher" />);

    await screen.findByText("Teaching module");
    fireEvent.click(screen.getByText("CS101"));
    expect(onNavigate).toHaveBeenCalledWith("modules_CS101");

    rerender(<ModulesSocietiesWidget modules={["CS101"]} societies={[{ name: "Art Club" }]} onNavigate={onNavigate} role="student" canViewSocieties />);
    fireEvent.click(screen.getByRole("button", { name: "Societies" }));
    fireEvent.click(screen.getByText("Art Club"));
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("covers standalone module and society sections, including empty and image branches", async () => {
    const onNavigate = vi.fn();
    const { rerender, container } = render(
      <ModulesSection modules={["CS101"]} onNavigate={onNavigate} role="student" />
    );

    await screen.findByText("Intro to CS");
    fireEvent.click(screen.getByText("CS101"));
    expect(onNavigate).toHaveBeenCalledWith("modules_CS101");

    rerender(<ModulesSection modules={[]} onNavigate={onNavigate} role="student" />);
    expect(container.firstChild).toBeNull();

    rerender(<SocietiesSection societies={[{ id: 4, name: "Image Society", image: "/cover.png" }]} onNavigate={onNavigate} />);
    expect(screen.getByAltText("Image Society")).toHaveAttribute("src", "/cover.png");
    fireEvent.click(screen.getByText("Image Society"));
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=4");

    rerender(<SocietiesSection societies={[]} onNavigate={onNavigate} />);
    expect(container.firstChild).toBeNull();
  });

  it("profile widget adds pointer cursor when clickable", () => {
    const onClick = vi.fn();
    render(
      <ProfileWidget title="Clickable" action={<span>Action</span>} onClick={onClick}>
        Child
      </ProfileWidget>
    );

    const card = screen.getByText("Clickable").closest('[style*="cursor: pointer"]');
    expect(card).not.toBeNull();
    fireEvent.click(screen.getByText("Child"));
    expect(onClick).toHaveBeenCalled();
  });

  it("builds interactive action props and keyboard navigation handlers", () => {
    const onNavigate = vi.fn();
    const navigate = buildNavigateAction(onNavigate, "analytics");
    navigate();
    expect(onNavigate).toHaveBeenCalledWith("analytics");

    const onActivate = vi.fn();
    const props = buildButtonActionProps(true, onActivate);
    const preventDefault = vi.fn();
    props.onKeyDown({ key: "Enter", preventDefault });
    props.onKeyDown({ key: " ", preventDefault });
    props.onKeyDown({ key: "Tab", preventDefault });

    expect(props.role).toBe("button");
    expect(props.tabIndex).toBe(0);
    expect(onActivate).toHaveBeenCalledTimes(2);
    expect(preventDefault).toHaveBeenCalledTimes(2);
    expect(buildButtonActionProps(false, onActivate)).toEqual({});
  });

  it("renders common ground cards and navigates to shared items", () => {
    const onNavigate = vi.fn();
    render(
      <CommonGroundSection
        viewedModules={["CS101", "MA102"]}
        viewedSocieties={[{ id: 1, name: "Chess" }, { id: 2, name: "Dance" }]}
        currentUserModules={["CS101"]}
        currentUserSocieties={[{ id: 2, name: "Dance" }]}
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByText("CS101"));
    fireEvent.click(screen.getByText("MA102"));
    fireEvent.click(screen.getByText("Chess"));
    fireEvent.click(screen.getByText("Dance"));

    expect(onNavigate).toHaveBeenCalledWith("modules_CS101");
    expect(onNavigate).toHaveBeenCalledWith("modules_MA102");
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=1");
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=2");
  });

  it("useModuleNameMap handles results payloads and API failures", async () => {
    getModulesMock.mockResolvedValueOnce({ results: [{ module_code: "XY1", module_name: "Extra" }] });
    const success = renderHook(() => useModuleNameMap());
    await waitFor(() => expect(success.result.current).toEqual({ XY1: "Extra" }));

    getModulesMock.mockResolvedValueOnce({});
    const emptyPayload = renderHook(() => useModuleNameMap());
    await waitFor(() => expect(emptyPayload.result.current).toEqual({}));

    getModulesMock.mockRejectedValueOnce(new Error("fail"));
    const failure = renderHook(() => useModuleNameMap());
    await waitFor(() => expect(failure.result.current).toEqual({}));
  });
});
