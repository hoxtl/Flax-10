import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("framer-motion", () => ({
  motion: new Proxy({}, {
    get: (_, tag) => ({ children, ...props }) => {
      const Tag = typeof tag === "string" ? tag : "div";
      const rest = { ...props };
      delete rest.layoutId;
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      delete rest.transition;
      delete rest.layout;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("lucide-react", () => ({
  X: () => <svg aria-hidden="true" />,
}));

afterEach(() => {
  vi.doUnmock("react");
  vi.resetModules();
});

describe("TagsSelector null ref handling", () => {
  it("skips scrolling when the selected-tags ref node is unavailable", async () => {
    vi.doMock("react", async () => {
      const actual = await vi.importActual("react");
      return {
        ...actual,
        useRef: () => ({ current: null }),
      };
    });

    const { TagsSelector } = await import("../../../components/common/TagsSelector/TagsSelector");

    render(
      <TagsSelector
        tags={[{ id: 1, label: "Lecture" }]}
        selectedTags={[]}
        onSelectionChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Select tags to filter…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lecture" })).toBeInTheDocument();
  });
});
