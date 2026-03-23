/*
 * Badge, module, and society profile widget tests.
 */

import { describe, it } from "vitest";
import { BadgesSection, expect, fireEvent, ModulesSection, render, screen, SocietiesSection, vi, waitFor } from "./ProfileWidgets.shared";

describe("BadgesSection", () => {
  it("renders badge count and grid", () => {
    const badges = [{ id: 1, tier: "gold", label: "Focus", emoji: "🏅", description: "d1" }, { id: 2, tier: "silver", label: "Streak", emoji: "🔥", description: "d2" }, { id: 3, tier: "bronze", label: "First", emoji: "⭐", description: "d3" }];
    const onOpen = vi.fn();
    render(<BadgesSection badges={badges} onOpen={onOpen} />);
    expect(screen.getByText("ACHIEVEMENTS")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("/ 26 unlocked")).toBeTruthy();
    expect(screen.getByText("View all →")).toBeTruthy();
    fireEvent.click(screen.getByText("ACHIEVEMENTS"));
    expect(onOpen).toHaveBeenCalled();
  });

  it("uses fallback tier when tier unknown", () => {
    render(<BadgesSection badges={[{ id: 1, tier: "unknown", label: "X", emoji: "❓", description: "d" }]} onOpen={vi.fn()} />);
    expect(screen.getByText("X")).toBeTruthy();
  });

  it("shows 0 when badges empty", () => {
    render(<BadgesSection badges={[]} onOpen={vi.fn()} />);
    expect(screen.getByText("0")).toBeTruthy();
  });
});

describe("ModulesSection", () => {
  it("returns null when modules is empty", async () => {
    const { container } = render(<ModulesSection modules={[]} />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("returns null when modules is undefined", async () => {
    const { container } = render(<ModulesSection />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("returns null for teachers when no taught modules exist yet", async () => {
    const { container } = render(<ModulesSection modules={[]} role="teacher" onNavigate={vi.fn()} />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it("renders module codes and names from API", async () => {
    const { getModules } = await import("../../../../api/moduleApi");
    getModules.mockResolvedValue([{ module_code: "CS101", module_name: "Intro to CS" }]);
    render(<ModulesSection modules={["CS101"]} onNavigate={vi.fn()} />);
    await screen.findByText("Intro to CS");
    expect(screen.getByText("CS101")).toBeTruthy();
  });

  it("calls onNavigate with modules_ code when module card clicked", async () => {
    const onNavigate = vi.fn();
    render(<ModulesSection modules={["MA102"]} onNavigate={onNavigate} />);
    await screen.findByText("MODULES");
    fireEvent.click(screen.getByText("MA102"));
    expect(onNavigate).toHaveBeenCalledWith("modules_MA102");
  });

  it("uses teacher heading for professor profiles", async () => {
    render(<ModulesSection modules={["EC4202"]} role="teacher" onNavigate={vi.fn()} />);
    await screen.findByText("Modules I Teach");
    expect(screen.getByText("EC4202")).toBeTruthy();
  });

  it("handles getModules returning results array", async () => {
    const { getModules } = await import("../../../../api/moduleApi");
    getModules.mockResolvedValue({ results: [{ module_code: "XY1", module_name: "Extra" }] });
    render(<ModulesSection modules={["XY1"]} />);
    await screen.findByText("Extra");
    expect(screen.getByText("Extra")).toBeTruthy();
  });

  it("handles getModules reject", async () => {
    const { getModules } = await import("../../../../api/moduleApi");
    getModules.mockRejectedValueOnce(new Error("Network error"));
    render(<ModulesSection modules={["CS101"]} />);
    expect(screen.getByText("MODULES")).toBeTruthy();
    expect(screen.getByText("CS101")).toBeTruthy();
  });
});

describe("SocietiesSection", () => {
  it("returns null when societies is empty", () => {
    const { container } = render(<SocietiesSection societies={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null when societies is undefined", () => {
    const { container } = render(<SocietiesSection />);
    expect(container.firstChild).toBeNull();
  });

  it("renders society with cover_image", () => {
    render(<SocietiesSection societies={[{ id: 1, name: "Tech Soc", cover_image: "https://example.com/cover.jpg" }]} onNavigate={vi.fn()} />);
    expect(screen.getByText("SOCIETIES JOINED")).toBeTruthy();
    expect(screen.getByText("Tech Soc")).toBeTruthy();
    expect(document.querySelector('img[alt="Tech Soc"]')?.src).toContain("example.com/cover.jpg");
  });

  it("renders society with image fallback when no cover_image", () => {
    render(<SocietiesSection societies={[{ id: 2, name: "Art Club" }]} onNavigate={vi.fn()} />);
    expect(screen.getByText("Art Club")).toBeTruthy();
    expect(screen.getByText("A")).toBeTruthy();
  });

  it("uses image when cover_image missing but image present", () => {
    render(<SocietiesSection societies={[{ id: 3, name: "Soc", image: "https://example.com/img.png" }]} onNavigate={vi.fn()} />);
    expect(document.querySelector('img[alt="Soc"]')?.src).toContain("example.com/img.png");
  });

  it("calls onNavigate when society card clicked", () => {
    const onNavigate = vi.fn();
    render(<SocietiesSection societies={[{ id: 1, name: "Soc" }]} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Soc"));
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=1");
  });

  it("uses society_id when id is not present", () => {
    const onNavigate = vi.fn();
    render(<SocietiesSection societies={[{ society_id: 42, name: "Athletics Club" }]} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText("Athletics Club"));
    expect(onNavigate).toHaveBeenCalledWith("/societies?id=42");
  });
});
