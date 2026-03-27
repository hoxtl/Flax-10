import { beforeEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const navigateMock = vi.fn();

vi.mock("lucide-react", () => ({
    MapPin: ({ className, size, ...props }) => <svg data-testid="map-pin" data-size={size} className={className} {...props} />,
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

vi.mock("../../../components/common/location_link/LocationLink.module.css", () => ({ default: { link: "link", icon: "icon", text: "text" } }));

import LocationLink from "../../../components/common/location_link/LocationLink";

describe("LocationLink", () => {
    beforeEach(() => {
        navigateMock.mockReset();
    });

    it("returns null when location is missing", () => {
        const { container } = render(<LocationLink />);
        expect(container.firstChild).toBeNull();
    });

    it("builds a default map button with icon and classes", () => {
        const dispatchSpy = vi.spyOn(window, "dispatchEvent");
        render(<LocationLink location="Bush House" className="extra" iconClassName="icon-extra" textClassName="text-extra" iconSize={20} onClick={vi.fn()} />);

        const button = screen.getByRole("button", { name: "Open UniMap for Bush House" });
        fireEvent.click(button);
        expect(button.className).toContain("link");
        expect(button.className).toContain("extra");
        expect(screen.getByTestId("map-pin")).toHaveAttribute("data-size", "20");
        expect(screen.getByTestId("map-pin").getAttribute("class")).toContain("icon-extra");
        expect(screen.getByText("Bush House").getAttribute("class")).toContain("text-extra");
        expect(navigateMock).toHaveBeenCalledWith("/map?destination=Bush%20House", { replace: false });
        const navEvent = dispatchSpy.mock.calls.find(([event]) => event.type === "navigate")?.[0];
        expect(navEvent?.detail).toBe("map");
        dispatchSpy.mockRestore();
    });

    it("supports a custom destination and hides the icon", () => {
        const onClick = vi.fn();
        render(<LocationLink location="Waterloo" to="/custom" showIcon={false} onClick={onClick} />);

        fireEvent.click(screen.getByRole("button", { name: "Open UniMap for Waterloo" }));
        expect(onClick).toHaveBeenCalled();
        expect(screen.queryByTestId("map-pin")).toBeNull();
        expect(navigateMock).toHaveBeenCalledWith("/custom", { replace: false });
    });

    it("uses the default icon size and class names when optional props are omitted", () => {
        render(<LocationLink location="Strand Campus" />);

        expect(screen.getByTestId("map-pin")).toHaveAttribute("data-size", "14");
        expect(screen.getByTestId("map-pin")).toHaveAttribute("class", "icon");
        expect(screen.getByText("Strand Campus")).toHaveAttribute("class", "text");
    });
});
