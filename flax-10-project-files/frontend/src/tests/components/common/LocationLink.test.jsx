import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("lucide-react", () => ({
    MapPin: ({ className, size, ...props }) => <svg data-testid="map-pin" data-size={size} className={className} {...props} />,
}));

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        Link: ({ to, className, children, onClick, "aria-label": ariaLabel }) => (
            <a
                href={to}
                className={className}
                aria-label={ariaLabel}
                onClick={(event) => {
                    event.preventDefault();
                    onClick?.(event);
                }}
            >
                {children}
            </a>
        ),
    };
});

vi.mock("../../../components/common/LocationLink/LocationLink.module.css", () => ({ default: { link: "link", icon: "icon", text: "text" } }));

import LocationLink from "../../../components/common/LocationLink/LocationLink";

describe("LocationLink", () => {
    it("returns null when location is missing", () => {
        const { container } = render(<LocationLink />);
        expect(container.firstChild).toBeNull();
    });

    it("builds a default map link with icon and classes", () => {
        render(<LocationLink location="Bush House" className="extra" iconClassName="icon-extra" textClassName="text-extra" iconSize={20} onClick={vi.fn()} />);

        const link = screen.getByRole("link", { name: "Open UniMap for Bush House" });
        expect(link).toHaveAttribute("href", "/map?destination=Bush%20House");
        expect(link.className).toContain("link");
        expect(link.className).toContain("extra");
        expect(screen.getByTestId("map-pin")).toHaveAttribute("data-size", "20");
        expect(screen.getByTestId("map-pin").getAttribute("class")).toContain("icon-extra");
        expect(screen.getByText("Bush House").getAttribute("class")).toContain("text-extra");
    });

    it("supports a custom destination and hides the icon", () => {
        const onClick = vi.fn();
        render(<LocationLink location="Waterloo" to="/custom" showIcon={false} onClick={onClick} />);

        fireEvent.click(screen.getByRole("link", { name: "Open UniMap for Waterloo" }));
        expect(onClick).toHaveBeenCalled();
        expect(screen.queryByTestId("map-pin")).toBeNull();
        expect(screen.getByRole("link")).toHaveAttribute("href", "/custom");
    });

    it("uses the default icon size and class names when optional props are omitted", () => {
        render(<LocationLink location="Strand Campus" />);

        expect(screen.getByTestId("map-pin")).toHaveAttribute("data-size", "14");
        expect(screen.getByTestId("map-pin")).toHaveAttribute("class", "icon");
        expect(screen.getByText("Strand Campus")).toHaveAttribute("class", "text");
    });
});
